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
  ciudad: string;
  tanque: string;
  idTanque: number;
  totalEntradas: number;   // Litros
  totalSalidas: number;    // Litros
}

export interface ReporteConsumosFiltros {
  idCiudad?: number | null;
  idTanque?: number | null;
  fechaInicio: string;     // Formato: YYYY-MM-DD
  fechaFin: string;        // Formato: YYYY-MM-DD
}
```

---

## 🗄️ Query SQL Base

```sql
-- Query para el endpoint /api/reportes/consumos
-- Basado en la tabla TanqueMovimiento (PostgreSQL)
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
    INNER JOIN public."Tanques" t ON tm."IdTanque" = t."IdTanque"
    INNER JOIN public."Plantas" p ON t."IdPlanta" = p."IdPlanta"
    INNER JOIN public."Ciudades" c ON p."IdCiudad" = c."IdCiudad"
WHERE 
    tm."FechaCarga" BETWEEN :fechaInicio AND :fechaFin
    -- Filtros opcionales
    AND (:idCiudad IS NULL OR c."IdCiudad" = :idCiudad)
    AND (:idTanque IS NULL OR tm."IdTanque" = :idTanque)
GROUP BY 
    tm."FechaCarga",
    c."Nombre",
    t."Nombre",
    tm."IdTanque"
ORDER BY 
    tm."FechaCarga" DESC,
    c."Nombre",
    t."Nombre";
```

### ⚠️ Notas Importantes

1. **Validar valores de `TipoMovimiento`**: Confirmar con el equipo de backend que 'E' = Entradas y 'S' = Salidas
2. **Nombres de tablas**: Verificar si es `"Tanques"` o `"Tanque"` (hay inconsistencia en el schema)
3. **Parámetros**: Los parámetros vienen del query string de la petición HTTP
4. **Formato de respuesta**: Debe ser JSON array con la estructura de `ReporteConsumosData[]`

---

## 📊 Schema de Base de Datos

### Tabla: TanqueMovimiento

```sql
create table public."TanqueMovimiento" (
  "IdTanqueMovimiento" bigint generated by default as identity not null,
  "CveCiudad" character varying not null,
  "IdTanque" bigint not null,
  "FechaCarga" date not null,
  "HoraCarga" time without time zone not null,
  "TemperaturaCarga" bigint not null,
  "LitrosCarga" bigint not null,
  "AlturaTanque" bigint null,
  "CuentaLitros" bigint null,
  "Remision" character varying null,
  "IdProveedor" bigint null,
  "Observaciones" character varying null,
  "TipoMovimiento" character varying null,  -- 'E' = Entrada, 'S' = Salida
  "FechaHoraMovimiento" timestamp without time zone null,
  "IdUnidad" bigint null,
  "IdPersonal" bigint null,
  "FolioVale" character varying null,
  "Horimetro" bigint null,
  "Odometro" bigint null,
  constraint TanqueMovimiento_pkey primary key ("IdTanqueMovimiento")
) TABLESPACE pg_default;
```

### Tabla: Tanque

```sql
create table public."Tanque" (
  "IDTanque" integer not null,
  "Nombre" text not null,
  "CveCiudad" text not null,
  "IDPlanta" integer not null,
  "Capacidad" bigint null,
  "IDTipoCombustible" integer null,
  "TipoCombustible" text null,
  "Forma" text null,
  "DiametroA" bigint null,
  "Largo" bigint null,
  idciudad character varying null,
  constraint Tanque_pkey primary key ("IDTanque"),
  constraint Tanque_IDTanque_key unique ("IDTanque"),
  constraint Tanque_IDPlanta_fkey foreign KEY ("IDPlanta") references "Planta" ("IDPlanta")
) TABLESPACE pg_default;
```

---

## 🚀 Fases de Desarrollo

### **Fase 1: Reporte Básico** (Esta fase)
- ✅ Filtros de búsqueda
- ✅ Tabla de resultados
- ✅ Exportación CSV
- ✅ Integración en menú de navegación

### **Fase 2: Detalle de Movimientos** (Futuro)
- Modal con detalle de movimientos por día/tanque
- Mostrar cada transacción individual
- Información adicional: hora, remisión, proveedor, etc.

---

## 📝 Componentes Relacionados

- `ComboCiudad.tsx` - Para filtro de ciudad
- `ComboTanquePorCiudad.tsx` - Para filtro de tanque
- `ReporteLecturas.tsx` - Referencia para estructura y exportación CSV
- `TopNav.tsx` - Actualizar menú de navegación

---

## 🔗 Referencias

- [Documentación ReporteLecturas](../components/ReporteLecturas.md)
- [Función Supabase](../scripts/get_reporte_consumos.sql) (pendiente de crear)
- [Tipos TypeScript](../../src/types/reportes.types.ts)

---

**Última actualización:** 2026-02-16