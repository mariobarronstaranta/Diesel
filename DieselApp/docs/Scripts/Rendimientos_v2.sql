-- =====================================================
-- Funciones: reporte_rendimientos_v2 / get_rendimientos_detalle_v2
-- Propósito:
--   Implementar el reporte consolidado de rendimiento por unidad y su detalle asociado.
--
-- Comentarios de desarrollador:
--   - `reporte_rendimientos_v2` consolida KPI por unidad, no por tanque.
--   - Si `p_id_tanque` viene informado, solo define unidades objetivo.
--   - El cálculo final usa todas las cargas de esas unidades dentro del periodo.
--   - `get_rendimientos_detalle_v2` expone el detalle cronológico por movimiento
--     y agrega columnas de referencia con valores previos inmediatos.
--   - Este archivo crea dos funciones relacionadas; desplegarlo completo.
--
-- HowTo:
--   - Ejecutar este script completo en Supabase SQL Editor.
--   - Probar el resumen con:
--     SELECT * FROM public.reporte_rendimientos_v2('2026-04-01', '2026-04-30', 'MTY', NULL, NULL);
--   - Probar el detalle con una unidad resultante:
--     SELECT * FROM public.get_rendimientos_detalle_v2('2026-04-01', '2026-04-30', 'MTY', 42);
--   - Validar en el detalle que las columnas `odometro_ant` y `horometro_ant`
--     coincidan con la salida inmediata anterior de la unidad.
--
-- Bitácora de cambios:
--   2026-04-23:
--   - Se normaliza el encabezado con comentarios de desarrollador, howto y bitácora.
--   2026-04-24:
--   - Se agrega función helper para obtener odómetro/horímetro inmediato anterior.
--   - Kms/Hrs Recorridos en consolidado cambian de MAX-MIN a suma de deltas
--     por movimiento usando la salida inmediata anterior de la unidad.
--   - `get_rendimientos_detalle_v2` agrega `odometro_ant` y `horometro_ant`
--     para soportar trazabilidad del cálculo en el modal de detalle.
-- =====================================================

-- Dependencia:
-- Este script requiere que exista previamente la función:
-- public.fn_obtener_valores_previos_salida(bigint, date, time, bigint, text)
--
-- Orden recomendado de despliegue:
-- 1) fn_obtener_valores_previos_salida.sql
-- 2) Rendimientos_v2.sql
--
-- Contrato técnico del detalle (`get_rendimientos_detalle_v2`):
-- - Devuelve movimientos `TipoMovimiento = 'S'` de una sola unidad dentro del rango.
-- - `odometro_ant` y `horometro_ant` provienen del helper
--   `fn_obtener_valores_previos_salida`.
-- - Los campos `*_ant` son de referencia para auditoría visual y explicación
--   del delta por movimiento; no sustituyen los valores capturados del movimiento actual.
-- - El orden cronológico ascendente es parte del contrato esperado por la UI.

DROP FUNCTION IF EXISTS public.reporte_rendimientos_v2(date, date, text, bigint, bigint);
DROP FUNCTION IF EXISTS public.get_rendimientos_detalle_v2(date, date, text, bigint);

