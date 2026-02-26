-- =============================================================
-- Tabla: LoginBitacora
-- Descripción: Registra cada intento de inicio de sesión
-- Ejecutar en: Supabase SQL Editor
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

