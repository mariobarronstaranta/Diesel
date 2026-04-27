-- =============================================
-- Función: get_salidas_detalle
-- Propósito:
--   Obtener el detalle de movimientos de salida de combustible para un día/tanque.
--
-- Comentarios de desarrollador:
--   - Solo considera movimientos `TipoMovimiento = 'S'`.
--   - El parámetro `p_id_unidad` es opcional para filtrar una unidad específica.
--   - La salida ya incluye datos enriquecidos de `Tanque` y `Unidades`.
--
-- HowTo:
--   - Ejecutar este script en Supabase SQL Editor.
--   - Probar con:
--     SELECT * FROM get_salidas_detalle('2026-04-01', 'MTY', 1, NULL);
--
-- Bitácora de cambios:
--   2026-04-23:
--   - Se normaliza el encabezado con comentarios de desarrollador, howto y bitácora.
-- =============================================

DROP FUNCTION IF EXISTS get_salidas_detalle(DATE, VARCHAR, BIGINT);
DROP FUNCTION IF EXISTS get_salidas_detalle(DATE, VARCHAR, BIGINT, BIGINT);

CREATE OR REPLACE FUNCTION get_salidas_detalle(
    p_fecha DATE,
    p_ciudad VARCHAR,
    p_id_tanque BIGINT,
    p_id_unidad BIGINT DEFAULT NULL
)
RETURNS TABLE (
    id_tanque_movimiento BIGINT,
    tanque TEXT,
    fecha DATE,
    hora TIME,
    temperatura BIGINT,
    unidad TEXT,
    litros BIGINT,
    cuenta_litros BIGINT,
    horometro BIGINT,
    odometro BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tm."IdTanqueMovimiento" AS id_tanque_movimiento,
        t."Nombre"::TEXT AS tanque,
        tm."FechaCarga" AS fecha,
        tm."HoraCarga" AS hora,
        tm."TemperaturaCarga" AS temperatura,
        (u."IDClaveUnidad" || ' (' || u."ClaveAlterna" || ')')::TEXT AS unidad,
        tm."LitrosCarga" AS litros,
        tm."CuentaLitros" AS cuenta_litros,
        tm."Horimetro" AS horometro,
        tm."Odometro" AS odometro
    FROM 
        public."TanqueMovimiento" tm
    INNER JOIN 
        public."Tanque" t ON tm."IdTanque" = t."IDTanque"
    LEFT JOIN 
        public."Unidades" u ON tm."IdUnidad" = u."IDUnidad"
    WHERE 
        tm."FechaCarga" = p_fecha
        AND tm."CveCiudad" = p_ciudad
        AND tm."IdTanque" = p_id_tanque
        AND tm."TipoMovimiento" = 'S'
        AND (p_id_unidad IS NULL OR tm."IdUnidad" = p_id_unidad)
    ORDER BY 
        tm."HoraCarga" ASC;
END;
$$;

-- Comentarios sobre la función
COMMENT ON FUNCTION get_salidas_detalle(DATE, VARCHAR, BIGINT, BIGINT) IS 'Obtiene el detalle de movimientos de salida de combustible por fecha, ciudad, tanque y opcionalmente unidad';
