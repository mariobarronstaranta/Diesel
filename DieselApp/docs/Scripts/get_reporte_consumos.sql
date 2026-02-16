-- =====================================================
-- Función: get_reporte_consumos
-- Descripción: Genera un reporte de consumos de combustible
--              agrupado por fecha, ciudad y tanque
-- Parámetros:
--   - p_fecha_inicio: Fecha de inicio del rango (YYYY-MM-DD)
--   - p_fecha_fin: Fecha de fin del rango (YYYY-MM-DD)
--   - p_id_ciudad: ID de ciudad (opcional, NULL = todas)
--   - p_id_tanque: ID de tanque (opcional, NULL = todos)
-- Retorna: JSON con el reporte de consumos
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_reporte_consumos(
    p_fecha_inicio DATE,
    p_fecha_fin DATE,
    p_id_ciudad INTEGER DEFAULT NULL,
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
        c."Nombre" AS ciudad,
        t."Nombre" AS tanque,
        tm."IdTanque" AS "idTanque",
        
        -- Suma de entradas (TipoMovimiento = 'E')
        COALESCE(SUM(CASE WHEN tm."TipoMovimiento" = 'E' THEN tm."LitrosCarga" ELSE 0 END), 0) AS "totalEntradas",
        
        -- Suma de salidas (TipoMovimiento = 'S')
        COALESCE(SUM(CASE WHEN tm."TipoMovimiento" = 'S' THEN tm."LitrosCarga" ELSE 0 END), 0) AS "totalSalidas"
    FROM 
        public."TanqueMovimiento" tm
        INNER JOIN public."Tanque" t ON tm."IdTanque" = t."IDTanque"
        INNER JOIN public."Planta" p ON t."IDPlanta" = p."IDPlanta"
        INNER JOIN public."Ciudad" c ON p."IdCiudad" = c."IDCiudad"
    WHERE 
        tm."FechaCarga" BETWEEN p_fecha_inicio AND p_fecha_fin
        -- Filtros opcionales
        AND (p_id_ciudad IS NULL OR c."IDCiudad" = p_id_ciudad)
        AND (p_id_tanque IS NULL OR tm."IdTanque" = p_id_tanque)
    GROUP BY 
        tm."FechaCarga",
        c."Nombre",
        t."Nombre",
        tm."IdTanque"
    ORDER BY 
        tm."FechaCarga" DESC,
        c."Nombre",
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

-- 2. Filtrar por ciudad específica (ID = 1)
-- SELECT * FROM get_reporte_consumos('2026-02-01', '2026-02-28', 1, NULL);

-- 3. Filtrar por tanque específico (ID = 5)
-- SELECT * FROM get_reporte_consumos('2026-02-01', '2026-02-28', NULL, 5);

-- 4. Filtrar por ciudad Y tanque
-- SELECT * FROM get_reporte_consumos('2026-02-01', '2026-02-28', 1, 5);

-- =====================================================
-- Notas de implementación
-- =====================================================
-- 1. Verificar que los nombres de las tablas coincidan con el schema:
--    - "TanqueMovimiento" ✓ (confirmado)
--    - "Tanque" ✓ (confirmado)
--    - "Planta" ✓ (confirmado)
--    - "Ciudad" ✓ (confirmado - singular, no plural)
--
-- 2. Confirmar los valores de TipoMovimiento:
--    - 'E' = Entradas
--    - 'S' = Salidas
--
-- 3. Verificar las relaciones entre tablas:
--    - TanqueMovimiento.IdTanque -> Tanque.IDTanque ✓
--    - Tanque.IDPlanta -> Planta.IDPlanta ✓
--    - Planta.IdCiudad -> Ciudad.IDCiudad ✓
--
-- 4. Para usar desde el frontend (Supabase JS):
--    const { data, error } = await supabase
--      .rpc('get_reporte_consumos', {
--        p_fecha_inicio: '2026-02-01',
--        p_fecha_fin: '2026-02-28',
--        p_id_ciudad: null,
--        p_id_tanque: null
--      });
--
-- 5. Considerar agregar índices para mejorar el rendimiento:
--    CREATE INDEX IF NOT EXISTS idx_tanque_movimiento_fecha 
--      ON public."TanqueMovimiento"("FechaCarga");
--    CREATE INDEX IF NOT EXISTS idx_tanque_movimiento_tipo 
--      ON public."TanqueMovimiento"("TipoMovimiento");
