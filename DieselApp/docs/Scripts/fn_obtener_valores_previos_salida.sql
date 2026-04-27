-- =====================================================
-- Función: fn_obtener_valores_previos_salida
-- Propósito:
--   Obtener odómetro y horímetro de la salida inmediata anterior
--   de una unidad, para cálculo incremental de rendimiento consolidado.
--
-- Comentarios de desarrollador:
--   - Busca en TanqueMovimiento solo movimientos de salida (TipoMovimiento = 'S').
--   - Define "inmediato anterior" por orden: FechaCarga DESC, HoraCarga DESC,
--     IdTanqueMovimiento DESC.
--   - p_id_tanque_movimiento permite desempate cuando hay la misma fecha/hora.
--   - p_cve_ciudad es opcional para mantener coherencia con filtros por ciudad.
--
-- HowTo:
--   - Ejecutar este script antes de Rendimientos_v2.sql.
--   - Probar con:
--     SELECT *
--     FROM public.fn_obtener_valores_previos_salida(1001, '2026-04-23', '10:30:00', NULL, 'MTY');
--
-- Bitácora de cambios:
--   2026-04-24:
--   - Se separa en archivo propio para mejor control de versiones y despliegue.
-- =====================================================

DROP FUNCTION IF EXISTS public.fn_obtener_valores_previos_salida(bigint, date, time, bigint, text);

CREATE OR REPLACE FUNCTION public.fn_obtener_valores_previos_salida(
    p_id_unidad bigint,
    p_fecha date,
    p_hora time,
    p_id_tanque_movimiento bigint DEFAULT NULL,
    p_cve_ciudad text DEFAULT NULL
)
RETURNS TABLE (
    odometro_anterior bigint,
    horimetro_anterior bigint
)
LANGUAGE sql
STABLE
AS $$
    -- Devuelve solo dos valores del movimiento inmediatamente anterior:
    -- odómetro y horímetro.
    SELECT
        tm_prev."Odometro"::bigint AS odometro_anterior,
        tm_prev."Horimetro"::bigint AS horimetro_anterior
    FROM public."TanqueMovimiento" tm_prev
    -- 1) Mismo dominio funcional: solo salidas de diesel.
    WHERE tm_prev."TipoMovimiento" = 'S'
      -- 2) Debe pertenecer a la misma unidad que estamos evaluando.
      AND tm_prev."IdUnidad" = p_id_unidad
      -- 3) Si llega ciudad, se respeta; si llega NULL, no filtra por ciudad.
      AND (p_cve_ciudad IS NULL OR tm_prev."CveCiudad" = p_cve_ciudad)
      -- 4) Debe ser estrictamente anterior al movimiento actual:
      --    - Fecha menor, o
      --    - Misma fecha y hora menor, o
      --    - Misma fecha/hora y menor IdTanqueMovimiento (desempate determinista).
      AND (
            tm_prev."FechaCarga" < p_fecha
            OR (
                tm_prev."FechaCarga" = p_fecha
                AND (
                    tm_prev."HoraCarga" < p_hora
                    OR (
                        tm_prev."HoraCarga" = p_hora
                        AND p_id_tanque_movimiento IS NOT NULL
                        AND tm_prev."IdTanqueMovimiento" < p_id_tanque_movimiento
                    )
                )
            )
      )
    -- Orden descendente para traer primero el más cercano hacia atrás en el tiempo.
    ORDER BY
        tm_prev."FechaCarga" DESC,
        tm_prev."HoraCarga" DESC,
        tm_prev."IdTanqueMovimiento" DESC
    -- Toma exactamente un registro: el inmediato anterior.
    LIMIT 1;
$$;
