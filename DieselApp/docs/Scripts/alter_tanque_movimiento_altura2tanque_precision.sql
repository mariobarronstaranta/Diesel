-- =============================================
-- Script: alter_tanque_movimiento_altura2tanque_precision
-- Propósito:
--   Homologar la precisión de TanqueMovimiento.Altura2Tanque con AlturaTanque.
--
-- Comentarios de desarrollador:
--   - Este cambio es estructural; altera el tipo a numeric(8,2).
--   - Usa ROUND durante la conversión para evitar residuos de precisión previos.
--   - Es prerequisito técnico para el cálculo segmentado de consumo_alturas.
--
-- HowTo:
--   - Ejecutar en Supabase/PostgreSQL antes de desplegar funciones que dependan de Altura2Tanque.
--   - Validar después con:\d public."TanqueMovimiento"
--
-- Bitácora de cambios:
--   2026-04-23:
--   - Se agrega encabezado de documentación técnica y propósito del ALTER.
-- =============================================

ALTER TABLE public."TanqueMovimiento"
ALTER COLUMN "Altura2Tanque" TYPE numeric(8, 2)
USING ROUND("Altura2Tanque"::numeric, 2);
