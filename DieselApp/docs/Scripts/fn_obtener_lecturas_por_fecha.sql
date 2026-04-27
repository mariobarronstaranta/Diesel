-- =============================================
-- Función: fn_obtener_lecturas_por_fecha
-- Propósito:
--   Obtener el detalle de lecturas individuales de un tanque para una fecha dada.
--
-- Comentarios de desarrollador:
--   - Se filtra por nombre de tanque (`Tanque.Nombre`) y no por ID.
--   - Solo devuelve lecturas activas (`Activo <> 0`).
--   - Se usa como fuente del modal Detalle dentro de ReporteLecturas.
--
-- HowTo:
--   - Ejecutar este script en Supabase SQL Editor.
--   - Probar con:
--     SELECT * FROM public.fn_obtener_lecturas_por_fecha('2026-04-01', 'TANQUE 1');
--
-- Bitácora de cambios:
--   2026-04-23:
--   - Se agrega encabezado de documentación técnica para mantenimiento.
-- =============================================

DROP FUNCTION IF EXISTS public.fn_obtener_lecturas_por_fecha(date, text);

CREATE OR REPLACE FUNCTION public.fn_obtener_lecturas_por_fecha(
  p_fecha date, 
  p_tanque text
)
RETURNS TABLE(
  "IDTanqueLecturas" bigint, 
  "Tanque" text, 
  "Fecha" date, 
  "Hora" time without time zone, 
  "LecturaCms" numeric(8,2),
  "Temperatura" numeric, 
  "CuentaLitros" bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    TL."IDTanqueLecturas"::BIGINT,
    TN."Nombre"::TEXT AS "Tanque",
    TL."Fecha"::DATE,
    TL."Hora"::TIME,
    TL."LecturaCms"::NUMERIC(8,2),
    TL."Temperatura"::NUMERIC,
    TL."CuentaLitros"::BIGINT
  FROM
    public."TanqueLecturas" TL
    INNER JOIN public."Tanque" TN ON TL."IDTanque" = TN."IDTanque"
  WHERE
    TL."Fecha" = p_fecha AND 
    TN."Nombre" = p_tanque AND
    TL."Activo" <> 0;
END;
$function$;
