-- =====================================================
-- Función: reporte_rendimientos
-- Descripción: Genera un reporte de rendimiento de diesel
--              relacionando litros consumidos con Odómetro y Horómetro.
--              Solo considera movimientos TipoMovimiento = 'S' (Salidas).
-- Parámetros:
--   - p_fecha_inicio: Fecha de inicio del rango (YYYY-MM-DD)
--   - p_fecha_fin: Fecha de fin del rango (YYYY-MM-DD)
--   - p_cve_ciudad: Clave de ciudad como texto (opcional, NULL = todas)
--   - p_id_tanque: ID de tanque (opcional, NULL = todos)
-- Retorna: TABLE con el reporte de rendimientos por unidad/fecha
-- =====================================================

DROP FUNCTION IF EXISTS public.reporte_rendimientos(date, date, text, bigint);

CREATE OR REPLACE FUNCTION public.reporte_rendimientos(
    p_fecha_inicio date,
    p_fecha_fin date,
    p_cve_ciudad text DEFAULT NULL,
    p_id_tanque bigint DEFAULT NULL
)
RETURNS TABLE (
    "Tanque" text,
    "Unidad" text,
    "IDUnidad" bigint,
    "Carga Total" bigint,
    "Kms Recorridos" bigint,
    "Hrs Recorridos" bigint,
    "Kms/Lts" numeric,
    "Hrs/Lts" numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t."Nombre"::text AS "Tanque",
        (u."IDClaveUnidad" || '(' || u."ClaveAlterna" || ')')::text AS "Unidad",
        u."IDUnidad" AS "IDUnidad",
        COALESCE(SUM(tm."LitrosCarga"), 0)::bigint AS "Carga Total",
        COALESCE(MAX(tm."Odometro") - MIN(tm."Odometro"), 0)::bigint AS "Kms Recorridos",
        COALESCE(MAX(tm."Horimetro") - MIN(tm."Horimetro"), 0)::bigint AS "Hrs Recorridos",
        ROUND(
            COALESCE(MAX(tm."Odometro") - MIN(tm."Odometro"), 0)::numeric
            / NULLIF(SUM(tm."LitrosCarga"), 0), 4
        ) AS "Kms/Lts",
        ROUND(
            COALESCE(MAX(tm."Horimetro") - MIN(tm."Horimetro"), 0)::numeric
            / NULLIF(SUM(tm."LitrosCarga"), 0), 4
        ) AS "Hrs/Lts"

    FROM public."TanqueMovimiento" tm
    INNER JOIN public."Tanque" t
        ON tm."IdTanque" = t."IDTanque"
    INNER JOIN public."Unidades" u
        ON tm."IdUnidad" = u."IDUnidad"

    WHERE tm."TipoMovimiento" = 'S'
        AND tm."FechaCarga" BETWEEN p_fecha_inicio AND p_fecha_fin
        AND (p_cve_ciudad IS NULL OR tm."CveCiudad" = p_cve_ciudad)
        AND (p_id_tanque IS NULL OR tm."IdTanque" = p_id_tanque)

    GROUP BY
        t."Nombre",
        u."IDUnidad",
        u."IDClaveUnidad",
        u."ClaveAlterna"

    ORDER BY
        t."Nombre",
        u."IDClaveUnidad";

END;
$$;


-- =====================================================
-- Permisos
-- =====================================================
-- ALTER FUNCTION public.reporte_rendimientos(DATE, DATE, TEXT, BIGINT)
--     OWNER TO authenticated;


-- =====================================================
-- Ejemplo de uso
-- =====================================================

-- 1. Todos los rendimientos en un rango de fechas
-- SELECT * FROM reporte_rendimientos('2026-02-01', '2026-02-28', NULL, NULL);

-- 2. Filtrar por ciudad específica (CveCiudad como texto, ej: 'MTY')
-- SELECT * FROM reporte_rendimientos('2026-02-01', '2026-02-28', 'MTY', NULL);

-- 3. Filtrar por tanque específico (ID = 5)
-- SELECT * FROM reporte_rendimientos('2026-02-01', '2026-02-28', NULL, 5);

-- 4. Filtrar por ciudad Y tanque
-- SELECT * FROM reporte_rendimientos('2026-02-01', '2026-02-28', 'MTY', 5);


-- =====================================================
-- Notas de implementación
-- =====================================================
-- 1. Tablas utilizadas:
--    - "TanqueMovimiento"  (tabla principal de movimientos)
--    - "Tanque"            (nombre del tanque)
--    - "Unidades"          (clave e identificador de la unidad)
--
-- 2. Solo se consideran movimientos con TipoMovimiento = 'S' (Salidas)
--
-- 3. Relación entre tablas:
--    - TanqueMovimiento.IdTanque  = Tanque.IDTanque
--    - TanqueMovimiento.IdUnidad  = Unidades.IDUnidad
--
-- 4. Cálculo de columnas:
--    - "Carga Total"    = SUM(LitrosCarga)
--    - "Kms Recorridos" = MAX(Odometro) - MIN(Odometro)
--    - "Hrs Recorridos" = MAX(Horimetro) - MIN(Horimetro)
--    - "Kms/Lts"        = Kms Recorridos / Carga Total
--    - "Hrs/Lts"        = Hrs Recorridos / Carga Total
--    (División protegida con NULLIF para evitar división entre cero)
--
-- 5. Para usar desde el frontend (Supabase JS):
--    const { data, error } = await supabase
--      .rpc('reporte_rendimientos', {
--        p_fecha_inicio: '2026-02-01',
--        p_fecha_fin:    '2026-02-28',
--        p_cve_ciudad:   'MTY',   // texto, opcional
--        p_id_tanque:    null     // bigint, opcional
--      });
