-- =====================================================
-- Función: get_rendimientos_detalle
-- Descripción: Obtiene el detalle de los movimientos de salida de combustible
--              que forman un renglón del reporte de rendimientos.
-- Parámetros:
--   - p_fecha_inicio: Fecha de inicio del rango (YYYY-MM-DD)
--   - p_fecha_fin: Fecha de fin del rango (YYYY-MM-DD)
--   - p_cve_ciudad: Clave de ciudad como texto
--   - p_id_tanque: ID del tanque
--   - p_id_unidad: ID de la unidad
-- Retorna: TABLE con cada movimiento individual de salida
-- =====================================================

DROP FUNCTION IF EXISTS public.get_rendimientos_detalle(date, date, text, bigint, bigint);

CREATE OR REPLACE FUNCTION public.get_rendimientos_detalle(
    p_fecha_inicio date,
    p_fecha_fin date,
    p_cve_ciudad text,
    p_id_tanque bigint,
    p_id_unidad bigint
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
        AND tm."IdTanque" = p_id_tanque
        AND tm."IdUnidad" = p_id_unidad
    ORDER BY
        tm."FechaCarga" ASC,
        tm."HoraCarga" ASC;
END;
$$;

-- =====================================================
-- Ejemplo de uso
-- =====================================================
-- SELECT * FROM get_rendimientos_detalle('2026-02-01', '2026-02-28', 'MTY', 1, 42);
