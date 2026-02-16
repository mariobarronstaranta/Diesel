# EntradasDiesel

## Propósito
Capturar movimientos de entrada de diésel en tabla `TanqueMovimiento` con `TipoMovimiento = "E"`.

## Firma del Componente
```typescript
function EntradasDiesel(): JSX.Element
```

No recibe props - es un componente de página completo.

## TypeScript Types

### EntradasForm
```typescript
interface EntradasForm {
  CveCiudad: string;
  IDTanque: string;
  Fecha: string;
  Hora: string;
  Temperatura: string;
  LitrosCarga: string;
  Altura: string;           // "Altura del Tanque"
  CuentaLitros: string;     // "Cuenta Litros Actual"
  IdProveedor: string;      // Nota: Id con mayúscula
  Remision: string;
  Observaciones: string;
}
```

## Dependencias
- `react` (`useState`, `useEffect`)
- `react-bootstrap` (`Container`, `Card`, `Form`, `Button`, `Row`, `Col`, `Alert`, `Spinner`)
- `react-hook-form` (`useForm`)
- Componentes internos: `ComboCveCiudad`, `ComboTanquePorCiudad`, `ComboProveedores`
- `supabase` client local

## Estado interno
- `loading: boolean` - Estado de envío (guardando en BD)
- `message: { type, text } | null` - Alert de resultado

## React Hooks

### useState
- `useState<boolean>(false)` - `loading`
- `useState<{type: 'success' | 'danger', text: string} | null>(null)` - `message`

### useForm
```typescript
const { 
  register, 
  handleSubmit, 
  watch, 
  formState: { errors }, 
  setValue, 
  reset 
} = useForm<EntradasForm>();
```

### useEffect
1. **Inicialización** - `useEffect(() => setDefaults(), [setValue])`
2. **Cascada ciudad → tanque** - `useEffect(() => setValue("IDTanque", ""), [cveCiudad, setValue])`

### watch
- `watch("CveCiudad")` - Detecta cambios de ciudad para cascada

## Funciones Internas

### setDefaults
```typescript
function setDefaults(): void
```
Establece:
- `Fecha` = Fecha actual (`YYYY-MM-DD`)
- `Hora` = Hora actual (`HH:MM`)

### handleClean
```typescript
function handleClean(): void
```
Resetea formulario y restablece fecha/hora actual.

### onSubmit
```typescript
async function onSubmit(data: EntradasForm): Promise<void>
```
1. Activa estado de carga
2. Construye timestamp local manual (`YYYY-MM-DD HH:MM:SS`)
3. Convierte strings numéricos a `Number()`
4. Inserta en tabla `TanqueMovimiento`
5. Maneja éxito/error con mensajes
6. Limpia formulario si es exitoso

## Reglas y validaciones

| Campo | Tipo | Validación |
|-------|------|------------|
| `CveCiudad` | select | Obligatorio |
| `IDTanque` | select | Obligatorio |
| `Fecha` | date | Obligatoria |
| `Hora` | time | Obligatoria |
| `Temperatura` | number | Obligatoria, step any |
| `LitrosCarga` | number | Obligatoria |
| `Altura` | number | Obligatoria |
| `CuentaLitros` | number | Obligatoria |
| `IdProveedor` | select | Obligatorio |
| `Remision` | text | Obligatoria |
| `Observaciones` | textarea | Opcional |

## Lógica de cascada

```
Ciudad (CveCiudad)
  └─► Tanque (IDTanque) ← Se limpia cuando cambia ciudad
```

**Nota:** A diferencia de `CapturaLecturas`, este componente NO usa el nivel intermedio de Planta, sino que va directamente de Ciudad a Tanque.

## Integración de datos

### Tabla: `TanqueMovimiento`

Campos insertados:
```typescript
{
  CveCiudad: string,
  IdTanque: number,              // Convertido de string
  FechaCarga: string,            // YYYY-MM-DD
  HoraCarga: string,             // HH:MM
  TemperaturaCarga: number,
  LitrosCarga: number,
  AlturaTanque: number,          // Campo Altura
  CuentaLitros: number,
  Remision: string,
  IdProveedor: number,
  Observaciones: string,
  TipoMovimiento: "E",           // "E" = Entrada
  FechaHoraMovimiento: string    // Timestamp local construido manualmente
}
```

## Estructura Visual

```
┌──────────────────────────────────────────┐
│ Registro de Entradas de Diesel           │
│                                          │
│ [Alert de éxito/error si existe]        │
│                                          │
│ ┌─── DATOS DEL TANQUE ─────┐            │
│ │ Ciudad          | Tanque  │            │
│ │ Fecha | Hora | Temperatura │           │
│ └──────────────────────────┘            │
│                                          │
│ ┌─── DATOS DE CARGA ────────┐           │
│ │ Litros | Altura | Cuenta Litros │     │
│ │ Proveedor | Remisión      │          │
│ │ Observaciones (textarea)   │          │
│ └───────────────────────────┘           │
│                                          │
│          [Limpiar] [Guardar]            │
└──────────────────────────────────────────┘
```

## Diferencias con CapturaLecturas

| Aspecto | CapturaLecturas | EntradasDiesel |
|---------|-----------------|----------------|
| Tabla destino | `TanqueLecturas` | `TanqueMovimiento` |
| Tipo de movimiento | N/A | `TipoMovimiento = "E"` |
| Combos de tanque | Ciudad → Planta → Tanque | Ciudad → Tanque (directo) |
| Fields específicos | N/A | Proveedor, Remisión |
| Identificador ciudad | `IDCiudad` (number) | `CveCiudad` (string) |

## UX Características
- Estructura por tarjetas: datos del tanque + datos de carga
- Botón limpiar restablece valores y defaults
- Indicador visual de envío en botón guardar (spinner)
- Mensajes dismissibles con Bootstrap Alert
- Validaciones en tiempo real después del primer submit

## Ejemplo de uso
```tsx
import EntradasDiesel from './components/EntradasDiesel';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/entradas" element={<EntradasDiesel />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## Notas técnicas
- Usa `ComboCveCiudad` (clave string) en lugar de `ComboCiudad` (ID numérico)
- El timestamp `FechaHoraMovimiento` se construye manualmente concatenando fecha y hora actuales
- Los campos específicos de **salidas** (`IdUnidad`, `IdPersonal`, `FolioVale`, `Horimetro`, `Odometro`) se omiten (serían `null` implícitamente)
- El botón guardar muestra un Spinner durante el proceso de guardado
- Campo `Observaciones` es opcional (no tiene validación `required`)
- `valueAsNumber: false` en Temperatura permite manejar conversión manual en submit
