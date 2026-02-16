-- =====================================================
-- Función: get_reporte_consumos
-- Descripción: Genera un reporte de consumos de combustible
--              agrupado por fecha, ciudad y tanque
-- Parámetros:
--   - p_fecha_inicio: Fecha de inicio del rango (YYYY-MM-DD)
--   - p_fecha_fin: Fecha de fin del rango (YYYY-MM-DD)
--   - p_cve_ciudad: Clave de ciudad como texto (opcional, NULL = todas)
--   - p_id_tanque: ID de tanque (opcional, NULL = todos)
-- Retorna: JSON con el reporte de consumos
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_reporte_consumos(
    p_fecha_inicio DATE,
    p_fecha_fin DATE,
    p_cve_ciudad TEXT DEFAULT NULL,
    p_id_tanque BIGINT DEFAULT NULL
)
RETURNS TABLE (
    fecha DATE,
    ciudad TEXT,
    tanque TEXT,
    "idTanque" BIGINT,
    "totalEntradas" BIGINT,
    "totalSalidas" BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tm."FechaCarga" AS fecha,
        tm."CveCiudad" AS ciudad,
        t."Nombre" AS tanque,
        tm."IdTanque" AS "idTanque",
        
        -- Suma de entradas (TipoMovimiento = 'E')
        COALESCE(SUM(CASE WHEN tm."TipoMovimiento" = 'E' THEN tm."LitrosCarga" ELSE 0 END), 0) AS "totalEntradas",
        
        -- Suma de salidas (TipoMovimiento = 'S')
        COALESCE(SUM(CASE WHEN tm."TipoMovimiento" = 'S' THEN tm."LitrosCarga" ELSE 0 END), 0) AS "totalSalidas"
    FROM 
        public."TanqueMovimiento" tm
        INNER JOIN public."Tanque" t ON tm."CveCiudad" = t."CveCiudad" AND tm."IdTanque" = t."IDTanque"
    WHERE 
        tm."FechaCarga" BETWEEN p_fecha_inicio AND p_fecha_fin
        -- Filtros opcionales
        AND (p_cve_ciudad IS NULL OR tm."CveCiudad" = p_cve_ciudad)
        AND (p_id_tanque IS NULL OR tm."IdTanque" = p_id_tanque)
    GROUP BY 
        tm."FechaCarga",
        tm."CveCiudad",
        t."Nombre",
        tm."IdTanque"
    ORDER BY 
        tm."FechaCarga" DESC,
        tm."CveCiudad",
        t."Nombre";
END;
$$;

-- =====================================================
-- Permisos
-- =====================================================
-- Otorgar permisos de ejecución a usuarios autenticados
-- NOTA: Ajustar según las políticas de seguridad del proyecto
-- ALTER FUNCTION public.get_reporte_consumos(DATE, DATE, INTEGER, BIGINT) 
--     OWNER TO authenticated;

-- =====================================================
-- Ejemplo de uso
-- =====================================================

-- 1. Obtener todos los consumos en un rango de fechas
-- SELECT * FROM get_reporte_consumos('2026-02-01', '2026-02-28', NULL, NULL);

-- 2. Filtrar por ciudad específica (usando CveCiudad como texto, ej: 'MTY')
-- SELECT * FROM get_reporte_consumos('2026-02-01', '2026-02-28', 'MTY', NULL);

-- 3. Filtrar por tanque específico (ID = 5)
-- SELECT * FROM get_reporte_consumos('2026-02-01', '2026-02-28', NULL, 5);

-- 4. Filtrar por ciudad Y tanque
-- SELECT * FROM get_reporte_consumos('2026-02-01', '2026-02-28', 'MTY', 5);

-- =====================================================
-- Notas de implementación
-- =====================================================
-- 1. Tablas utilizadas (SIMPLIFICADO):
--    - "TanqueMovimiento" ✓ (tabla principal)
--    - "Tanque" ✓ (para obtener nombre del tanque)
--    NOTA: No se usan las tablas Planta ni Ciudad porque la relación
--          es directa mediante CveCiudad (campo de texto)
--
-- 2. Confirmar los valores de TipoMovimiento:
--    - 'E' = Entradas
--    - 'S' = Salidas
--
-- 3. Relación entre tablas:
--    - TanqueMovimiento.CveCiudad = Tanque.CveCiudad (campo de texto) ✓
--    - TanqueMovimiento.IdTanque = Tanque.IDTanque ✓
--
-- 4. Para usar desde el frontend (Supabase JS):
--    const { data, error } = await supabase
--      .rpc('get_reporte_consumos', {
--        p_fecha_inicio: '2026-02-01',
--        p_fecha_fin: '2026-02-28',
--        p_cve_ciudad: 'MTY',  // Texto, no ID numérico
--        p_id_tanque: null
--      });
--
-- 5. Considerar agregar índices para mejorar el rendimiento:
--    CREATE INDEX IF NOT EXISTS idx_tanque_movimiento_fecha 
--      ON public."TanqueMovimiento"("FechaCarga");
--    CREATE INDEX IF NOT EXISTS idx_tanque_movimiento_tipo 
--      ON public."TanqueMovimiento"("TipoMovimiento");
