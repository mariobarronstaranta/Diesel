# 📊 Reporte de Consumos

**Estado:** 🔴 Pendiente  
**Prioridad:** Alta  
**Fecha de creación:** 2026-02-16  
**Ubicación en la app:** Reportes >> Consumos

---

## 📋 Descripción General

Implementar un reporte de consumos de combustible que permita visualizar las entradas y salidas de los tanques de diesel, agrupadas por fecha, ciudad y tanque. El reporte debe incluir filtros dinámicos y exportación a CSV.

---

## 🎯 Objetivos

- Proporcionar visibilidad sobre el consumo diario de combustible
- Permitir análisis por ciudad y tanque específico
- Facilitar la exportación de datos para análisis externo
- Preparar la base para un futuro detalle de movimientos (modal)

---

## 🔧 Funcionalidades Requeridas

### 1. **Filtros de Búsqueda**

| Filtro | Tipo | Requerido | Descripción |
|--------|------|-----------|-------------|
| **Ciudad** | Dropdown | No | Filtrar por ciudad específica (usa `ComboCiudad`) |
| **Tanque** | Dropdown | No | Filtrar por tanque específico (usa `ComboTanquePorCiudad`) |
| **Fecha Inicial** | Date | Sí | Fecha de inicio del rango a consultar |
| **Fecha Final** | Date | Sí | Fecha de fin del rango a consultar |

**Comportamiento:**
- Los filtros de Ciudad y Tanque son opcionales (si no se seleccionan, mostrar todos)
- El filtro de Tanque debe actualizarse dinámicamente según la ciudad seleccionada
- Las fechas son obligatorias para evitar consultas muy grandes

### 2. **Tabla de Resultados**

| Columna | Tipo | Descripción |
|---------|------|-------------|
| **Fecha** | Date | Día del reporte (formato: DD/MM/YYYY) |
| **Ciudad** | String | Nombre de la ciudad |
| **Tanque** | String | Nombre del tanque |
| **Total Entradas** | Number | Suma de litros con `TipoMovimiento = 'E'` |
| **Total Salidas** | Number | Suma de litros con `TipoMovimiento = 'S'` |
| **Detalle** | Link | Link que abrirá modal con detalle de movimientos (Fase 2) |

**Características:**
- Ordenar por fecha descendente (más reciente primero)
- Formato de números con separadores de miles
- Totales al final de la tabla (suma de todas las entradas y salidas)

### 3. **Exportación CSV**

- Botón "Exportar CSV" similar al de `ReporteLecturas`
- Incluir todas las columnas excepto "Detalle"
- Nombre del archivo: `consumos_YYYYMMDD.csv`
- Incluir fila de totales al final

---

## 🏗️ Checklist de Implementación

### Frontend

- [ ] Crear interfaz TypeScript `ReporteConsumosData` en `src/types/reportes.types.ts`
- [ ] Crear componente `ReporteConsumos.tsx` en `src/components/`
- [ ] Implementar filtros con validación de fechas
- [ ] Implementar tabla de resultados con formato de números
- [ ] Implementar función de exportación CSV
- [ ] Agregar ruta `/reportes/consumos` en `App.tsx`
- [ ] Actualizar menú de navegación en `TopNav.tsx` (cambiar href por NavLink)
- [ ] Aplicar estilos consistentes con `ReporteLecturas`

### Backend

- [ ] Crear función de Supabase `get_reporte_consumos` en `docs/scripts/`
- [ ] Verificar valores correctos de `TipoMovimiento` ('E' y 'S')
- [ ] Confirmar relaciones entre tablas (TanqueMovimiento, Tanques, Plantas, Ciudades)
- [ ] Implementar endpoint en Supabase Edge Functions (si aplica)
- [ ] Probar query con datos reales

### Testing

- [ ] Probar filtros individuales y combinados
- [ ] Verificar cálculos de totales
- [ ] Probar exportación CSV
- [ ] Validar formato de fechas
- [ ] Probar con diferentes rangos de fechas

---

## 💻 Interfaces TypeScript

```typescript
// Agregar a src/types/reportes.types.ts

export interface ReporteConsumosData {
  fecha: string;           // Formato: YYYY-MM-DD
  ciudad: string;          // CveCiudad (ej: "MTY", "GDL")
  tanque: string;
  idTanque: number;
  totalEntradas: number;   // Litros
  totalSalidas: number;    // Litros
}

export interface ReporteConsumosFiltros {
  cveCiudad?: string | null;  // Clave de ciudad como texto (ej: "MTY")
  idTanque?: number | null;
  fechaInicio: string;        // Formato: YYYY-MM-DD
  fechaFin: string;           // Formato: YYYY-MM-DD
}
```

---

## 🗄️ Query SQL Base

```sql
-- Query para el endpoint /api/reportes/consumos
-- Basado en la tabla TanqueMovimiento (PostgreSQL)
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
    tm."FechaCarga" BETWEEN :fechaInicio AND :fechaFin
    -- Filtros opcionales
    AND (:cveCiudad IS NULL OR tm."CveCiudad" = :cveCiudad)
    AND (:idTanque IS NULL OR tm."IdTanque" = :idTanque)
GROUP BY 
    tm."FechaCarga",
    tm."CveCiudad",
    t."Nombre",
    tm."IdTanque"
ORDER BY 
    tm."FechaCarga" DESC,
    tm."CveCiudad",
    t."Nombre";
```

### ⚠️ Notas Importantes

1. **Validar valores de `TipoMovimiento`**: Confirmar con el equipo de backend que 'E' = Entradas y 'S' = Salidas
2. **Estructura simplificada** ✅ CORREGIDO:
   - ✓ Solo se usan 2 tablas: `"TanqueMovimiento"` y `"Tanque"`
   - ✓ Relación directa mediante `CveCiudad` (campo de texto, ej: "MTY", "GDL")
   - ✓ No se requieren las tablas `Planta` ni `Ciudad`
   - ✓ El filtro de ciudad usa `cveCiudad` (string) en lugar de `idCiudad` (number)
3. **Parámetros**: Los parámetros vienen del query string de la petición HTTP
4. **Formato de respuesta**: Debe ser JSON array con la estructura de `ReporteConsumosData[]`

> **Nota de corrección (2026-02-16):** Se simplificó el query para usar la relación directa `TanqueMovimiento.CveCiudad = Tanque.CveCiudad`, eliminando joins innecesarios a las tablas `Planta` y `Ciudad`. El parámetro de filtro cambió de `idCiudad` (number) a `cveCiudad` (string) para alinearse con el componente `ComboTanquePorCiudad.tsx`.

---
