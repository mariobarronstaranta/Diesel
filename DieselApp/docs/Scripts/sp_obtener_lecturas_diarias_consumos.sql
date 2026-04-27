-- =============================================
-- Función: sp_obtener_lecturas_diarias_consumos
-- Propósito:
--   Extiende el reporte base de lecturas diarias para incluir:
--   1. Entradas por fecha/tanque desde TanqueMovimiento
--   2. Consumo Alturas convertido a litros desde VolumenAlturaTanque
--   3. Consumo Salidas por fecha/tanque desde TanqueMovimiento
--
-- Reglas de negocio:
--   - Ciudad proviene de Tanque.CveCiudad
--   - Entradas = SUM(TanqueMovimiento.LitrosCarga)
--       donde TipoMovimiento = 'E'
--       y se agrupa por FechaCarga + IdTanque, incluso si ese dia no hubo lectura
--   - Consumo Alturas = Volumen(Altura Inicial) - Volumen(Altura Final)
--       usando la tabla VolumenAlturaTanque por TanqueId
--       y resolviendo la altura más cercana cuando LecturaCms tiene decimales
--       cuando no existe entrada en el día.
--   - Si existe entrada ('E') en la fecha/tanque:
--       ConsumoAntes   = Vol(LecturaInicial) - Vol(AlturaTanque)
--       ConsumoDespues = Vol(Altura2Tanque) - Vol(LecturaFinal)
--       ConsumoAlturas = ConsumoAntes + ConsumoDespues
--   - Consumo Salidas = SUM(TanqueMovimiento.LitrosCarga)
--       donde TipoMovimiento = 'S'
--       y se agrupa por FechaCarga + IdTanque
--
-- Índices recomendados:
--   - VolumenAlturaTanque("TanqueId", "Altura") para los LATERAL de cubicación
--   - TanqueMovimiento("IdTanque", "FechaCarga", "TipoMovimiento") para entradas/salidas
--
-- Bitácora de cambios:
--   2026-04-16:
--   - Se crea una nueva función para no modificar sp_obtener_lecturas_diarias
--     y evitar impacto directo en producción.
--   - Se agrega la columna Entradas desde TanqueMovimiento.
--   - Se agrega la columna ConsumoAlturas usando VolumenAlturaTanque.
--   - Se corrige el contrato para exponer ciudad desde Tanque.CveCiudad.
--   - Se corrige ambigüedad de columnas dentro de subconsultas/CTEs.
--   - Refactor: se eliminan DISTINCT/PARTITION BY redundantes,
--     se simplifica EntradasPorDia y se eliminan predicados de JOIN
--     innecesarios (ciudad/nombre son dependientes de idtanque).
--   - Ajuste funcional: las entradas ya no dependen de que exista lectura activa
--     el mismo dia; el reporte incluye dias con solo movimientos de entrada.
--   2026-04-22:
--   - Se agrega la columna consumo_salidas: SUM(LitrosCarga) TipoMovimiento='S'
--     por tanque y fecha, usando el nuevo CTE SalidasPorDia.
--   2026-04-23:
--   - Se agrega función escalar fn_calcular_consumo_alturas_por_fecha_tanque(fecha, tanque).
--   - sp_obtener_lecturas_diarias_consumos delega el cálculo de consumo_alturas
--     a la función escalar para soportar entradas con AlturaTanque/Altura2Tanque.
-- =============================================

-- Dependencia:
-- Este procedimiento requiere que exista previamente:
-- fn_calcular_consumo_alturas_por_fecha_tanque(DATE, INTEGER)
-- Script recomendado de despliegue: ejecutar primero
-- `fn_calcular_consumo_alturas_por_fecha_tanque.sql` y luego este archivo.
--
-- Contrato operativo:
-- - Este SP NO recalcula directamente consumo_alturas.
-- - Delega esa lógica a la función escalar para concentrar reglas de negocio
--   y facilitar mantenimiento/versionado.
--
-- HowTo:
-- - Ejecutar primero fn_calcular_consumo_alturas_por_fecha_tanque.sql.
-- - Ejecutar después este script para recrear el SP principal del reporte.
-- - Probar con:
--   SELECT *
--   FROM sp_obtener_lecturas_diarias_consumos('MTY', '2026-04-01', '2026-04-30', NULL);
-- - Verificar especialmente días con entrada, días sin entrada y días con solo entradas.

