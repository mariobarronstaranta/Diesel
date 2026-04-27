-- =============================================================
-- Script: LoginBitacora
-- Propósito:
--   Crear o ajustar la tabla de bitácora de login y sus políticas auxiliares.
--
-- Comentarios de desarrollador:
--   - Este archivo mezcla ALTERs incrementales y un CREATE comentado como referencia.
--   - `FechaLogin` usa zona horaria de México para registro operativo más útil.
--   - Incluye ejemplo de índices, RLS y policies mínimas para uso desde app.
--
-- HowTo:
--   - Si la tabla ya existe, ejecutar los ALTER visibles.
--   - Si es instalación nueva, usar el CREATE comentado y luego índices/policies.
--   - Validar después estructura y políticas en Supabase.
--
-- Bitácora de cambios:
--   2026-04-23:
--   - Se normaliza el encabezado con comentarios de desarrollador, howto y bitácora.
-- =============================================================

-- Si ya creaste la tabla, ejecuta estos ALTER:
ALTER TABLE "LoginBitacora" ADD COLUMN IF NOT EXISTS "Exitoso" boolean NOT NULL DEFAULT true;

-- Cambiar el DEFAULT de FechaLogin para usar hora de México Central (CST/CDT)
-- en lugar de UTC (now())
ALTER TABLE "LoginBitacora"
  ALTER COLUMN "FechaLogin"
  SET DEFAULT (now() AT TIME ZONE 'America/Mexico_City');

-- Si es tabla nueva, usa este CREATE completo:
-- CREATE TABLE IF NOT EXISTS "LoginBitacora" (
--     "Id"            bigserial       PRIMARY KEY,
--     "CveUsuario"    varchar(50)     NOT NULL,
--     "FechaLogin"    timestamptz     NOT NULL DEFAULT (now() AT TIME ZONE 'America/Mexico_City'),
--     "UserAgent"     varchar(500)    NULL,
--     "Exitoso"       boolean         NOT NULL DEFAULT true
-- );
--
-- CREATE INDEX IF NOT EXISTS idx_login_bitacora_usuario 
--     ON "LoginBitacora" (\"CveUsuario\", "FechaLogin" DESC);
--
-- ALTER TABLE "LoginBitacora" ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Permitir INSERT desde app" ON "LoginBitacora"
--     FOR INSERT WITH CHECK (true);
--
-- CREATE POLICY "Permitir SELECT desde app" ON "LoginBitacora"
--     FOR SELECT USING (true);

