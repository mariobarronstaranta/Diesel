-- =============================================================================
-- STORED PROCEDURE : sp_CerrarSync
-- MÓDULO           : TransaccionalSync
-- =============================================================================
-- DESCRIPCIÓN
--   Cierra el registro de una ejecución en Sync_Ejecucion, actualizando
--   el estatus final, el conteo de registros enviados, el código HTTP
--   de la respuesta de Supabase y cualquier mensaje de error.
--
--   Se llama al final del script PowerShell, tanto en caso de éxito
--   como en caso de error.
--
-- PARÁMETROS
--   @IDEjecucion        int             ID de la ejecución a cerrar
--   @TotalRegistros     int             Registros obtenidos del SP origen
--   @RegistrosEnviados  int             Registros enviados ok a Supabase
--   @Estatus            varchar(20)     EXITOSO | ERROR | SIN_DATOS
--   @HttpStatusCode     int             Código HTTP de Supabase (NULL si no aplica)
--   @MensajeError       nvarchar(max)   Detalle del error (NULL si exitoso)
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

IF OBJECT_ID('dbo.sp_CerrarSync', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_CerrarSync;
GO

CREATE PROCEDURE dbo.sp_CerrarSync
    @IDEjecucion        int,
    @TotalRegistros     int,
    @RegistrosEnviados  int,
    @Estatus            varchar(20),
    @HttpStatusCode     int             = NULL,
    @MensajeError       nvarchar(max)   = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Validar que el IDEjecucion exista
    IF NOT EXISTS (SELECT 1 FROM dbo.Sync_Ejecucion WHERE IDEjecucion = @IDEjecucion)
    BEGIN
        RAISERROR('IDEjecucion %d no encontrado en Sync_Ejecucion.', 16, 1, @IDEjecucion);
        RETURN;
    END;

    UPDATE dbo.Sync_Ejecucion SET
        FechaFin            = GETDATE(),
        TotalRegistros      = @TotalRegistros,
        RegistrosEnviados   = @RegistrosEnviados,
        Estatus             = @Estatus,
        HttpStatusCode      = @HttpStatusCode,
        MensajeError        = @MensajeError
    WHERE IDEjecucion = @IDEjecucion;

END;
GO

-- =============================================================================
-- EJEMPLOS DE USO
-- =============================================================================

-- Cierre exitoso:
-- EXEC dbo.sp_CerrarSync
--     @IDEjecucion       = 1,
--     @TotalRegistros    = 178,
--     @RegistrosEnviados = 178,
--     @Estatus           = 'EXITOSO',
--     @HttpStatusCode    = 201;

-- Cierre con error:
-- EXEC dbo.sp_CerrarSync
--     @IDEjecucion       = 1,
--     @TotalRegistros    = 178,
--     @RegistrosEnviados = 0,
--     @Estatus           = 'ERROR',
--     @HttpStatusCode    = 500,
--     @MensajeError      = 'Timeout al conectar con Supabase REST API';

-- Sin datos para la fecha:
-- EXEC dbo.sp_CerrarSync
--     @IDEjecucion       = 1,
--     @TotalRegistros    = 0,
--     @RegistrosEnviados = 0,
--     @Estatus           = 'SIN_DATOS';
