-- =====================================================
-- Función: get_rendimientos_detalle
-- Propósito:
--   Obtener el detalle de movimientos de salida que componen un renglón del reporte de rendimientos.
--
-- Comentarios de desarrollador:
--   - Solo considera movimientos `TipoMovimiento = 'S'`.
--   - El detalle conserva granularidad por movimiento y orden cronológico.
--   - `p_id_tanque` es opcional; `p_id_unidad` normalmente identifica el renglón del reporte.
--
-- HowTo:
--   - Ejecutar este script en Supabase SQL Editor.
--   - Probar con:
--     SELECT * FROM public.get_rendimientos_detalle('2026-04-01', '2026-04-30', 'MTY', NULL, 1001);
--
-- Bitácora de cambios:
--   2026-04-23:
--   - Se normaliza el encabezado con comentarios de desarrollador, howto y bitácora.
-- =====================================================

DROP FUNCTION IF EXISTS public.get_rendimientos_detalle(date, date, text, bigint, bigint);

CREATE OR REPLACE FUNCTION public.get_rendimientos_detalle(
    p_fecha_inicio date,
    p_fecha_fin date,
    p_cve_ciudad text,
    p_id_tanque bigint DEFAULT NULL,
    p_id_unidad bigint DEFAULT NULL
)
RETURNS TABLE (
    id_tanque_movimiento bigint,
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
        tm."FechaCarga" AS fecha,
        tm."HoraCarga" AS hora,
        tm."LitrosCarga" AS litros,
        tm."CuentaLitros" AS cuenta_litros,
        tm."Horimetro" AS horometro,
        tm."Odometro" AS odometro
    FROM public."TanqueMovimiento" tm
    WHERE
        tm."TipoMovimiento" = 'S'
        AND tm."FechaCarga" BETWEEN p_fecha_inicio AND p_fecha_fin
        AND tm."CveCiudad" = p_cve_ciudad
        AND (p_id_tanque IS NULL OR tm."IdTanque" = p_id_tanque)
        AND tm."IdUnidad" = p_id_unidad
    ORDER BY
        tm."FechaCarga" ASC,
        tm."HoraCarga" ASC;
END;
$$;

-- =====================================================
-- Ejemplo de uso
-- =====================================================
-- 1. Con tanque específico:
-- SELECT * FROM get_rendimientos_detalle('2026-02-01', '2026-02-28', 'MTY', 1, 42);

-- 2. Con Tanque = (Todos), p_id_tanque = NULL:
-- SELECT * FROM get_rendimientos_detalle('2026-02-01', '2026-02-28', 'GDL', NULL, 62);