CREATE OR REPLACE FUNCTION public.reporte_rendimientos_v2(
    p_fecha_inicio date,
    p_fecha_fin date,
    p_cve_ciudad text DEFAULT NULL,
    p_id_tanque bigint DEFAULT NULL,
    p_id_unidad bigint DEFAULT NULL
)
RETURNS TABLE (
    "Unidad" text,
    "IDUnidad" bigint,
    "Carga Total" bigint,
    "Kms Recorridos" bigint,
    "Hrs Recorridos" bigint,
    "Kms/Lts" numeric,
    "Hrs/Lts" numeric,
    "Tanque Principal" text,
    "Tanques Utilizados" text,
    "Cantidad Tanques" integer
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH movimientos_rango_base AS (
        -- Universo base del periodo:
        -- todos los movimientos de salida (S) con joins de catálogo para enriquecer nombre
        -- de tanque y etiqueta de unidad.
        SELECT
            tm."IdTanqueMovimiento",
            tm."IdUnidad",
            tm."IdTanque",
            tm."FechaCarga",
            tm."HoraCarga",
            tm."LitrosCarga",
            tm."Odometro",
            tm."Horimetro",
            t."Nombre"::text AS tanque,
            (u."IDClaveUnidad" || '(' || u."ClaveAlterna" || ')')::text AS unidad
        FROM public."TanqueMovimiento" tm
        INNER JOIN public."Tanque" t
            ON tm."IdTanque" = t."IDTanque"
        INNER JOIN public."Unidades" u
            ON tm."IdUnidad" = u."IDUnidad"
        WHERE tm."TipoMovimiento" = 'S'
            AND tm."FechaCarga" BETWEEN p_fecha_inicio AND p_fecha_fin
            AND (p_cve_ciudad IS NULL OR tm."CveCiudad" = p_cve_ciudad)
            AND (p_id_unidad IS NULL OR tm."IdUnidad" = p_id_unidad)
    ),
    unidades_objetivo AS (
        -- Define qué unidades entran al reporte.
        -- Si hay filtro por tanque, solo unidades que tuvieron salida en ese tanque.
        SELECT DISTINCT mrb."IdUnidad"
        FROM movimientos_rango_base mrb
        WHERE p_id_tanque IS NULL OR mrb."IdTanque" = p_id_tanque
    ),
    movimientos_kpi AS (
        -- Trae movimientos del rango para unidades objetivo.
        -- El filtro por tanque SOLO define unidades objetivo;
        -- no restringe estos movimientos para el KPI consolidado.
        SELECT mrb.*
        FROM movimientos_rango_base mrb
        INNER JOIN unidades_objetivo uo
            ON uo."IdUnidad" = mrb."IdUnidad"
    ),
    movimientos_con_previos AS (
        -- Para cada movimiento del rango, obtiene la salida inmediata anterior de la unidad.
        SELECT
            mk.*,
            prev.odometro_anterior,
            prev.horimetro_anterior
        FROM movimientos_kpi mk
        LEFT JOIN LATERAL public.fn_obtener_valores_previos_salida(
            mk."IdUnidad",
            mk."FechaCarga",
            mk."HoraCarga",
            mk."IdTanqueMovimiento",
            p_cve_ciudad
        ) prev ON true
    ),
    resumen_unidad AS (
        -- Nuevo cálculo de recorrido consolidado:
        -- Se suma, por cada movimiento del rango, la diferencia contra su salida inmediata anterior.
        -- Ejemplo diario esperado por negocio:
        --   kms_dia = odometro_actual - odometro_movimiento_previo
        --   hrs_dia = horimetro_actual - horimetro_movimiento_previo
        -- y el acumulado del periodo es la suma de esos deltas.
        SELECT
            mcp.unidad AS unidad,
            mcp."IdUnidad" AS id_unidad,
            COALESCE(SUM(mcp."LitrosCarga"), 0)::bigint AS carga_total,
            COALESCE(SUM(
                CASE
                    WHEN mcp."Odometro" IS NULL OR mcp.odometro_anterior IS NULL THEN 0
                    ELSE GREATEST(mcp."Odometro" - mcp.odometro_anterior, 0)
                END
            ), 0)::bigint AS kms_recorridos,
            COALESCE(SUM(
                CASE
                    WHEN mcp."Horimetro" IS NULL OR mcp.horimetro_anterior IS NULL THEN 0
                    ELSE GREATEST(mcp."Horimetro" - mcp.horimetro_anterior, 0)
                END
            ), 0)::bigint AS hrs_recorridos
        FROM movimientos_con_previos mcp
        GROUP BY mcp.unidad, mcp."IdUnidad"
    ),
    tanques_distintos AS (
        -- Lista única de tanques usados por cada unidad en el universo KPI.
        SELECT DISTINCT
            mk."IdUnidad" AS id_unidad,
            mk.tanque
        FROM movimientos_kpi mk
    ),
    tanques_por_unidad AS (
        -- Construye columnas descriptivas de tanques para UI:
        -- - Tanques Utilizados (string agregada)
        -- - Cantidad Tanques
        SELECT
            td.id_unidad,
            STRING_AGG(td.tanque, ', ' ORDER BY td.tanque) AS tanques_utilizados,
            COUNT(*)::integer AS cantidad_tanques
        FROM tanques_distintos td
        GROUP BY td.id_unidad
    ),
    ranking_tanques AS (
        -- Ranking por litros para identificar el "Tanque Principal".
        -- Empate: orden alfabético por nombre de tanque.
        SELECT
            mk."IdUnidad" AS id_unidad,
            mk.tanque,
            SUM(mk."LitrosCarga")::bigint AS litros_tanque,
            ROW_NUMBER() OVER (
                PARTITION BY mk."IdUnidad"
                ORDER BY SUM(mk."LitrosCarga") DESC, mk.tanque ASC
            ) AS rn
        FROM movimientos_kpi mk
        GROUP BY mk."IdUnidad", mk.tanque
    ),
    tanque_principal AS (
        -- Toma únicamente el tanque #1 del ranking por unidad.
        SELECT
            rt.id_unidad,
            rt.tanque AS tanque_principal
        FROM ranking_tanques rt
        WHERE rt.rn = 1
    )
    SELECT
        -- Datos consolidados por unidad.
        ru.unidad AS "Unidad",
        ru.id_unidad AS "IDUnidad",
        ru.carga_total AS "Carga Total",
        ru.kms_recorridos AS "Kms Recorridos",
        ru.hrs_recorridos AS "Hrs Recorridos",
        -- KPIs protegidos contra división entre cero con NULLIF.
        ROUND(ru.kms_recorridos::numeric / NULLIF(ru.carga_total, 0), 4) AS "Kms/Lts",
        ROUND(ru.hrs_recorridos::numeric / NULLIF(ru.carga_total, 0), 4) AS "Hrs/Lts",
        COALESCE(tp.tanque_principal, 'N/A') AS "Tanque Principal",
        COALESCE(tpu.tanques_utilizados, 'N/A') AS "Tanques Utilizados",
        COALESCE(tpu.cantidad_tanques, 0) AS "Cantidad Tanques"
    FROM resumen_unidad ru
    LEFT JOIN tanque_principal tp
        ON tp.id_unidad = ru.id_unidad
    LEFT JOIN tanques_por_unidad tpu
        ON tpu.id_unidad = ru.id_unidad
    -- Orden estable para visualización/exportación del frontend.
    ORDER BY ru.unidad;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_rendimientos_detalle_v2(
    p_fecha_inicio date,
    p_fecha_fin date,
    p_cve_ciudad text,
    p_id_unidad bigint
)
RETURNS TABLE (
    id_tanque_movimiento bigint,
    tanque text,
    fecha date,
    hora time,
    litros bigint,
    cuenta_litros bigint,
    odometro_ant bigint,
    horometro_ant bigint,
    horometro bigint,
    odometro bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    -- Detalle cronológico de salidas para una unidad consolidada.
    -- Este detalle alimenta el modal de desglose del reporte v2.
    -- Además expone odómetro/horímetro anterior inmediato por movimiento,
    -- reutilizando el helper de previos para explicar el cálculo de deltas.
    -- Regla de lectura para frontend:
    -- - `odometro_ant` / `horometro_ant` son columnas informativas.
    -- - `odometro` / `horometro` son los valores actuales editables del movimiento.
    SELECT
        tm."IdTanqueMovimiento" AS id_tanque_movimiento,
        t."Nombre"::text AS tanque,
        tm."FechaCarga" AS fecha,
        tm."HoraCarga" AS hora,
        tm."LitrosCarga" AS litros,
        tm."CuentaLitros" AS cuenta_litros,
        prev.odometro_anterior AS odometro_ant,
        prev.horimetro_anterior AS horometro_ant,
        tm."Horimetro" AS horometro,
        tm."Odometro" AS odometro
    FROM public."TanqueMovimiento" tm
    INNER JOIN public."Tanque" t
        ON tm."IdTanque" = t."IDTanque"
    LEFT JOIN LATERAL public.fn_obtener_valores_previos_salida(
        tm."IdUnidad",
        tm."FechaCarga",
        tm."HoraCarga",
        tm."IdTanqueMovimiento",
        p_cve_ciudad
    ) prev ON true
    WHERE tm."TipoMovimiento" = 'S'
        AND tm."FechaCarga" BETWEEN p_fecha_inicio AND p_fecha_fin
        AND tm."CveCiudad" = p_cve_ciudad
        AND tm."IdUnidad" = p_id_unidad
    -- Orden cronológico ascendente para lectura operativa.
    ORDER BY tm."FechaCarga" ASC, tm."HoraCarga" ASC;
END;
$$;

-- =====================================================
-- Ejemplos de uso
-- =====================================================
-- SELECT * FROM public.reporte_rendimientos_v2('2026-02-01', '2026-02-28', 'MTY', NULL, NULL);
-- SELECT * FROM public.reporte_rendimientos_v2('2026-02-01', '2026-02-28', 'MTY', 5, NULL);
-- SELECT * FROM public.get_rendimientos_detalle_v2('2026-02-01', '2026-02-28', 'MTY', 42);