-- =====================================================
-- Funciones: reporte_rendimientos_v2 / get_rendimientos_detalle_v2
-- Descripción: Reporte de rendimiento consolidado por unidad.
--              El KPI se calcula con todas las cargas de la unidad
--              dentro del periodo, aunque haya cargado en varios tanques.
--              El filtro p_id_tanque sirve para seleccionar unidades que
--              participaron en ese tanque, pero no recorta el cálculo del KPI.
-- =====================================================

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
    WITH movimientos_base AS (
        SELECT
            tm."IdUnidad",
            tm."IdTanque",
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
        SELECT DISTINCT mb."IdUnidad"
        FROM movimientos_base mb
        WHERE p_id_tanque IS NULL OR mb."IdTanque" = p_id_tanque
    ),
    movimientos_consolidados AS (
        SELECT mb.*
        FROM movimientos_base mb
        INNER JOIN unidades_objetivo uo
            ON uo."IdUnidad" = mb."IdUnidad"
    ),
    resumen_unidad AS (
        SELECT
            mc.unidad AS unidad,
            mc."IdUnidad" AS id_unidad,
            COALESCE(SUM(mc."LitrosCarga"), 0)::bigint AS carga_total,
            COALESCE(MAX(mc."Odometro") - MIN(mc."Odometro"), 0)::bigint AS kms_recorridos,
            COALESCE(MAX(mc."Horimetro") - MIN(mc."Horimetro"), 0)::bigint AS hrs_recorridos
        FROM movimientos_consolidados mc
        GROUP BY mc.unidad, mc."IdUnidad"
    ),
    tanques_distintos AS (
        SELECT DISTINCT
            mc."IdUnidad" AS id_unidad,
            mc.tanque
        FROM movimientos_consolidados mc
    ),
    tanques_por_unidad AS (
        SELECT
            td.id_unidad,
            STRING_AGG(td.tanque, ', ' ORDER BY td.tanque) AS tanques_utilizados,
            COUNT(*)::integer AS cantidad_tanques
        FROM tanques_distintos td
        GROUP BY td.id_unidad
    ),
    ranking_tanques AS (
        SELECT
            mc."IdUnidad" AS id_unidad,
            mc.tanque,
            SUM(mc."LitrosCarga")::bigint AS litros_tanque,
            ROW_NUMBER() OVER (
                PARTITION BY mc."IdUnidad"
                ORDER BY SUM(mc."LitrosCarga") DESC, mc.tanque ASC
            ) AS rn
        FROM movimientos_consolidados mc
        GROUP BY mc."IdUnidad", mc.tanque
    ),
    tanque_principal AS (
        SELECT
            rt.id_unidad,
            rt.tanque AS tanque_principal
        FROM ranking_tanques rt
        WHERE rt.rn = 1
    )
    SELECT
        ru.unidad AS "Unidad",
        ru.id_unidad AS "IDUnidad",
        ru.carga_total AS "Carga Total",
        ru.kms_recorridos AS "Kms Recorridos",
        ru.hrs_recorridos AS "Hrs Recorridos",
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
    horometro bigint,
    odometro bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        tm."IdTanqueMovimiento" AS id_tanque_movimiento,
        t."Nombre"::text AS tanque,
        tm."FechaCarga" AS fecha,
        tm."HoraCarga" AS hora,
        tm."LitrosCarga" AS litros,
        tm."CuentaLitros" AS cuenta_litros,
        tm."Horimetro" AS horometro,
        tm."Odometro" AS odometro
    FROM public."TanqueMovimiento" tm
    INNER JOIN public."Tanque" t
        ON tm."IdTanque" = t."IDTanque"
    WHERE tm."TipoMovimiento" = 'S'
        AND tm."FechaCarga" BETWEEN p_fecha_inicio AND p_fecha_fin
        AND tm."CveCiudad" = p_cve_ciudad
        AND tm."IdUnidad" = p_id_unidad
    ORDER BY tm."FechaCarga" ASC, tm."HoraCarga" ASC;
END;
$$;

-- =====================================================
-- Ejemplos de uso
-- =====================================================
-- SELECT * FROM public.reporte_rendimientos_v2('2026-02-01', '2026-02-28', 'MTY', NULL, NULL);
-- SELECT * FROM public.reporte_rendimientos_v2('2026-02-01', '2026-02-28', 'MTY', 5, NULL);
-- SELECT * FROM public.get_rendimientos_detalle_v2('2026-02-01', '2026-02-28', 'MTY', 42);