# ReporteConsumos

## Propósito
Componente de reporte de consumos de combustible que muestra entradas y salidas diarias por tanque. Permite filtrar por ciudad, tanque y rango de fechas, visualizar detalles de movimientos y exportar resultados a CSV.

## Firma del Componente
```typescript
function ReporteConsumos(): JSX.Element
```

## TypeScript Types

### ReporteConsumosData
```typescript
interface ReporteConsumosData {
    fecha: string;           // Formato: YYYY-MM-DD
    ciudad: string;          // CveCiudad (ej: "MTY", "GDL")
    tanque: string;
    idTanque: number;
    totalEntradas: number;   // Litros
    totalSalidas: number;    // Litros
}
```

### ReporteConsumosForm
```typescript
interface ReporteConsumosForm {
    CveCiudad: string;
    IDTanque: string;
    FechaInicial: string;
    FechaFinal: string;
}
```

## Props
Este componente no recibe props. Maneja su propio estado interno.

## Dependencias
- `react` (`useState`, `useEffect`)
- `react-bootstrap` (`Container`, `Card`, `Form`, `Button`, `Row`, `Col`, `Alert`, `Table`, `Spinner`)
- `react-hook-form` (`useForm`)
- `supabase` client (`supabase`)
- `ComboCveCiudad` - Selector de ciudad
- `ComboTanquePorCiudad` - Selector de tanque filtrado por ciudad
- `ReporteConsumosDetalleModal` - Modal para ver detalles de movimientos

## Estado Interno
- `isLoading: boolean` - Indicador de carga durante la consulta
- `alertMessage: { type: 'success' | 'danger', text: string } | null` - Mensaje de alerta
- `consumos: ReporteConsumosData[]` - Datos del reporte
- `cveCiudadSeleccionada: string` - Ciudad seleccionada (para filtrar tanques)
- `showDetalle: boolean` - Estado del modal de detalle
- `filaSeleccionada: { fecha, ciudad, tanque, idTanque } | null` - Datos de la fila seleccionada

## React Hooks
- `useForm<ReporteConsumosForm>()` - Manejo de formulario con validaciones
- `useState<boolean>(false)` - Estado de carga
- `useState<AlertMessage | null>(null)` - Mensajes de alerta
- `useState<ReporteConsumosData[]>([])` - Resultados del reporte
- `useState<string>("")` - Ciudad seleccionada
- `useState<boolean>(false)` - Estado del modal
- `useState<FilaSeleccionada | null>(null)` - Fila seleccionada para detalle
- `useEffect(() => {...}, [cveCiudad])` - Actualiza ciudad cuando cambia el formulario

## Funciones Internas

### formatearFecha
```typescript
function formatearFecha(fecha: string): string
```
Convierte fecha ISO (YYYY-MM-DD) a formato local (dd/MM/yyyy).

### formatearNumero
```typescript
function formatearNumero(numero: number): string
```
Formatea números con separadores de miles y 2 decimales.

### abrirDetalle
```typescript
function abrirDetalle(consumo: ReporteConsumosData): void
```
Abre el modal de detalle con los datos de la fila seleccionada. Pasa la fecha en formato ISO para evitar errores de parsing en Supabase.

### onSubmit
```typescript
async function onSubmit(data: ReporteConsumosForm): Promise<void>
```
Consulta el reporte de consumos usando `supabase.rpc('get_reporte_consumos')`. Maneja estados de carga, errores y respuestas vacías.

### exportarCSV
```typescript
function exportarCSV(): void
```
Exporta los datos del reporte a un archivo CSV con codificación UTF-8 (BOM).

## Integración de Datos

### Función de Supabase: `get_reporte_consumos`
**Parámetros**:
- `p_fecha_inicio` (DATE): Fecha inicial del rango
- `p_fecha_fin` (DATE): Fecha final del rango
- `p_cve_ciudad` (VARCHAR, opcional): Clave de ciudad para filtrar
- `p_id_tanque` (BIGINT, opcional): ID del tanque para filtrar

**Retorna**: Array de `ReporteConsumosData`

### Validaciones del Formulario
- `CveCiudad`: No requerido (permite consulta global)
- `IDTanque`: No requerido (se filtra por ciudad si se selecciona)
- `FechaInicial`: Requerido - "La fecha inicial es obligatoria"
- `FechaFinal`: Requerido - "La fecha final es obligatoria"

## Formato de Visualización

