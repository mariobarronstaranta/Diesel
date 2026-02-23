-- =============================================================================
-- STORED PROCEDURE : sp_RegistrarInicioSync
-- MÓDULO           : TransaccionalSync
-- =============================================================================
-- DESCRIPCIÓN
--   Registra el inicio de una ejecución del proceso de sincronización en la
--   tabla Sync_Ejecucion. Retorna el IDEjecucion generado para que el
--   script PowerShell lo use durante toda la ejecución.
--
-- PARÁMETROS
--   @FechaProceso   date    Fecha de los viajes a sincronizar
--   @IDEjecucion    int     OUTPUT — ID del registro creado en Sync_Ejecucion
--
-- =============================================================================
-- BITÁCORA DE CAMBIOS
-- -----------------------------------------------------------------------------
-- Versión | Fecha       | Autor        | Descripción
-- --------|-------------|--------------|------------------------------------------
-- 1.0.0   | 2026-02-23  | [Tu Nombre]  | Creación inicial
-- =============================================================================

USE [Pedidos]
GO

IF OBJECT_ID('dbo.sp_RegistrarInicioSync', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_RegistrarInicioSync;
GO

CREATE PROCEDURE dbo.sp_RegistrarInicioSync
    @FechaProceso   date,
    @IDEjecucion    int OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.Sync_Ejecucion (
        FechaProceso,
        FechaInicio,
        Estatus
    )
    VALUES (
        @FechaProceso,
        GETDATE(),
        'EN_PROCESO'
    );

    -- Retorna el ID recién generado al script PowerShell
    SET @IDEjecucion = SCOPE_IDENTITY();

END;
GO

-- =============================================================================
-- EJEMPLO DE USO
-- =============================================================================
-- DECLARE @ID INT;
-- EXEC dbo.sp_RegistrarInicioSync @FechaProceso = '2026-02-22', @IDEjecucion = @ID OUTPUT;
-- PRINT 'Ejecucion iniciada con ID: ' + CAST(@ID AS VARCHAR);
