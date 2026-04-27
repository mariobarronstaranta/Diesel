-- =============================================
-- Función: sp_obtener_lecturas_diarias
-- Propósito:
--   Obtener el resumen base de lecturas diarias sin columnas de consumos/entradas/salidas.
--
-- Comentarios de desarrollador:
--   - Esta es la versión histórica/base del reporte de lecturas.
--   - Se conserva para compatibilidad, aunque el reporte principal ya consume
--     `sp_obtener_lecturas_diarias_consumos`.
--   - Corrige tipos BIGINT de cuenta litros respecto a versiones anteriores.
--
-- HowTo:
--   - Ejecutar este script en Supabase SQL Editor cuando se requiera mantener la versión base.
--   - Probar con:
--     SELECT * FROM sp_obtener_lecturas_diarias('MTY', '2026-04-01', '2026-04-30', NULL);
--
-- Bitácora de cambios:
--   2026-04-23:
--   - Se normaliza el encabezado con comentarios de desarrollador, howto y bitácora.
-- =============================================

-- Drop de la función que acabas de crear (ahora con 4 parámetros)
DROP FUNCTION IF EXISTS sp_obtener_lecturas_diarias(TEXT, DATE, DATE, INTEGER);

-- Recrear con BIGINT correcto
CREATE OR REPLACE FUNCTION sp_obtener_lecturas_diarias(
    p_ciudad TEXT DEFAULT NULL,
    p_fecha_inicial DATE DEFAULT NULL,
    p_fecha_final DATE DEFAULT NULL,
    p_id_tanque INTEGER DEFAULT NULL
)
RETURNS TABLE (
    idciudad TEXT,
    nombre TEXT,
    fecha DATE,
    lectura_inicial_cms NUMERIC(8,2),
    lectura_final_cms NUMERIC(8,2),
    cuenta_litros_inicial BIGINT,        -- ✅ BIGINT
    cuenta_litros_final BIGINT,          -- ✅ BIGINT
    diferencia_cuenta_litros BIGINT      -- ✅ BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH LecturasFiltradas AS (
        SELECT DISTINCT
            TN.idciudad::TEXT as idciudad,
            TN."Nombre"::TEXT as nombre,
            TAL."Fecha",
            TAL."Hora",
            TAL."LecturaCms",
            TAL."CuentaLitros"
        FROM public."TanqueLecturas" TAL
        JOIN public."Tanque" TN ON TN."IDTanque" = TAL."IDTanque"::INTEGER
        WHERE 
             (TAL."Activo" <> 0)
             AND (TAL."Fecha" >= p_fecha_inicial AND TAL."Fecha" <= p_fecha_final)
             AND (
                p_ciudad IS NULL 
                OR p_ciudad = '' 
                OR p_ciudad = '-1' 
                OR TN.idciudad = p_ciudad
            )
             AND (
                p_id_tanque IS NULL
                OR TN."IDTanque" = p_id_tanque
            )
    ),
    LecturasOrdenadas AS (
        SELECT
            lf.idciudad,
            lf.nombre,
            lf."Fecha",
            lf."LecturaCms",
            lf."CuentaLitros",
            lf."Hora",
            ROW_NUMBER() OVER(PARTITION BY lf.idciudad, lf.nombre, lf."Fecha" ORDER BY lf."Hora" ASC) as rn_asc,
            ROW_NUMBER() OVER(PARTITION BY lf.idciudad, lf.nombre, lf."Fecha" ORDER BY lf."Hora" DESC) as rn_desc
        FROM LecturasFiltradas lf
    )
    SELECT
        t1.idciudad,
        t1.nombre,
        t1."Fecha",
        t1."LecturaCms"::NUMERIC(8,2),
        t2."LecturaCms"::NUMERIC(8,2),
        t1."CuentaLitros",
        t2."CuentaLitros",
        (t2."CuentaLitros" - t1."CuentaLitros")
    FROM LecturasOrdenadas t1
    INNER JOIN LecturasOrdenadas t2 
        ON t1.idciudad = t2.idciudad 
        AND t1.nombre = t2.nombre
        AND t1."Fecha" = t2."Fecha"
    WHERE t1.rn_asc = 1 AND t2.rn_desc = 1;
END;
$$;
