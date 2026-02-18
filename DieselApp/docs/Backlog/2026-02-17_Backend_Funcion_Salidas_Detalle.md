# Bitácora: Creación de Función Backend para Detalle de Salidas

## Objetivo
Implementar la función de Supabase `get_salidas_detalle` para obtener datos reales de movimientos de salida de combustible en el modal de detalle del Reporte de Consumos.

## Cambios Realizados

### [NEW] [get_salidas_detalle.sql](file:///c:/Users/85233588/Documents/Diesel/DieselApp/docs/scripts/get_salidas_detalle.sql)

**Función SQL creada con las siguientes características:**

- **Nombre**: `get_salidas_detalle`
- **Parámetros de entrada**:
  - `p_fecha` (DATE): Fecha de consulta
  - `p_ciudad` (VARCHAR): Clave de ciudad
  - `p_id_tanque` (BIGINT): ID del tanque

- **Columnas retornadas** (en orden):
  1. `tanque` - Nombre del tanque
  2. `fecha` - Fecha de carga (FechaCarga)
  3. `hora` - Hora de carga (HoraCarga)
  4. `temperatura` - Temperatura de carga (TemperaturaCarga)
  5. `unidad` - Formato: "IDClaveUnidad (ClaveAlterna)"
  6. `litros` - Litros cargados (LitrosCarga)
  7. `cuenta_litros` - Cuenta litros (CuentaLitros)
  8. `horometro` - Horómetro (Horimetro)
  9. `odometro` - Odómetro (Odometro)

- **Filtros aplicados**:
  - `TipoMovimiento = 'S'` (solo salidas)
  - `FechaCarga = p_fecha`
  - `CveCiudad = p_ciudad`
  - `IdTanque = p_id_tanque`

- **Ordenamiento**: Por HoraCarga ascendente

- **Joins realizados**:
  - INNER JOIN con `Tanque` para obtener el nombre
  - LEFT JOIN con `Unidades` para obtener información de la unidad (opcional si no hay unidad asignada)

---

## INTEGRACIÓN FRONTEND (2026-02-17)

### [MODIFY] [ReporteConsumosDetalleModal.tsx](file:///c:/Users/85233588/Documents/Diesel/DieselApp/src/components/ReporteConsumosDetalleModal.tsx)

**Cambios implementados:**

1. **Imports agregados**:
   - `useState`, `useEffect` de React
   - `Spinner`, `Alert` de react-bootstrap
   - `supabase` client

2. **Estados del componente**:
   - `salidas`: Array de datos de salidas (SalidaDetalle[])
   - `loading`: Estado de carga booleano
   - `error`: Mensaje de error (string | null)

3. **Interfaz TypeScript `SalidaDetalle`**:
   ```typescript
   interface SalidaDetalle {
       tanque: string;
       fecha: string;
       hora: string;
       temperatura: number;
       unidad: string;
       litros: number;
       cuenta_litros: number; // snake_case desde el backend
       horometro: number;
       odometro: number;
   }
   ```

4. **Función `cargarSalidas()`**:
   - Llamada a `supabase.rpc('get_salidas_detalle', { ... })`
   - Manejo de errores con try-catch
   - Actualización de estados de loading y error

5. **Hook `useEffect`**:
   - Se ejecuta cuando `show` o `datosFila` cambian
   - Llama a `cargarSalidas()` automáticamente

6. **UI mejorada**:
   - Spinner de carga mientras se obtienen datos
   - Alert de error si falla la petición
   - Alert informativo cuando no hay datos
   - Botón "Exportar CSV" deshabilitado si no hay datos

7. **Función `exportarSalidasCSV()`**:
   - Actualizada para usar el array `salidas` en lugar de mock data
   - Campo `cuenta_litros` (snake_case) correctamente referenciado

### [MODIFY] [ReporteConsumos.tsx](file:///c:/Users/85233588/Documents/Diesel/DieselApp/src/components/ReporteConsumos.tsx)

**Cambios implementados:**

1. **Actualización de `filaSeleccionada` state**:
   ```typescript
   const [filaSeleccionada, setFilaSeleccionada] = useState<{
       fecha: string;
       ciudad: string;
       tanque: string;
       idTanque: number; // ← Nuevo campo agregado
   } | null>(null);
   ```

2. **Función `abrirDetalle()` actualizada**:
   ```typescript
   const abrirDetalle = (consumo: ReporteConsumosData) => {
       setFilaSeleccionada({
           fecha: formatearFecha(consumo.fecha),
           ciudad: consumo.ciudad,
           tanque: consumo.tanque,
           idTanque: consumo.idTanque // ← Pasando el ID del tanque al modal
       });
       setShowDetalle(true);
   };
   ```