### Tabla de Resultados
| Columna | Descripción | Formato |
|---------|-------------|---------|
| Fecha | Fecha del movimiento | dd/MM/yyyy |
| Ciudad | Clave de ciudad | Texto |
| Tanque | Nombre del tanque | Texto |
| Total Entradas | Litros de entrada | #,###.## |
| Total Salidas | Litros de salida | #,###.## |
| Acciones | Botón "Detalle" | Button outline-primary |

### Exportación CSV
**Nombre del archivo**: `reporte_consumos_YYYY-MM-DD.csv`

**Columnas**: Fecha, Ciudad, Tanque, Total Entradas (L), Total Salidas (L)

## Comportamiento

### Flujo de Consulta
1. Usuario selecciona filtros (ciudad, tanque opcional, rango de fechas)
2. Presiona botón "Consultar"
3. Componente muestra spinner de carga
4. Llama a `get_reporte_consumos` con parámetros
5. Muestra resultados en tabla o mensaje si no hay datos
6. Habilita botón "Exportar CSV" si hay resultados

### Modal de Detalle
Al hacer clic en "Detalle":
1. Abre `ReporteConsumosDetalleModal`
2. Pasa `fecha` (ISO), `ciudad`, `tanque`, `idTanque`
3. Modal carga datos de entradas y salidas para esa fecha/tanque
4. Usuario puede ver detalles y exportar a CSV

### Estados de la UI
| Estado | Elemento | Condición |
|--------|----------|-----------|
| Botón "Consultar" | Deshabilitado | `isLoading === true` |
| Botón "Exportar CSV" | Deshabilitado | `consumos.length === 0` |
| Spinner | Visible | `isLoading === true` |
| Alert Success | Visible | `alertMessage?.type === 'success'` |
| Alert Danger | Visible | `alertMessage?.type === 'danger'` |
| Tabla de resultados | Visible | `consumos.length > 0` |

## Ejemplo de Uso

```tsx
import ReporteConsumos from './components/ReporteConsumos';

function App() {
  return (
    <div>
      <ReporteConsumos />
    </div>
  );
}
```

El componente es autónomo y no requiere props. Maneja toda la lógica internamente.

## Componentes Relacionados

### ReporteConsumosDetalleModal
Modal que muestra el detalle de movimientos (entradas y salidas) para una fecha y tanque específicos.

**Props recibidas**:
- `show: boolean` - Estado de visibilidad
- `onHide: () => void` - Callback para cerrar
- `datosFila: { fecha, ciudad, tanque, idTanque }` - Datos de la fila seleccionada

**Funciones de Supabase usadas**:
- `get_salidas_detalle` - Movimientos de salida
- `get_entradas_detalle` - Movimientos de entrada

## Estructura del Formulario

```
┌─ Filtros de Búsqueda ──────────────────┐
│ ┌─ Ciudad (opcional)                   │
│ └─ Tanque (filtrado por ciudad)        │
│ ┌─ Fecha Inicial (requerido)           │
│ └─ Fecha Final (requerido)             │
│ [Consultar] [Exportar CSV]             │
└────────────────────────────────────────┘
         ↓
┌─ Resultados ───────────────────────────┐
│ Tabla con entradas/salidas por día     │
│ Botón "Detalle" → Abre Modal           │
└────────────────────────────────────────┘
```

## Notas Técnicas

### Manejo de Fechas
- **Importante**: La fecha se pasa al modal en formato ISO (YYYY-MM-DD), no formateada
- Esto evita errores de parsing en PostgreSQL ("date/time field value out of range")
- Solo se formatea para display en la tabla

### RPC de Supabase
```typescript
const { data, error } = await supabase.rpc('get_reporte_consumos', {
    p_fecha_inicio: data.FechaInicial,
    p_fecha_fin: data.FechaFinal,
    p_cve_ciudad: data.CveCiudad || null,
    p_id_tanque: data.IDTanque ? parseInt(data.IDTanque) : null
});
```

### Exportación CSV
- Incluye BOM UTF-8 (`\uFEFF`) para compatibilidad con Excel
- Usa `toLocaleString('es-MX')` para formato de números
- Nombre de archivo incluye fecha actual

### Estados de Alerta
- **Success**: "Se encontraron X registros" o "No se encontraron consumos"
- **Danger**: Errores de conexión o errores del servidor
- Se limpia automáticamente al iniciar nueva consulta

## Contexto de Uso
Este componente se utiliza para:
- Monitorear consumos diarios de combustible
- Identificar patrones de entrada y salida
- Detectar discrepancias entre entregas y consumos
- Generar reportes para contabilidad y control
- Auditar movimientos por periodo
