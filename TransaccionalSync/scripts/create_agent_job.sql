-- =============================================================================
-- SCRIPT   : create_agent_job.sql
-- MÓDULO   : TransaccionalSync
-- =============================================================================
-- DESCRIPCIÓN
--   Crea el SQL Server Agent Job que ejecuta el proceso de sincronización
--   diaria de viajes hacia Supabase. El Job corre todos los días a las 06:00 AM
--   y ejecuta el PowerShell script Sync-ViajesSupabase.ps1.
--
-- PRE-REQUISITOS
--   1. SQL Server Agent debe estar habilitado y corriendo (verifica en SSMS)
--   2. El script PowerShell debe estar copiado al servidor en la ruta
--      indicada en @command (ajustar según tu entorno)
--   3. Las tablas de control y SPs deben estar creados (create_sync_tables.sql
--      + SP scripts)
--   4. El archivo sync.config.json debe estar en la ruta config\ del script
--
-- =============================================================================
-- BITÁCORA DE CAMBIOS
-- -----------------------------------------------------------------------------
-- Versión | Fecha       | Autor        | Descripción
-- --------|-------------|--------------|------------------------------------------
-- 1.0.0   | 2026-02-23  | [Tu Nombre]  | Creación inicial del Job
-- =============================================================================

USE [msdb]  -- Los Jobs de SQL Server Agent viven en msdb
GO

-- ─── Eliminar el Job si ya existe (para re-deploy seguro) ────────────────────
IF EXISTS (SELECT 1 FROM msdb.dbo.sysjobs WHERE name = N'DieselSync_ViajesSupabase')
BEGIN
    EXEC msdb.dbo.sp_delete_job @job_name = N'DieselSync_ViajesSupabase';
    PRINT 'Job anterior eliminado.';
END
GO

-- ─── Crear el Job ────────────────────────────────────────────────────────────
EXEC msdb.dbo.sp_add_job
    @job_name              = N'DieselSync_ViajesSupabase',
    @enabled               = 1,
    @description           = N'Sincronización diaria de viajes cerrados (camiones revolvedores) desde SQL Server hacia Supabase. Ejecuta Sync-ViajesSupabase.ps1 que obtiene los viajes del día anterior y hace un bulk DELETE + INSERT en la tabla InformacionGeneral_Cierres.',
    @category_name         = N'[Uncategorized (Local)]',
    @owner_login_name      = N'sa',    -- ⚠️ Cambiar al login del proceso ETL
    @notify_level_eventlog = 2;        -- Escribe en el Event Log solo si hay error
GO

-- ─── Agregar el paso de ejecución (PowerShell) ───────────────────────────────
EXEC msdb.dbo.sp_add_jobstep
    @job_name        = N'DieselSync_ViajesSupabase',
    @step_name       = N'Ejecutar Sync-ViajesSupabase.ps1',
    @step_id         = 1,
    @subsystem       = N'PowerShell',
    @command         = N'
# ⚠️ Ajustar esta ruta a donde copiaste el script en el servidor
$scriptPath = "C:\Concretec\scripts\Sync-ViajesSupabase.ps1"

if (Test-Path $scriptPath) {
    & $scriptPath
} else {
    throw "Script no encontrado en: $scriptPath"
}
',
    @on_success_action = 1,   -- 1 = Salir con éxito
    @on_fail_action    = 2,   -- 2 = Salir con fallo (registra en historial)
    @retry_attempts    = 1,   -- 1 reintento si falla
    @retry_interval    = 10;  -- Esperar 10 minutos antes de reintentar
GO

-- ─── Programar ejecución diaria a las 06:00 AM ───────────────────────────────
EXEC msdb.dbo.sp_add_schedule
    @schedule_name     = N'Diariamente_6AM',
    @freq_type         = 4,        -- 4 = Diario
    @freq_interval     = 1,        -- Cada 1 día
    @active_start_time = 60000;    -- 06:00:00 AM (formato HHMMSS)
GO

-- ─── Asociar el horario al Job ────────────────────────────────────────────────
EXEC msdb.dbo.sp_attach_schedule
    @job_name      = N'DieselSync_ViajesSupabase',
    @schedule_name = N'Diariamente_6AM';
GO

-- ─── Registrar el Job en el servidor local ────────────────────────────────────
EXEC msdb.dbo.sp_add_jobserver
    @job_name   = N'DieselSync_ViajesSupabase',
    @server_name = N'(LOCAL)';
GO

PRINT 'Job DieselSync_ViajesSupabase creado y programado exitosamente.';
GO


-- =============================================================================
-- COMANDOS ÚTILES PARA GESTIÓN DEL JOB
-- =============================================================================

-- Ejecutar el Job manualmente (para prueba):
-- EXEC msdb.dbo.sp_start_job @job_name = N'DieselSync_ViajesSupabase';

-- Ver historial de ejecuciones del Job:
-- EXEC msdb.dbo.sp_help_jobhistory @job_name = N'DieselSync_ViajesSupabase';

-- Ver estatus actual:
-- EXEC msdb.dbo.sp_help_job @job_name = N'DieselSync_ViajesSupabase';

-- Deshabilitar temporalmente el Job:
-- EXEC msdb.dbo.sp_update_job @job_name = N'DieselSync_ViajesSupabase', @enabled = 0;

-- Habilitar de nuevo:
-- EXEC msdb.dbo.sp_update_job @job_name = N'DieselSync_ViajesSupabase', @enabled = 1;