---

## Flujo de Datos Completo

```
Usuario hace clic en "Detalle"
    ↓
ReporteConsumos.abrirDetalle(consumo)
    ↓
filaSeleccionada = { fecha, ciudad, tanque, idTanque }
    ↓
ReporteConsumosDetalleModal recibe datosFila
    ↓
useEffect detecta el cambio → cargarSalidas()
    ↓
supabase.rpc('get_salidas_detalle', { p_fecha, p_ciudad, p_id_tanque })
    ↓
Estado `salidas` se actualiza con datos reales
    ↓
Tabla renderiza datos desde Supabase
```

---

## Estado de Implementación

- ✓ Script SQL creado y probado en Supabase
- ✓ Frontend integrado con estados de carga y error
- ✓ Datos reales reemplazan mock data
- ✓ Exportación CSV funcional con datos reales
- ⏳ Pendiente: Pruebas end-to-end con usuarios

## Notas Técnicas

- Se utiliza LEFT JOIN para Unidades porque puede haber movimientos sin unidad asignada
- La función retorna una tabla directamente, optimizada para su uso con `supabase.rpc()`
- Los nombres de columna retornados están en snake_case para facilitar el manejo en JavaScript
- El componente React maneja elegantemente los estados: loading, error, sin datos, y datos exitosos

---

## FUNCIÓN: GET_ENTRADAS_DETALLE

### [NEW] [get_entradas_detalle.sql](file:///c:/Users/85233588/Documents/Diesel/DieselApp/docs/scripts/get_entradas_detalle.sql)

**Función SQL creada con las siguientes características:**

- **Nombre**: `get_entradas_detalle`
- **Parámetros de entrada**:
  - `p_fecha` (DATE): Fecha de consulta
  - `p_ciudad` (VARCHAR): Clave de ciudad
  - `p_id_tanque` (BIGINT): ID del tanque

- **Columnas retornadas** (en orden):
  1. `fecha` - Fecha de carga (FechaCarga)
  2. `hora` - Hora de carga (HoraCarga)
  3. `temperatura` - Temperatura de carga (TemperaturaCarga)
  4. `litros` - Litros cargados (LitrosCarga)
  5. `planta` - Nombre de la planta
  6. `tanque` - Nombre del tanque
  7. `cuenta_litros` - Cuenta litros (CuentaLitros)

- **Filtros aplicados**:
  - `TipoMovimiento = 'E'` (solo entradas)
  - `FechaCarga = p_fecha`
  - `CveCiudad = p_ciudad`
  - `IdTanque = p_id_tanque`

- **Ordenamiento**: Por HoraCarga ascendente

- **Joins realizados**:
  - INNER JOIN con `Tanque` para obtener el nombre del tanque
  - INNER JOIN con `Planta` para obtener el nombre de la planta

### Esquemas de Base de Datos (Entradas)

#### Tabla: `TanqueMovimiento`
```sql
table public."TanqueMovimiento" (
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
  "TipoMovimiento" character varying null,
  "FechaHoraMovimiento" timestamp without time zone null,
  "IdUnidad" bigint null,
  "IdPersonal" bigint null,
  "FolioVale" character varying null,
  "Horimetro" bigint null,
  "Odometro" bigint null,
  constraint TanqueMovimiento_pkey primary key ("IdTanqueMovimiento")
) TABLESPACE pg_default;
```

#### Tabla: `Tanque`
```sql
table public."Tanque" (
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

#### Tabla: `Planta`
```sql
create table public."Planta" (
  "IDPlanta" bigint not null,
  "Nombre" text null,
  "CveCiudad" text null,
  "IDCiudad" bigint null,
  constraint Planta_pkey primary key ("IDPlanta"),
  constraint Planta_IDCiudad_fkey foreign KEY ("IDCiudad") references "Ciudad" ("IDCiudad")
) TABLESPACE pg_default;
```

### Relaciones Entre Tablas (Entradas)

- `TanqueMovimiento.IdTanque = Tanque.IDTanque` (INNER JOIN)
- `Tanque.IDPlanta = Planta.IDPlanta` (INNER JOIN)

### Estado de Implementación (Entradas)

- ✓ Script SQL creado
- ⏳ Pendiente: Pruebas en Supabase
- ⏳ Pendiente: Integración frontend
- ⏳ Pendiente: Reemplazar mock data en pestaña "Entradas"

