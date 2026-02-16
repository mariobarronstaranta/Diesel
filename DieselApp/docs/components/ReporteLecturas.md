# ReporteLecturas

## Propósito
Consultar, visualizar y exportar lecturas diarias; además permite detallar, editar y desactivar registros de lecturas.

## Firma del Componente
```typescript
function ReporteLecturas(): JSX.Element
```

No recibe props - es un componente de página completo con funcionalidad CRUD completa.

## TypeScript Types

### ReporteLecturasForm
```typescript
interface ReporteLecturasForm {
  CveCiudad: string;
  FechaInicial: string;
  FechaFinal: string;
}
```

### LecturaDiaria
```typescript
interface LecturaDiaria {
  ciudad: string;
  nombre: string;
  fecha: string;
  lectura_inicial_cms: number;
  lectura_final_cms: number;
  cuenta_litros_inicial: number;
  cuenta_litros_final: number;
  diferencia_cuenta_litros: number;
}
```

### DetalleLectura
```typescript
interface DetalleLectura {
  IDTanqueLecturas: number;
  Tanque: string;
  Fecha: string;
  Hora: string;
  LecturaCms: number;
  Temperatura: number;
  CuentaLitros: number;
}
```

## Dependencias
- `react` (`useState`)
- `react-bootstrap` (`Container`, `Card`, `Form`, `Button`, `Row`, `Col`, `Alert`, `Table`, `Spinner`, `Modal`)
- `react-hook-form` (`useForm`)
- Componentes internos: `ComboCveCiudad`
- `supabase` client local

## Estado interno

### Consulta principal
- `isLoading: boolean` - Estado de consulta agregada
- `alertMessage: { type, text } | null` - Mensajes de resultado
- `lecturas: LecturaDiaria[]` - Datos agregados por tanque/fecha

### Modal detalle
- `showModal: boolean` - Visibilidad del modal
- `detalleLecturas: DetalleLectura[]` - Lecturas individuales del día
- `isModalLoading: boolean` - Carga de datos del modal
- `modalError: string | null` - Errores del modal
- `infoFilaSeleccionada: { fecha, tanque } | null` - Info para título del modal

### Edición inline
- `editingId: number | null` - ID del registro en edición
- `editForm: { Hora, LecturaCms, Temperatura, CuentaLitros }` - Formulario de edición

### Reconsulta
- `lastQueryParams: ReporteLecturasForm | null` - Últimos parámetros para recargar después de editar/eliminar

## React Hooks

### useState
Total de 10 estados (listados arriba en "Estado interno")

### useForm
```typescript
const { 
  register, 
  handleSubmit, 
  formState: { errors } 
} = useForm<ReporteLecturasForm>({
  mode: "onSubmit",
  reValidateMode: "onChange"
});
```

## Funciones Internas

### 1. formatearFecha
```typescript
function formatearFecha(fecha: string): string
```
Convierte fecha ISO a formato español (`DD/MM/YYYY`).

### 2. onSubmit  
```typescript
async function onSubmit(data: ReporteLecturasForm): Promise<void>
```
1. Llama RPC `sp_obtener_lecturas_diarias(p_ciudad, p_fecha_inicial, p_fecha_final)`
2. Ordena resultados por fecha y nombre de tanque
3. Actualiza estado `lecturas`
4. Guarda parámetros para reconsulta posterior
5. Muestra mensaje con cantidad de registros encontrados

### 3. handleVerDetalle
```typescript
async function handleVerDetalle(fecha: string, tanque: string): Promise<void>
```
1. Abre modal
2. Llama RPC `fn_obtener_lecturas_por_fecha(p_fecha, p_tanque)`
3. Carga detalle de todas las lecturas individuales del día
4. Muestra en tabla con opciones de editar/eliminar

### 4. handleDelete
```typescript
async function handleDelete(id: number, tanque: string): Promise<void>
```
**Eliminación lógica** (no física):
1. Confirma con usuario vía `window.confirm()`
2. Actualiza `TanqueLecturas.Activo = 0`
3. Cierra modal
4. Reconsulta datos agregados

### 5. handleEditStart
```typescript
function handleEditStart(item: DetalleLectura): void
```
Activa modo de edición inline:
1. Establece `editingId` al ID del registro
2. Carga valores actuales en `editForm`
3. Convierte fila a inputs editables

### 6. handleUpdate
```typescript
async function handleUpdate(id: number, tanque: string): Promise<void>
```
1. Valida que todos los campos estén llenos
2. Confirma con usuario
3. Actualiza registro en `TanqueLecturas`
4. Cierra modal y modo edición
5. Reconsulta datos agregados

### 7. exportarCSV
```typescript
function exportarCSV(): void
```
1. Convierte `lecturas` a formato CSV
2. Añade BOM UTF-8 (`\uFEFF`) para compatibilidad con Excel
3. Crea blob y descarga archivo
4. Nombre: `Lecturas_YYYY-MM-DD.csv`

## Integración de datos

### RPC: `sp_obtener_lecturas_diarias`
**Parámetros:**
- `p_ciudad: string`
- `p_fecha_inicial: string`
- `p_fecha_final: string`

