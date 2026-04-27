-- =============================================
-- Función: get_entradas_detalle
-- Propósito:
--   Obtener el detalle de movimientos de entrada de combustible para un día/tanque.
--
-- Comentarios de desarrollador:
--   - Solo considera movimientos `TipoMovimiento = 'E'`.
--   - Se une a `Tanque` y `Planta` para enriquecer el resultado visible en UI.
--   - Se usa como detalle operativo del reporte de consumos/entradas.
--
-- HowTo:
--   - Ejecutar este script en Supabase SQL Editor.
--   - Probar con:
--     SELECT * FROM get_entradas_detalle('2026-04-01', 'MTY', 1);
--
-- Bitácora de cambios:
--   2026-04-23:
--   - Se normaliza el encabezado con comentarios de desarrollador, howto y bitácora.
-- =============================================

CREATE OR REPLACE FUNCTION get_entradas_detalle(
    p_fecha DATE,
    p_ciudad VARCHAR,
    p_id_tanque BIGINT
)
RETURNS TABLE (
    fecha DATE,
    hora TIME,
    temperatura BIGINT,
    litros BIGINT,
    planta TEXT,
    tanque TEXT,
    cuenta_litros BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tm."FechaCarga" AS fecha,
        tm."HoraCarga" AS hora,
        tm."TemperaturaCarga" AS temperatura,
        tm."LitrosCarga" AS litros,
        p."Nombre"::TEXT AS planta,
        t."Nombre"::TEXT AS tanque,
        tm."CuentaLitros" AS cuenta_litros
    FROM 
        public."TanqueMovimiento" tm
    INNER JOIN 
        public."Tanque" t ON tm."IdTanque" = t."IDTanque"
    INNER JOIN 
        public."Planta" p ON t."IDPlanta" = p."IDPlanta"
    WHERE 
        tm."FechaCarga" = p_fecha
        AND tm."CveCiudad" = p_ciudad
        AND tm."IdTanque" = p_id_tanque
        AND tm."TipoMovimiento" = 'E'
    ORDER BY 
        tm."HoraCarga" ASC;
END;
$$;

-- Comentarios sobre la función
COMMENT ON FUNCTION get_entradas_detalle(DATE, VARCHAR, BIGINT) IS 'Obtiene el detalle de movimientos de entrada de combustible por fecha, ciudad y tanque';
