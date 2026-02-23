-- =============================================================================
-- STORED PROCEDURE : sp_SincronizarViajesCierres
-- BASE DE DATOS    : [TU_BASE_TRANSACCIONAL]
-- ESQUEMA          : dbo
-- =============================================================================
-- DESCRIPCIÓN
--   Extrae la información consolidada de viajes con sus cierres (remisiones)
--   para una fecha específica. El resultado está diseñado para ser consumido
--   por el proceso de sincronización ETL que carga la tabla desnormalizada
--   [InformacionGeneral_Cierres] en Supabase, permitiendo el cruce de
--   rendimiento de diesel vs. producción de cemento por unidad (camión revolvedor).
--
-- FILTROS APLICADOS
--   - Solo unidades tipo "camión revolvedor" (IDClaveUnidad LIKE '%CR%')
--   - Solo viajes con remisión capturada y no vacía (cierre confirmado)
--   - Solo productos con clasificación 'CONC' (concreto)
--   - Rango de fecha configurable con soporte a ventana de fecha
--
-- PARÁMETROS
--   @FechaInicio   date   Fecha de inicio del rango de viajes (requerido)
--   @FechaFin      date   Fecha de fin del rango de viajes (default = @FechaInicio)
--
-- RETORNA
--   Resultset con una fila por viaje-remisión, lista para UPSERT en Supabase.
--
-- =============================================================================
-- BITÁCORA DE CAMBIOS
-- -----------------------------------------------------------------------------
-- Versión | Fecha       | Autor                | Descripción
-- --------|-------------|----------------------|--------------------------------
-- 1.0.0   | 2026-02-23  | [Tu Nombre]          | Creación inicial. Conversión
--         |             |                      | del query ad-hoc a SP parametrizado
--         |             |                      | con soporte a rango de fechas y
--         |             |                      | optimizaciones de performance.
-- =============================================================================

USE [Pedidos]
GO

