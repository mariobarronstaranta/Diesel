-- =====================================================
-- Función: reporte_productividad
-- Descripción: Genera un reporte de productividad y rentabilidad
--              cruzando la información de viajes (transaccional) 
--              con el consumo de diesel (operativo). Usa un LEFT JOIN
--              desde los viajes hacia las unidades/consumos.
-- Parámetros:
--   - p_fecha_inicio: Fecha de inicio del rango (YYYY-MM-DD)
--   - p_fecha_fin: Fecha de fin del rango (YYYY-MM-DD)
--   - p_cve_ciudad: Clave de ciudad como texto (opcional, NULL = todas)
--   - p_id_tanque: ID de tanque (opcional, NULL = todos)
-- Retorna: TABLE con el reporte de productividad por unidad
-- =====================================================

DROP FUNCTION IF EXISTS public.reporte_productividad(date, date, text, bigint);

CREATE OR REPLACE FUNCTION public.reporte_productividad(
    p_fecha_inicio date,
    p_fecha_fin date,
    p_cve_ciudad text DEFAULT NULL,
    p_id_tanque bigint DEFAULT NULL
)
RETURNS TABLE (
    "EstadoRegistro" text,
    "Tanque" text,
    "Unidad" text,
    "IDUnidad" bigint,
    "Viajes" bigint,
    "MetrosCubicos" numeric,
    "Kms Totales" bigint,
    "Hrs Totales" bigint,
    "Litros Consumidos" numeric,
    "Lts/M3" numeric,
    "Km/Lts" numeric,
    "M3/Viaje" numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH Viajes_CTE AS (
        SELECT 
            "NombreUnidad",
            COUNT(DISTINCT "Id_Viaje") AS "TotalViajes",
            SUM("CargaViaje") AS "TotalMetros"
        FROM public."InformacionGeneral_Cierres"
        -- IMPORTANTE: "FechaInicio" viene como texto en la tabla destino según definición
        WHERE CAST("FechaInicio" AS date) BETWEEN p_fecha_inicio AND p_fecha_fin
          AND (p_cve_ciudad IS NULL OR "CveCiudad" = p_cve_ciudad)
        GROUP BY "NombreUnidad"
    ), 
    Recorridos_CTE AS (
        SELECT 
            tm."IdUnidad",
            COALESCE(MAX(tm."Odometro") - MIN(tm."Odometro"), 0)::bigint AS "KmsRecorridos",
            COALESCE(MAX(tm."Horimetro") - MIN(tm."Horimetro"), 0)::bigint AS "HrsTrabajo"
        FROM public."TanqueMovimiento" tm
        WHERE tm."TipoMovimiento" = 'S'
          AND tm."FechaCarga" BETWEEN p_fecha_inicio AND p_fecha_fin
          AND (p_cve_ciudad IS NULL OR tm."CveCiudad" = p_cve_ciudad)
        GROUP BY tm."IdUnidad"
    ),
    Consumos_CTE AS (
        SELECT
            tm."IdUnidad",
            tm."IdTanque",
            COALESCE(SUM(tm."LitrosCarga"), 0)::numeric AS "CargaTotal"
        FROM public."TanqueMovimiento" tm
        WHERE tm."TipoMovimiento" = 'S'
          AND tm."FechaCarga" BETWEEN p_fecha_inicio AND p_fecha_fin
          AND (p_cve_ciudad IS NULL OR tm."CveCiudad" = p_cve_ciudad)
          AND (p_id_tanque IS NULL OR tm."IdTanque" = p_id_tanque)
        GROUP BY tm."IdUnidad", tm."IdTanque"
    )
    SELECT
        -- Bandera para saber si la unidad de la bascula existe en DieselApp
        CASE 
            WHEN u."IDUnidad" IS NOT NULL THEN 'Registrada'::text 
            ELSE 'No Registrada'::text 
        END AS "EstadoRegistro",
        
        -- Tanque (puede ser NULL si fue un viaje pero no cargó combustible ese día/rango)
        COALESCE(t."Nombre"::text, 'N/A') AS "Tanque",

        -- Mostrar el económico de DieselApp, y si no existe, el de la transaccional
        COALESCE(
            (u."IDClaveUnidad" || '(' || u."ClaveAlterna" || ')')::text, 
            v."NombreUnidad"::text
        ) AS "Unidad",

        u."IDUnidad" AS "IDUnidad",
        
        -- Datos Transaccionales
        COALESCE(v."TotalViajes", 0)::bigint AS "Viajes",
        COALESCE(v."TotalMetros", 0)::numeric AS "MetrosCubicos",
        
        -- Datos Operativos
        COALESCE(rec."KmsRecorridos", 0)::bigint AS "Kms Totales",
        COALESCE(rec."HrsTrabajo", 0)::bigint AS "Hrs Totales",
        COALESCE(c."CargaTotal", 0)::numeric AS "Litros Consumidos",
        
        -- KPIs
        -- 1. Lts/M3 (Costo Energético)
        ROUND(
            (COALESCE(c."CargaTotal", 0) / NULLIF(v."TotalMetros", 0))::numeric, 
        4) AS "Lts/M3",
        
        -- 2. Km/Lts (Rendimiento Mecánico Puro)
        ROUND(
            (COALESCE(rec."KmsRecorridos", 0)::numeric / NULLIF(c."CargaTotal", 0))::numeric, 
        4) AS "Km/Lts",
        
        -- 3. M3/Viaje (Capacidad Ociosa/Productividad logística)
        ROUND(
            (COALESCE(v."TotalMetros", 0) / NULLIF(v."TotalViajes", 0))::numeric, 
        4) AS "M3/Viaje"

    FROM Viajes_CTE v
    
    -- LEFT JOIN hacia las unidades y consumos para basarnos primero en los que tuvieron viajes
    LEFT JOIN public."Unidades" u 
        ON RTRIM(LTRIM(v."NombreUnidad")) = RTRIM(LTRIM(u."IDClaveUnidad"))
        
    LEFT JOIN Consumos_CTE c 
        ON c."IdUnidad" = u."IDUnidad"
        
    LEFT JOIN Recorridos_CTE rec
        ON rec."IdUnidad" = u."IDUnidad"
        
    LEFT JOIN public."Tanque" t 
        ON c."IdTanque" = t."IDTanque"
        
    ORDER BY 
        "EstadoRegistro" DESC, 
        v."TotalMetros" DESC,
        u."IDClaveUnidad";

END;
$$;

-- =====================================================
-- Permisos
-- =====================================================
GRANT EXECUTE ON FUNCTION public.reporte_productividad(date, date, text, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reporte_productividad(date, date, text, bigint) TO anon;
