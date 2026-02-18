-- Función: get_entradas_detalle
-- Descripción: Obtiene el detalle de movimientos de entrada de combustible
-- Parámetros:
--   p_fecha: Fecha de los movimientos a consultar
--   p_ciudad: Clave de la ciudad
--   p_id_tanque: ID del tanque
-- Retorna: Tabla con los movimientos de entrada ordenados por hora

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
