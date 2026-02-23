-- =============================================================================
-- STORED PROCEDURE : sp_RegistrarDetalleSync
-- MÓDULO           : TransaccionalSync
-- =============================================================================
-- DESCRIPCIÓN
--   Inserta en lote los registros de detalle de cada viaje sincronizado
--   en una ejecución. Usa un Table-Valued Parameter para recibir múltiples
--   filas en una sola llamada desde PowerShell.
--
-- PARÁMETROS
--   @IDEjecucion    int                     ID de la ejecución (FK a Sync_Ejecucion)
--   @Detalle        TVP_Sync_Detalle        Tabla con los viajes enviados
--
-- TVP (Table-Valued Parameter)
--   Se define antes del SP como un tipo de tabla en la base de datos.
--
-- =============================================================================
-- BITÁCORA DE CAMBIOS
-- -----------------------------------------------------------------------------
-- Versión | Fecha       | Autor        | Descripción
-- --------|-------------|--------------|------------------------------------------
-- 1.0.0   | 2026-02-23  | [Tu Nombre]  | Creación inicial con TVP
-- =============================================================================

USE [Pedidos]
GO

-- =============================================================================
-- TIPO DE TABLA (TVP) — debe crearse antes que el SP que lo usa
-- =============================================================================
IF TYPE_ID('dbo.TVP_Sync_Detalle') IS NOT NULL
    DROP TYPE dbo.TVP_Sync_Detalle;
GO

CREATE TYPE dbo.TVP_Sync_Detalle AS TABLE (
    IDViaje         BIGINT          NOT NULL,
    Remision        VARCHAR(50)     NULL,
    IDUnidad        BIGINT          NULL,
    NombreUnidad    VARCHAR(100)    NULL,
    FechaViaje      DATE            NULL,
    Estatus         VARCHAR(20)     NOT NULL DEFAULT 'ENVIADO',
    MensajeError    NVARCHAR(500)   NULL
);
GO


-- =============================================================================
-- SP
-- =============================================================================
IF OBJECT_ID('dbo.sp_RegistrarDetalleSync', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_RegistrarDetalleSync;
GO

CREATE PROCEDURE dbo.sp_RegistrarDetalleSync
    @IDEjecucion    int,
    @Detalle        dbo.TVP_Sync_Detalle READONLY
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.Sync_Detalle (
        IDEjecucion,
        IDViaje,
        Remision,
        IDUnidad,
        NombreUnidad,
        FechaViaje,
        Estatus,
        MensajeError
    )
    SELECT
        @IDEjecucion,
        IDViaje,
        Remision,
        IDUnidad,
        NombreUnidad,
        FechaViaje,
        Estatus,
        MensajeError
    FROM @Detalle;

END;
GO

-- =============================================================================
-- EJEMPLO DE USO DESDE T-SQL
-- =============================================================================
-- DECLARE @Viajes dbo.TVP_Sync_Detalle;
--
-- INSERT INTO @Viajes (IDViaje, Remision, IDUnidad, NombreUnidad, FechaViaje, Estatus)
-- VALUES
--     (1001, 'REM-001', 42, 'CR-001', '2026-02-22', 'ENVIADO'),
--     (1002, 'REM-002', 43, 'CR-002', '2026-02-22', 'ENVIADO');
--
-- EXEC dbo.sp_RegistrarDetalleSync @IDEjecucion = 1, @Detalle = @Viajes;
