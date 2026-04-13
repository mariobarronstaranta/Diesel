-- =====================================================
-- Función: reporte_productividad_v2
-- Descripción:
--   Reporte de Productividad consolidado por unidad.
--   Regla clave cuando hay filtro por tanque:
--   1) El tanque seleccionado SOLO define unidades objetivo.
--   2) El cálculo final de litros/tanques usa TODAS las cargas
--      de esas unidades dentro del rango y ciudad.
-- =====================================================

DROP FUNCTION IF EXISTS public.reporte_productividad_v2(date, date, text, bigint);

CREATE OR REPLACE FUNCTION public.reporte_productividad_v2(
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
    WITH viajes_cte AS (
        SELECT
            igc."NombreUnidad",
            COUNT(DISTINCT igc."Id_Viaje")::bigint AS "TotalViajes",
            COALESCE(SUM(igc."CargaViaje"), 0)::numeric AS "TotalMetros"
        FROM public."InformacionGeneral_Cierres" igc
        WHERE CAST(igc."FechaInicio" AS date) BETWEEN p_fecha_inicio AND p_fecha_fin
          AND (p_cve_ciudad IS NULL OR igc."CveCiudad" = p_cve_ciudad)
        GROUP BY igc."NombreUnidad"
    ),
    viajes_unidad AS (
        SELECT
            v."NombreUnidad",
            v."TotalViajes",
            v."TotalMetros",
            u."IDUnidad",
            u."IDClaveUnidad",
            u."ClaveAlterna"
        FROM viajes_cte v
        LEFT JOIN public."Unidades" u
            ON RTRIM(LTRIM(v."NombreUnidad")) = RTRIM(LTRIM(u."IDClaveUnidad"))
    ),
    unidades_objetivo AS (
        SELECT DISTINCT vu."IDUnidad"
        FROM viajes_unidad vu
        WHERE vu."IDUnidad" IS NOT NULL
          AND (
            p_id_tanque IS NULL
            OR EXISTS (
                SELECT 1
                FROM public."TanqueMovimiento" tmf
                WHERE tmf."TipoMovimiento" = 'S'
                  AND tmf."FechaCarga" BETWEEN p_fecha_inicio AND p_fecha_fin
                  AND (p_cve_ciudad IS NULL OR tmf."CveCiudad" = p_cve_ciudad)
                  AND tmf."IdUnidad" = vu."IDUnidad"
                  AND tmf."IdTanque" = p_id_tanque
            )
          )
    ),
    movimientos_all AS (
        SELECT
            tm."IdUnidad",
            tm."IdTanque",
            COALESCE(tm."LitrosCarga", 0)::numeric AS "LitrosCarga",
            tm."Odometro",
            tm."Horimetro"
        FROM public."TanqueMovimiento" tm
        INNER JOIN unidades_objetivo uo
            ON uo."IDUnidad" = tm."IdUnidad"
        WHERE tm."TipoMovimiento" = 'S'
          AND tm."FechaCarga" BETWEEN p_fecha_inicio AND p_fecha_fin
          AND (p_cve_ciudad IS NULL OR tm."CveCiudad" = p_cve_ciudad)
    ),
    consumos_cte AS (
        SELECT
            ma."IdUnidad",
            COALESCE(SUM(ma."LitrosCarga"), 0)::numeric AS "CargaTotal"
        FROM movimientos_all ma
        GROUP BY ma."IdUnidad"
    ),
    recorridos_cte AS (
        SELECT
            ma."IdUnidad",
            COALESCE(MAX(ma."Odometro") - MIN(ma."Odometro"), 0)::bigint AS "KmsRecorridos",
            COALESCE(MAX(ma."Horimetro") - MIN(ma."Horimetro"), 0)::bigint AS "HrsTrabajo"
        FROM movimientos_all ma
        GROUP BY ma."IdUnidad"
    ),
    tanques_cte AS (
        SELECT
            ma."IdUnidad",
            STRING_AGG(DISTINCT COALESCE(t."Nombre", 'N/A')::text, ', ' ORDER BY COALESCE(t."Nombre", 'N/A')::text) AS "TanquesUtilizados"
        FROM movimientos_all ma
        LEFT JOIN public."Tanque" t
            ON t."IDTanque" = ma."IdTanque"
        GROUP BY ma."IdUnidad"
    )
    SELECT
        CASE
            WHEN vu."IDUnidad" IS NOT NULL THEN 'Registrada'::text
            ELSE 'No Registrada'::text
        END AS "EstadoRegistro",

        CASE
            WHEN vu."IDUnidad" IS NULL THEN 'N/A'::text
            ELSE COALESCE(tq."TanquesUtilizados", 'N/A')
        END AS "Tanque",

        COALESCE(
            (vu."IDClaveUnidad" || '(' || vu."ClaveAlterna" || ')')::text,
            vu."NombreUnidad"::text
        ) AS "Unidad",

        vu."IDUnidad" AS "IDUnidad",
        COALESCE(vu."TotalViajes", 0)::bigint AS "Viajes",
        COALESCE(vu."TotalMetros", 0)::numeric AS "MetrosCubicos",
        COALESCE(rc."KmsRecorridos", 0)::bigint AS "Kms Totales",
        COALESCE(rc."HrsTrabajo", 0)::bigint AS "Hrs Totales",
        COALESCE(cc."CargaTotal", 0)::numeric AS "Litros Consumidos",

        ROUND(
            (COALESCE(cc."CargaTotal", 0) / NULLIF(vu."TotalMetros", 0))::numeric,
            4
        ) AS "Lts/M3",

        ROUND(
            (COALESCE(rc."KmsRecorridos", 0)::numeric / NULLIF(cc."CargaTotal", 0))::numeric,
            4
        ) AS "Km/Lts",

        ROUND(
            (COALESCE(vu."TotalMetros", 0) / NULLIF(vu."TotalViajes", 0))::numeric,
            4
        ) AS "M3/Viaje"

    FROM viajes_unidad vu
    LEFT JOIN unidades_objetivo uo
        ON uo."IDUnidad" = vu."IDUnidad"
    LEFT JOIN consumos_cte cc
        ON cc."IdUnidad" = vu."IDUnidad"
    LEFT JOIN recorridos_cte rc
        ON rc."IdUnidad" = vu."IDUnidad"
    LEFT JOIN tanques_cte tq
        ON tq."IdUnidad" = vu."IDUnidad"

    WHERE (
        p_id_tanque IS NULL
        OR (vu."IDUnidad" IS NOT NULL AND uo."IDUnidad" IS NOT NULL)
    )

    ORDER BY
        "EstadoRegistro" DESC,
        vu."TotalMetros" DESC,
        vu."IDClaveUnidad";
END;
$$;

-- =====================================================
-- Permisos
-- =====================================================
GRANT EXECUTE ON FUNCTION public.reporte_productividad_v2(date, date, text, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reporte_productividad_v2(date, date, text, bigint) TO anon;
