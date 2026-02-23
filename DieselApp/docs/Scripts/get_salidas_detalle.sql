-- Función: get_salidas_detalle
-- Descripción: Obtiene el detalle de movimientos de salida de combustible
-- Parámetros:
--   p_fecha: Fecha de los movimientos a consultar
--   p_ciudad: Clave de la ciudad
--   p_id_tanque: ID del tanque
-- Retorna: Tabla con los movimientos de salida ordenados por hora

DROP FUNCTION IF EXISTS get_salidas_detalle(DATE, VARCHAR, BIGINT);

CREATE OR REPLACE FUNCTION get_salidas_detalle(
    p_fecha DATE,
    p_ciudad VARCHAR,
    p_id_tanque BIGINT
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
    ORDER BY 
        tm."HoraCarga" ASC;
END;
$$;

-- Comentarios sobre la función
COMMENT ON FUNCTION get_salidas_detalle(DATE, VARCHAR, BIGINT) IS 'Obtiene el detalle de movimientos de salida de combustible por fecha, ciudad y tanque';
