-- Ajusta la precisión de Altura2Tanque para homologarla con AlturaTanque.
-- Ejecutar en Supabase/PostgreSQL.

ALTER TABLE public."TanqueMovimiento"
ALTER COLUMN "Altura2Tanque" TYPE numeric(8, 2)
USING ROUND("Altura2Tanque"::numeric, 2);