DROP FUNCTION IF EXISTS sp_obtener_lecturas_diarias_consumos(TEXT, DATE, DATE, INTEGER);

CREATE OR REPLACE FUNCTION sp_obtener_lecturas_diarias_consumos(
    p_ciudad TEXT DEFAULT NULL,
    p_fecha_inicial DATE DEFAULT NULL,
    p_fecha_final DATE DEFAULT NULL,
    p_id_tanque INTEGER DEFAULT NULL
)
RETURNS TABLE (
    ciudad TEXT,
    nombre TEXT,
    fecha DATE,
    lectura_inicial_cms NUMERIC(8,2),
    lectura_final_cms NUMERIC(8,2),
    entradas BIGINT,
    consumo_alturas NUMERIC(8,2),
    cuenta_litros_inicial BIGINT,
    cuenta_litros_final BIGINT,
    diferencia_cuenta_litros BIGINT,
    consumo_salidas BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH LecturasFiltradas AS (
        -- Lecturas activas del rango solicitado con datos del tanque.
        -- JOIN N:1 a Tanque no genera duplicados; DISTINCT no es necesario.
        SELECT
            TN."IDTanque"::INTEGER as idtanque,
            TN."CveCiudad"::TEXT as ciudad,
            TN."Nombre"::TEXT as nombre,
            TAL."Fecha",
            TAL."Hora",
            TAL."LecturaCms",
            TAL."CuentaLitros"
        FROM public."TanqueLecturas" TAL
        JOIN public."Tanque" TN ON TN."IDTanque" = TAL."IDTanque"::INTEGER
        WHERE
            TAL."Activo" <> 0
            AND TAL."Fecha" BETWEEN p_fecha_inicial AND p_fecha_final
            AND (
                p_ciudad IS NULL
                OR p_ciudad = ''
                OR p_ciudad = '-1'
                OR TN."CveCiudad" = p_ciudad
            )
            AND (
                p_id_tanque IS NULL
                OR TN."IDTanque" = p_id_tanque
            )
    ),
    EntradasPorDia AS (
        -- Suma entradas (TipoMovimiento='E') por tanque y fecha.
        -- Se calcula directo desde TanqueMovimiento para no depender de lecturas.
        SELECT
            tn."IDTanque"::INTEGER as idtanque,
            tn."CveCiudad"::TEXT as ciudad,
            tn."Nombre"::TEXT as nombre,
            tm."FechaCarga" as fecha,
            COALESCE(SUM(tm."LitrosCarga"), 0)::BIGINT as entradas
        FROM public."TanqueMovimiento" tm
        JOIN public."Tanque" tn
            ON tn."IDTanque" = tm."IdTanque"
        WHERE
            tm."TipoMovimiento" = 'E'
            AND tm."FechaCarga" BETWEEN p_fecha_inicial AND p_fecha_final
            AND (
                p_ciudad IS NULL
                OR p_ciudad = ''
                OR p_ciudad = '-1'
                OR tn."CveCiudad" = p_ciudad
            )
            AND (
                p_id_tanque IS NULL
                OR tn."IDTanque" = p_id_tanque
            )
        GROUP BY
            tn."IDTanque",
            tn."CveCiudad",
            tn."Nombre",
            tm."FechaCarga"
    ),
    SalidasPorDia AS (
        -- Suma salidas (TipoMovimiento='S') por tanque y fecha.
        SELECT
            tn."IDTanque"::INTEGER as idtanque,
            tm."FechaCarga" as fecha,
            COALESCE(SUM(tm."LitrosCarga"), 0)::BIGINT as salidas
        FROM public."TanqueMovimiento" tm
        JOIN public."Tanque" tn
            ON tn."IDTanque" = tm."IdTanque"
        WHERE
            tm."TipoMovimiento" = 'S'
            AND tm."FechaCarga" BETWEEN p_fecha_inicial AND p_fecha_final
            AND (
                p_ciudad IS NULL
                OR p_ciudad = ''
                OR p_ciudad = '-1'
                OR tn."CveCiudad" = p_ciudad
            )
            AND (
                p_id_tanque IS NULL
                OR tn."IDTanque" = p_id_tanque
            )
        GROUP BY
            tn."IDTanque",
            tm."FechaCarga"
    ),
    LecturasOrdenadas AS (
        -- Primera y última lectura del día por tanque.
        -- ciudad/nombre dependen de idtanque, no van en PARTITION BY.
        SELECT
            lf.idtanque,
            lf.ciudad,
            lf.nombre,
            lf."Fecha",
            lf."LecturaCms",
            lf."CuentaLitros",
            ROW_NUMBER() OVER(PARTITION BY lf.idtanque, lf."Fecha" ORDER BY lf."Hora" ASC)  as rn_asc,
            ROW_NUMBER() OVER(PARTITION BY lf.idtanque, lf."Fecha" ORDER BY lf."Hora" DESC) as rn_desc
        FROM LecturasFiltradas lf
    ),
    DiasBase AS (
        -- Conjunto base de dias a reportar: dias con lectura y dias con entradas.
        -- NOTA: Se preserva este comportamiento por compatibilidad histórica del reporte.
        --       Dias con solo salidas (sin lectura y sin entrada) no se agregan aquí.
        SELECT DISTINCT
            lf.idtanque,
            lf.ciudad,
            lf.nombre,
            lf."Fecha" as fecha
        FROM LecturasFiltradas lf
        UNION
        SELECT
            epd.idtanque,
            epd.ciudad,
            epd.nombre,
            epd.fecha
        FROM EntradasPorDia epd
    ),
    PrimeraLectura AS (
        SELECT
            lo.idtanque,
            lo.ciudad,
            lo.nombre,
            lo."Fecha",
            lo."LecturaCms",
            lo."CuentaLitros"
        FROM LecturasOrdenadas lo
        WHERE lo.rn_asc = 1
    ),
    UltimaLectura AS (
        SELECT
            lo.idtanque,
            lo.ciudad,
            lo.nombre,
            lo."Fecha",
            lo."LecturaCms",
            lo."CuentaLitros"
        FROM LecturasOrdenadas lo
        WHERE lo.rn_desc = 1
    )
    SELECT
        -- Contrato de salida (orden exacto):
        -- 1 ciudad, 2 nombre, 3 fecha,
        -- 4 lectura_inicial_cms, 5 lectura_final_cms,
        -- 6 entradas, 7 consumo_alturas,
        -- 8 cuenta_litros_inicial, 9 cuenta_litros_final,
        -- 10 diferencia_cuenta_litros, 11 consumo_salidas.
        db.ciudad,
        db.nombre,
        db.fecha,
        pl."LecturaCms"::NUMERIC(8,2),
        ul."LecturaCms"::NUMERIC(8,2),
        COALESCE(epd.entradas, 0)::BIGINT,
        -- Consumo Alturas con lógica especial cuando existe entrada de combustible.
        -- La función helper también aplica fallback al cálculo tradicional
        -- cuando no hay entrada o faltan alturas antes/después.
        fn_calcular_consumo_alturas_por_fecha_tanque(db.fecha, db.idtanque),
        pl."CuentaLitros",
        ul."CuentaLitros",
        CASE
            -- Diferencia de cuenta litros definida como Final - Inicial.
            -- Si falta alguna lectura, se retorna NULL para evitar asumir cero artificial.
            WHEN pl."CuentaLitros" IS NULL OR ul."CuentaLitros" IS NULL THEN NULL
            ELSE ul."CuentaLitros" - pl."CuentaLitros"
        END,
        COALESCE(spd.salidas, 0)::BIGINT
    FROM DiasBase db
    LEFT JOIN PrimeraLectura pl
        ON  pl.idtanque = db.idtanque
        AND pl."Fecha" = db.fecha
    LEFT JOIN UltimaLectura ul
        ON  ul.idtanque = db.idtanque
        AND ul."Fecha" = db.fecha
    LEFT JOIN EntradasPorDia epd
        ON  epd.idtanque = db.idtanque
        AND epd.fecha    = db.fecha
    LEFT JOIN SalidasPorDia spd
        ON  spd.idtanque = db.idtanque
        AND spd.fecha    = db.fecha
    ORDER BY db.ciudad, db.nombre, db.fecha;
END;
$$;