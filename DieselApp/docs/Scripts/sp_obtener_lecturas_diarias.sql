DROP FUNCTION IF EXISTS public.sp_obtener_lecturas_diarias(text, date, date);

CREATE OR REPLACE FUNCTION public.sp_obtener_lecturas_diarias(
  p_ciudad text DEFAULT NULL::text, 
  p_fecha_inicial date DEFAULT NULL::date, 
  p_fecha_final date DEFAULT NULL::date
)
RETURNS TABLE(
  ciudad text, 
  nombre text, 
  fecha date, 
  lectura_inicial_cms numeric(8,2),
  lectura_final_cms numeric(8,2),
  cuenta_litros_inicial bigint, 
  cuenta_litros_final bigint, 
  diferencia_cuenta_litros bigint
)
LANGUAGE plpgsql
AS $function$
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
$function$;
