-- =============================================
-- Función: fn_calcular_consumo_alturas_por_fecha_tanque
-- Propósito:
--   Calcular Consumo Alturas por Fecha + Tanque para Reporte de Lecturas.
--
-- Reglas de cálculo:
--   1) Sin entrada del día (TipoMovimiento <> 'E' para el tanque/fecha):
--      ConsumoAlturas = Vol(LecturaInicial) - Vol(LecturaFinal)
--
--   2) Con entrada del día (TipoMovimiento = 'E') usando AlturaTanque/Altura2Tanque:
--      ConsumoAntes   = Vol(LecturaInicial) - Vol(AlturaTanque)
--      ConsumoDespues = Vol(Altura2Tanque) - Vol(LecturaFinal)
--      ConsumoAlturas = ConsumoAntes + ConsumoDespues
--
-- Notas:
--   - LecturaInicial = primera lectura activa por Hora (ascendente).
--   - LecturaFinal   = última lectura activa por Hora (descendente).
--   - Si hay múltiples entradas 'E' en el mismo día/tanque,
--     se toma la primera por HoraCarga para mantener criterio determinista.
--   - La búsqueda de volumen en VolumenAlturaTanque se hace por altura más cercana.
--   - Si no hay lecturas activas para el día/tanque, retorna 0.
--   - Si no hay entrada (o faltan AlturaTanque/Altura2Tanque),
--     aplica el cálculo tradicional LecturaInicial - LecturaFinal.
--
-- Alcance:
--   - Esta función está diseñada para ser consumida por
--     sp_obtener_lecturas_diarias_consumos.
--   - No modifica datos; solo calcula un valor escalar.
--
-- HowTo:
--   1. Ejecutar este script antes de sp_obtener_lecturas_diarias_consumos.sql.
--   2. Probar manualmente con:
--      SELECT fn_calcular_consumo_alturas_por_fecha_tanque('2026-04-01', 1);
--   3. Validar dos escenarios:
--      - Día sin entrada: cálculo tradicional.
--      - Día con entrada: cálculo por tramos usando AlturaTanque/Altura2Tanque.
--
-- Bitácora de cambios:
--   2026-04-23:
--   - Se crea la función escalar para separar la lógica de consumo_alturas.
--   - Se documentan supuestos operativos, fallback y criterio determinista.
-- =============================================

DROP FUNCTION IF EXISTS fn_calcular_consumo_alturas_por_fecha_tanque(DATE, INTEGER);

CREATE OR REPLACE FUNCTION fn_calcular_consumo_alturas_por_fecha_tanque(
    p_fecha DATE,
    p_id_tanque INTEGER
)
RETURNS NUMERIC(8,2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_lectura_inicial NUMERIC(8,2);
    v_lectura_final NUMERIC(8,2);
    v_altura_antes NUMERIC(8,2);
    v_altura_despues NUMERIC(8,2);

    v_vol_lectura_inicial NUMERIC(12,2);
    v_vol_lectura_final NUMERIC(12,2);
    v_vol_altura_antes NUMERIC(12,2);
    v_vol_altura_despues NUMERIC(12,2);

    v_consumo_antes NUMERIC(12,2);
    v_consumo_despues NUMERIC(12,2);
BEGIN
    -- Primera y última lectura activa del día para el tanque.
  -- Se consideran únicamente lecturas activas (Activo <> 0).
    SELECT tl."LecturaCms"::NUMERIC(8,2)
      INTO v_lectura_inicial
    FROM public."TanqueLecturas" tl
    WHERE tl."Activo" <> 0
      AND tl."IDTanque"::INTEGER = p_id_tanque
      AND tl."Fecha" = p_fecha
    ORDER BY tl."Hora" ASC
    LIMIT 1;

    SELECT tl."LecturaCms"::NUMERIC(8,2)
      INTO v_lectura_final
    FROM public."TanqueLecturas" tl
    WHERE tl."Activo" <> 0
      AND tl."IDTanque"::INTEGER = p_id_tanque
      AND tl."Fecha" = p_fecha
    ORDER BY tl."Hora" DESC
    LIMIT 1;

    IF v_lectura_inicial IS NULL AND v_lectura_final IS NULL THEN
      -- Sin lecturas para el día/tanque: no hay consumo por alturas que calcular.
        RETURN 0::NUMERIC(8,2);
    END IF;

    -- Entrada del día: AlturaTanque = antes; Altura2Tanque = después.
    -- Criterio: primera entrada por HoraCarga (determinista).
    SELECT tm."AlturaTanque"::NUMERIC(8,2), tm."Altura2Tanque"::NUMERIC(8,2)
      INTO v_altura_antes, v_altura_despues
    FROM public."TanqueMovimiento" tm
    WHERE tm."IdTanque"::INTEGER = p_id_tanque
      AND tm."FechaCarga" = p_fecha
      AND tm."TipoMovimiento" = 'E'
    ORDER BY tm."HoraCarga" ASC
    LIMIT 1;

    -- Volumen equivalente de lectura inicial.
    SELECT vat."Volumen"::NUMERIC(12,2)
      INTO v_vol_lectura_inicial
    FROM public."VolumenAlturaTanque" vat
    WHERE vat."TanqueId"::INTEGER = p_id_tanque
      AND v_lectura_inicial IS NOT NULL
    ORDER BY ABS(vat."Altura"::NUMERIC - v_lectura_inicial), vat."Altura"
    LIMIT 1;

    -- Volumen equivalente de lectura final.
    SELECT vat."Volumen"::NUMERIC(12,2)
      INTO v_vol_lectura_final
    FROM public."VolumenAlturaTanque" vat
    WHERE vat."TanqueId"::INTEGER = p_id_tanque
      AND v_lectura_final IS NOT NULL
    ORDER BY ABS(vat."Altura"::NUMERIC - v_lectura_final), vat."Altura"
    LIMIT 1;

    -- Fallback compatible:
    -- Si no hay entrada o faltan alturas antes/después, usar cálculo tradicional.
    IF v_altura_antes IS NULL OR v_altura_despues IS NULL THEN
        RETURN (COALESCE(v_vol_lectura_inicial, 0) - COALESCE(v_vol_lectura_final, 0))::NUMERIC(8,2);
    END IF;

    -- Volumen equivalente antes de la entrada.
    SELECT vat."Volumen"::NUMERIC(12,2)
      INTO v_vol_altura_antes
    FROM public."VolumenAlturaTanque" vat
    WHERE vat."TanqueId"::INTEGER = p_id_tanque
    ORDER BY ABS(vat."Altura"::NUMERIC - v_altura_antes), vat."Altura"
    LIMIT 1;

    -- Volumen equivalente después de la entrada.
    SELECT vat."Volumen"::NUMERIC(12,2)
      INTO v_vol_altura_despues
    FROM public."VolumenAlturaTanque" vat
    WHERE vat."TanqueId"::INTEGER = p_id_tanque
    ORDER BY ABS(vat."Altura"::NUMERIC - v_altura_despues), vat."Altura"
    LIMIT 1;

    -- Tramos de consumo del día cuando hubo entrada.
    v_consumo_antes := COALESCE(v_vol_lectura_inicial, 0) - COALESCE(v_vol_altura_antes, 0);
    v_consumo_despues := COALESCE(v_vol_altura_despues, 0) - COALESCE(v_vol_lectura_final, 0);

    -- Puede devolver negativo si las alturas/volúmenes no cumplen el patrón esperado
    -- (dato atípico o captura fuera de secuencia). No se fuerza clamp a 0 por diseño.
    RETURN (v_consumo_antes + v_consumo_despues)::NUMERIC(8,2);
END;
$$;
