-- =============================================================================
-- SCRIPT   : create_sync_tables.sql
-- MÓDULO   : TransaccionalSync
-- =============================================================================
-- DESCRIPCIÓN
--   Crea las tablas de control y bitácora del proceso de sincronización
--   diario de viajes hacia Supabase. Todas las tablas se crean en el
--   esquema dbo bajo el prefijo Sync_ para fácil identificación.
--
-- TABLAS
--   - Sync_Ejecucion   : Registro maestro por ejecución del proceso (1 por día)
--   - Sync_Detalle     : Registro por viaje enviado en cada ejecución
--
-- =============================================================================
-- BITÁCORA DE CAMBIOS
-- -----------------------------------------------------------------------------
-- Versión | Fecha       | Autor        | Descripción
-- --------|-------------|--------------|------------------------------------------
-- 1.0.0   | 2026-02-23  | [Tu Nombre]  | Creación inicial de tablas de control
-- =============================================================================

USE [Pedidos]
GO

-- =============================================================================
-- TABLA: Sync_Ejecucion
-- Registro maestro. Una fila por ejecución del proceso de sincronización.
-- =============================================================================
IF OBJECT_ID('dbo.Sync_Ejecucion', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Sync_Ejecucion (
        IDEjecucion         INT             IDENTITY(1,1)   NOT NULL,
        FechaProceso        DATE                            NOT NULL,   -- Fecha de los viajes sincronizados
        FechaInicio         DATETIME        DEFAULT GETDATE()  NOT NULL, -- Cuándo arrancó el proceso
        FechaFin            DATETIME                        NULL,       -- Cuándo terminó (NULL = en curso)
        TotalRegistros      INT             DEFAULT 0       NOT NULL,   -- Registros obtenidos del SP origen
        RegistrosEnviados   INT             DEFAULT 0       NOT NULL,   -- Registros enviados exitosamente a Supabase
        Estatus             VARCHAR(20)     DEFAULT 'EN_PROCESO' NOT NULL,
            -- Valores posibles: EN_PROCESO | EXITOSO | ERROR | SIN_DATOS
        HttpStatusCode      INT                             NULL,       -- HTTP response code de Supabase (200, 201, 4xx, 5xx)
        MensajeError        NVARCHAR(MAX)                   NULL,       -- Detalle del error si Estatus = ERROR
        HostEjecucion       VARCHAR(100)    DEFAULT HOST_NAME()  NOT NULL, -- Servidor que ejecutó el proceso
        UsuarioEjecucion    VARCHAR(100)    DEFAULT SYSTEM_USER  NOT NULL, -- Cuenta de Windows que ejecutó el job

        CONSTRAINT PK_Sync_Ejecucion PRIMARY KEY (IDEjecucion),
        CONSTRAINT CK_Sync_Ejecucion_Estatus
            CHECK (Estatus IN ('EN_PROCESO', 'EXITOSO', 'ERROR', 'SIN_DATOS'))
    );

    -- Índice para consultas por fecha (el más frecuente)
    CREATE INDEX IX_Sync_Ejecucion_FechaProceso
        ON dbo.Sync_Ejecucion (FechaProceso DESC);

    PRINT 'Tabla dbo.Sync_Ejecucion creada correctamente.';
END
ELSE
    PRINT 'Tabla dbo.Sync_Ejecucion ya existe. No se realizaron cambios.';
GO


-- =============================================================================
-- TABLA: Sync_Detalle
-- Una fila por viaje incluido en cada ejecución.
-- Permite saber exactamente qué viajes se enviaron y cuáles fallaron.
-- =============================================================================
IF OBJECT_ID('dbo.Sync_Detalle', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Sync_Detalle (
        IDDetalle           INT             IDENTITY(1,1)   NOT NULL,
        IDEjecucion         INT                             NOT NULL,   -- FK a Sync_Ejecucion
        IDViaje             BIGINT                          NOT NULL,   -- Viaje sincronizado
        Remision            VARCHAR(50)                     NULL,       -- Remisión del cierre
        IDUnidad            BIGINT                          NULL,       -- Camión (para trazabilidad)
        NombreUnidad        VARCHAR(100)                    NULL,
        FechaViaje          DATE                            NULL,       -- Fecha del viaje
        Estatus             VARCHAR(20)     DEFAULT 'ENVIADO' NOT NULL,
            -- Valores posibles: ENVIADO | ERROR
        MensajeError        NVARCHAR(500)                   NULL,

        CONSTRAINT PK_Sync_Detalle PRIMARY KEY (IDDetalle),
        CONSTRAINT FK_Sync_Detalle_Ejecucion
            FOREIGN KEY (IDEjecucion) REFERENCES dbo.Sync_Ejecucion (IDEjecucion),
        CONSTRAINT CK_Sync_Detalle_Estatus
            CHECK (Estatus IN ('ENVIADO', 'ERROR'))
    );

    -- Índice para buscar por ejecución (JOIN frecuente)
    CREATE INDEX IX_Sync_Detalle_IDEjecucion
        ON dbo.Sync_Detalle (IDEjecucion);

    -- Índice para buscar por viaje (para consultas de trazabilidad)
    CREATE INDEX IX_Sync_Detalle_IDViaje
        ON dbo.Sync_Detalle (IDViaje);

    PRINT 'Tabla dbo.Sync_Detalle creada correctamente.';
END
ELSE
    PRINT 'Tabla dbo.Sync_Detalle ya existe. No se realizaron cambios.';
GO


-- =============================================================================
-- VISTA DE RESUMEN (opcional pero útil para monitoreo)
-- Lista las últimas ejecuciones con su resumen
-- =============================================================================
IF OBJECT_ID('dbo.vw_Sync_Resumen', 'V') IS NOT NULL
    DROP VIEW dbo.vw_Sync_Resumen;
GO

CREATE VIEW dbo.vw_Sync_Resumen AS
SELECT
    e.IDEjecucion,
    e.FechaProceso,
    e.FechaInicio,
    e.FechaFin,
    DATEDIFF(SECOND, e.FechaInicio, ISNULL(e.FechaFin, GETDATE())) AS DuracionSegundos,
    e.TotalRegistros,
    e.RegistrosEnviados,
    e.Estatus,
    e.HttpStatusCode,
    e.MensajeError,
    e.HostEjecucion,
    e.UsuarioEjecucion
FROM dbo.Sync_Ejecucion e;
GO

PRINT 'Vista dbo.vw_Sync_Resumen creada correctamente.';
GO


-- =============================================================================
-- CONSULTAS ÚTILES PARA MONITOREO
-- =============================================================================

-- Ver las últimas 10 ejecuciones
-- SELECT TOP 10 * FROM dbo.vw_Sync_Resumen ORDER BY FechaInicio DESC;

-- Ver detalle de los viajes enviados en la última ejecución
-- SELECT d.* FROM dbo.Sync_Detalle d
-- WHERE d.IDEjecucion = (SELECT MAX(IDEjecucion) FROM dbo.Sync_Ejecucion)
-- ORDER BY d.IDViaje;

-- Ver ejecuciones con error en el último mes
-- SELECT * FROM dbo.Sync_Ejecucion
-- WHERE Estatus = 'ERROR' AND FechaProceso >= DATEADD(MONTH, -1, GETDATE())
-- ORDER BY FechaInicio DESC;