-- Elimina la versión anterior si existe
IF OBJECT_ID('dbo.sp_SincronizarViajesCierres', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_SincronizarViajesCierres;
GO

CREATE PROCEDURE dbo.sp_SincronizarViajesCierres
    @FechaInicio    date,
    @FechaFin       date = NULL     -- Si no se especifica, usa solo @FechaInicio
AS
BEGIN
    -- =========================================================================
    -- CONFIGURACIÓN
    -- =========================================================================
    SET NOCOUNT ON;         -- Evita mensajes de "N rows affected" innecesarios
    SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
    -- READ UNCOMMITTED (NOLOCK equivalente a nivel de sesión):
    -- Apropiado para reportes/ETL de solo lectura. Evita bloqueos en tablas
    -- transaccionales activas (Viaje, Pedidos, PedidoViajeCierre) durante
    -- horas de operación. RIESGO: lecturas sucias (aceptable para este caso
    -- ya que sincronizamos cierres del día anterior confirmados).

    -- =========================================================================
    -- NORMALIZACIÓN DE PARÁMETROS
    -- =========================================================================
    -- Si no se proporciona FechaFin, el rango es solo el día de FechaInicio
    IF @FechaFin IS NULL
        SET @FechaFin = @FechaInicio;

    -- Validación básica de rango
    IF @FechaFin < @FechaInicio
    BEGIN
        RAISERROR('El parámetro @FechaFin no puede ser menor a @FechaInicio.', 16, 1);
        RETURN;
    END;

    -- =========================================================================
    -- QUERY PRINCIPAL
    -- =========================================================================
    -- NOTAS DE PERFORMANCE:
    --
    -- 1. ÍNDICES SUGERIDOS (verificar si ya existen con sp_helpindex):
    --    - Viaje(FechaInicio, IDEstatusViaje) INCLUDE (IDPlanta, IDUnidad, IDOperador)
    --    - Unidad(IDUnidad) INCLUDE (IDClaveUnidad)
    --    - PedidoViaje(IDViaje) INCLUDE (IDPedido)
    --    - PedidoViajeCierre(IDViaje, IDPedido) INCLUDE (Remision, CargaViaje)
    --    - PedidoDetalle(IDPedido) INCLUDE (IDUso, IDVendedor)
    --    - PedidoProducto(IDPedido) INCLUDE (IDProducto)
    --    - Producto(IDProducto, CveCiudad, Clasificacion)
    --
    -- 2. fn_LimpiarTextoCSV: Si esta función es escalar (scalar UDF), puede
    --    ser un cuello de botella al ejecutarse fila por fila. Considera
    --    convertirla a iTVF (inline Table-Valued Function) o aplicar el
    --    REPLACE/limpieza directamente en el SELECT para mejor performance.
    --
    -- 3. El JOIN con Obra usa clave compuesta (ClaveObra + CveCiudad) y el
    --    JOIN con Clientes también (ClaveCliente + CveCiudad). Asegúrate
    --    de que existan índices compuestos en esas columnas.
    --
    -- 4. Para volúmenes grandes, considera filtrar primero en una CTE/subquery
    --    sobre la tabla Viaje antes de hacer todos los JOINs.

    ;WITH ViajesBase AS (
        -- ─────────────────────────────────────────────────────────────────────
        -- CTE: Pre-filtra viajes del rango de fechas para camiones revolvedores.
        -- Reducir el rowset ANTES de hacer los JOINs mejora el plan de ejecución.
        -- ─────────────────────────────────────────────────────────────────────
        SELECT
            VI.Id_Viaje,
            VI.IDPlanta,
            VI.IDUnidad,
            VI.IDOperador,
            VI.IDEstatusViaje,
            VI.FechaInicio,
            VI.HoraInicio,
            VI.HoraFin
        FROM Viaje VI WITH (NOLOCK)
        INNER JOIN Unidad UNI WITH (NOLOCK)
            ON UNI.IDUnidad = VI.IDUnidad
            AND UNI.IDClaveUnidad LIKE '%CR%'   -- Solo camiones revolvedores
        WHERE VI.FechaInicio BETWEEN @FechaInicio AND @FechaFin
    )

    SELECT
        -- ─── Identificadores de viaje ────────────────────────────────────────
        VI.Id_Viaje,
        PED.IDPedido,

        -- ─── Carga y cierre ──────────────────────────────────────────────────
        PVC.CargaViaje,
        PVC.Remision,

        -- ─── Planta de origen ────────────────────────────────────────────────
        VI.IDPlanta,
        dbo.fn_LimpiarTextoCSV(PLA.Nombre)          AS NombrePlantaViaje,

        -- ─── Unidad (camión revolvedor) ───────────────────────────────────────
        VI.IDUnidad,
        dbo.fn_LimpiarTextoCSV(UNI.IDClaveUnidad)   AS NombreUnidad,

        -- ─── Operador ────────────────────────────────────────────────────────
        VI.IDOperador,
        dbo.fn_LimpiarTextoCSV(
            PER.Nombre + ' ' + ISNULL(PER.APaterno, '')
        )                                           AS NombreOperador,

        -- ─── Estatus del viaje ───────────────────────────────────────────────
        VI.IDEstatusViaje,
        EST.Descripcion                             AS NombreEstatus,

        -- ─── Tiempos del viaje ───────────────────────────────────────────────
        VI.FechaInicio,
        VI.HoraInicio,
        VI.HoraFin,

        -- ─── Obra / proyecto ─────────────────────────────────────────────────
        PED.IDObra,
        dbo.fn_LimpiarTextoCSV(OBR.Nombre)          AS NombreObra,

        -- ─── Cliente ─────────────────────────────────────────────────────────
        PED.IDCliente                               AS IDClienteSAE,
        dbo.fn_LimpiarTextoCSV(CLI.NombreCompleto)  AS NombreCliente,

        -- ─── Uso y producto ──────────────────────────────────────────────────
        PDD.IDUso,
        USO.Descripcion                             AS NombreUso,
        PRO.IDProducto,
        dbo.fn_LimpiarTextoCSV(PRO.Descripcion)     AS NombreProducto,

        -- ─── Ciudad y vendedor ───────────────────────────────────────────────
        PED.CveCiudad,
        dbo.fn_LimpiarTextoCSV(VEND.Nombre) + ' '
            + dbo.fn_LimpiarTextoCSV(VEND.APaterno) AS NombreVendedor

    FROM ViajesBase VI

    INNER JOIN Plantas          PLA  WITH (NOLOCK)  ON PLA.IDPlanta       = VI.IDPlanta
    INNER JOIN Unidad           UNI  WITH (NOLOCK)  ON UNI.IDUnidad        = VI.IDUnidad
    INNER JOIN Personal         PER  WITH (NOLOCK)  ON PER.IDPersonal      = VI.IDOperador
    INNER JOIN EstatusViaje     EST  WITH (NOLOCK)  ON EST.IDEstatusViaje  = VI.IDEstatusViaje
    INNER JOIN PedidoViaje      PEV  WITH (NOLOCK)  ON PEV.IDViaje         = VI.Id_Viaje
    INNER JOIN Pedidos          PED  WITH (NOLOCK)  ON PED.IDPedido        = PEV.IDPedido
    INNER JOIN Obra             OBR  WITH (NOLOCK)  ON OBR.ClaveObra       = PED.IDObra
                                                   AND OBR.CveCiudad       = PED.CveCiudad
    INNER JOIN Ciudad           CDS  WITH (NOLOCK)  ON CDS.CveCiudad       = PED.CveCiudad
    INNER JOIN Clientes         CLI  WITH (NOLOCK)  ON CLI.ClaveCliente     = PED.IDCliente
                                                   AND CLI.CveCiudad        = OBR.CveCiudad
    INNER JOIN PedidoDetalle    PDD  WITH (NOLOCK)  ON PDD.IDPedido         = PED.IDPedido
    INNER JOIN Uso              USO  WITH (NOLOCK)  ON USO.IDUso            = PDD.IDUso
    INNER JOIN PedidoProducto   PPO  WITH (NOLOCK)  ON PPO.IDPedido         = PED.IDPedido
    INNER JOIN Producto         PRO  WITH (NOLOCK)  ON PRO.IDProducto       = PPO.IDProducto
                                                   AND PRO.CveCiudad        = PED.CveCiudad
                                                   AND PRO.Clasificacion     = 'CONC'   -- Solo concreto

    -- Cierre del viaje (LEFT: se mantienen aunque no tengan cierre aún)
    LEFT JOIN PedidoViajeCierre PVC  WITH (NOLOCK)  ON PVC.IDViaje          = VI.Id_Viaje
                                                   AND PVC.IDPedido          = PED.IDPedido

    -- Vendedor del pedido (puede no existir)
    LEFT JOIN Personal          VEND WITH (NOLOCK)  ON VEND.IDPersonal       = PDD.IDVendedor

    -- ─── Filtro final: solo viajes con remisión capturada y no vacía ─────────
    WHERE PVC.Remision IS NOT NULL
      AND LEN(LTRIM(RTRIM(PVC.Remision))) > 0

    ORDER BY VI.FechaInicio, VI.Id_Viaje;

END;
GO


-- =============================================================================
-- PERMISOS
-- =============================================================================
-- Otorgar ejecución al usuario del proceso ETL (ajustar según el login real)
-- GRANT EXECUTE ON dbo.sp_SincronizarViajesCierres TO [usuario_etl];
-- GO


-- =============================================================================
-- EJEMPLOS DE USO
-- =============================================================================

-- 1. Viajes de un día específico (uso típico del job nocturno)
-- EXEC dbo.sp_SincronizarViajesCierres @FechaInicio = '2026-02-22';

-- 2. Rango de fechas (relleno histórico o re-sincronización)
-- EXEC dbo.sp_SincronizarViajesCierres @FechaInicio = '2026-02-01', @FechaFin = '2026-02-22';

-- 3. Verificar número de registros que generaría para una fecha
-- SELECT COUNT(*) FROM OPENROWSET(
--   'SQLNCLI', 'Server=.;Trusted_Connection=yes;',
--   'EXEC TU_BASE.dbo.sp_SincronizarViajesCierres @FechaInicio = ''2026-02-22'''
-- );