**Retorna:** Array de `LecturaDiaria` con datos agregados (primera y última lectura del día).

### RPC: `fn_obtener_lecturas_por_fecha`
**Parámetros:**
- `p_fecha: string`
- `p_tanque: string`

**Retorna:** Array de `DetalleLectura` con todas las lecturas individuales.

### Tabla: `TanqueLecturas`
**Operaciones:**
- `UPDATE ... SET Activo = 0` - Eliminación lógica
- `UPDATE` por `IDTanqueLecturas` - Edición de campos

## Validaciones

| Campo | Validación |
|-------|------------|
| `CveCiudad` | Obligatorio |
| `FechaInicial` | Obligatoria |
| `FechaFinal` | Obligatoria, no puede ser menor que inicial |

## Estructura Visual

```
┌─────────────────────────────────────────────────┐
│ Reporte de Lecturas Diarias                     │
│                                                 │
│ [Alert si hay mensajes]                        │
│                                                 │
│ [Ciudad ▾] [Fecha Inicial] [Fecha Final] [Consultar]│
│                                                 │
│ ┌─ Resultados ────────── [Exportar CSV] ┐     │
│ │ ┌──────────────────────────────────┐  │     │
│ │ │ Tabla con encabezados multinivel │  │     │
│ │ │ - Ciudad, Tanque, Fecha          │  │     │
│ │ │ - Altura CMS (Inicial/Final)     │  │     │
│ │ │ - Cuenta Litros (Inicial/Final)  │  │     │
│ │ │ - Litros Consumidos              │  │     │
│ │ │ - [Detalle] por fila             │  │     │
│ │ └──────────────────────────────────┘  │     │
│ └───────────────────────────────────────┘     │
│                                                 │
│ Modal (cuando se abre Detalle):                │
│ ┌─────────────────────────────────────┐        │
│ │ Detalle de Movimientos - TANQUE X   │        │
│ │ ┌─────────────────────────────────┐ │        │
│ │ │ Movimiento | Tanque | Fecha     │ │        │
│ │ │ [Hora editable] | Lectura CMS   │ │        │
│ │ │ Temperatura | CuentaLitros      │ │        │
│ │ │ [Editar] [Eliminar]             │ │        │
│ │ └─────────────────────────────────┘ │        │
│ │           [Cerrar]                  │        │
│ └─────────────────────────────────────┘        │
└─────────────────────────────────────────────────┘
```

## Tabla multinivel (thead)

```html
<thead>
  <tr>
    <th rowSpan={2}>Ciudad</th>
    <th rowSpan={2}>Tanque</th>
    <th rowSpan={2}>Fecha Lectura</th>
    <th colSpan={2}>Altura (cms)</th>
    <th colSpan={2}>Cuenta Litros</th>
    <th rowSpan={2}>Lts Consumidos</th>
    <th rowSpan={2}>Acción</th>
  </tr>
  <tr>
    <th>Inicial</th>
    <th>Final</th>
    <th>Inicial</th>
    <th>Final</th>
  </tr>
</thead>
```

## Flujo de edición modal

```
Usuario hace clic en "Detalle"
  └─► handleVerDetalle()
       ├─► Abre modal
       ├─► Carga datos con RPC
       └─► Muestra tabla con opciones

Usuario hace clic en "Editar"
  └─► handleEditStart()
       └─► Transforma fila a inputs inline

Usuario edita y hace clic en "Ok"
  └─► handleUpdate()
       ├─► Valida campos
       ├─► Actualiza en BD
       ├─► Reconsulta datos agregados
       └─► Cierra modal
```

## Características avanzadas

### 1. CSV Export con BOM UTF-8
```typescript
const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
```
El prefijo `\uFEFF` (BOM) asegura que Excel interprete correctamente caracteres especiales españoles.

### 2. Edición inline en modal
Cada fila puede transformarse en inputs editables sin cambiar de vista.

### 3. Modal estilizado
```css
.modal-backdrop-blur {
  backdrop-filter: blur(5px);
}
.modal-custom-width {
  width: 1050px !important;
  max-width: 95% !important;
}
```

### 4. Ordenamiento automático
Los resultados se ordenan primero por fecha, luego por nombre de tanque para facilitar lectura.

### 5. Reconsulta automática
Después de editar o eliminar, se vuelve a ejecutar la consulta agregada para reflejar cambios.

## Ejemplo de uso
```tsx
import ReporteLecturas from './components/ReporteLecturas';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/reportes/lecturas" element={<ReporteLecturas />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## Notas técnicas
- Este es el componente más complejo de la aplicación (589 líneas)
- Combina consulta agregada (resumen diario) con detalle granular (lecturas individuales)
- La eliminación es lógica (`Activo = 0`), no física
- Usa RPCs (stored procedures) en lugar de consultas directas para lógica de negocio compleja
- El botón "Consultar" muestra spinner y texto "Consultando..." durante carga
- Los números en la tabla usan `.toLocaleString()` para formateo con separadores de miles
- El modal tiene ancho personalizado (1050px) para acomodar todas las columnas sin scroll horizontal
- La validación de `FechaFinal` usa función personalizada que compara con `FechaInicial`
