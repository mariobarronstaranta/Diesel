# CapturaLecturas

## Propósito
Formulario principal para registrar lecturas diarias de tanques (`TanqueLecturas`).

## Firma del Componente
```typescript
function CapturaLecturas(): JSX.Element
```

No recibe props - es un componente de página completo.

## TypeScript Types

### CapturaLecturasForm
```typescript
interface CapturaLecturasForm {
  IDCiudad: string;
  IDPlanta: string;
  IDTanque: string;
  Fecha: string;
  Hora: string;
  Temperatura: string;  // String porque inputs devuelven strings
  AlturaCms: string;
  CuentaLitros: string;
}
```

### AlertMessage
```typescript
{
  type: "success" | "danger";
  text: string;
} | null
```

## Dependencias
- `react` (`useEffect`, `useState`)
- `react-bootstrap` (`Container`, `Card`, `Form`, `Button`, `Row`, `Col`, `Alert`)
- `react-hook-form` (`useForm`)
- Componentes internos: `ComboCiudad`, `ComboPlanta`, `ComboTanque`
- `supabase` client local

## Estado interno
- `isLoading: boolean` - Estado de envío (cuando se está guardando en BD)
- `alertMessage: { type, text } | null` - Mensaje global de éxito/error

## React Hooks

### useState
- `useState<boolean>(false)` - `isLoading`
- `useState<AlertMessage>(null)` - `alertMessage`

### useForm
```typescript
const {
  register,
  handleSubmit,
  watch,
  setValue,
  reset,
  formState: { errors }
} = useForm<CapturaLecturasForm>({
  mode: "onSubmit",
  reValidateMode: "onChange"
});
```

### useEffect
1. **Inicialización de fecha/hora** - `useEffect(() => setDefaults(), [setValue, todayStr])`
2. **Cascada ciudad → planta/tanque** - `useEffect(() => { setValue("IDPlanta", ""); setValue("IDTanque", ""); }, [idCiudadSeleccionada])`
3. **Cascada planta → tanque** - `useEffect(() => setValue("IDTanque", ""), [idPlantaSeleccionada])`

### watch
- `watch("IDCiudad")` - Detecta cambios en ciudad para cascada
- `watch("IDPlanta")` - Detecta cambios en planta para cascada

## Funciones Internas

### toDateInput
```typescript
function toDateInput(d: Date): string
```
Convierte objeto `Date` a formato `YYYY-MM-DD` para inputs de tipo date.

### setDefaults
```typescript
function setDefaults(): void
```
Establece valores por defecto:
- `Fecha` = Fecha actual
- `Hora` = Hora actual (formato `HH:MM`)

### onSubmit
```typescript
async function onSubmit(data: CapturaLecturasForm): Promise<void>
```
1. Activa estado de carga
2. Formatea hora a `HH:MM:SS`
3. Convierte strings a numbers para campos numéricos
4. Inserta registro en tabla `TanqueLecturas`
5. Muestra mensaje de éxito/error
6. Limpia formulario si es exitoso

### handleClean
```typescript
function handleClean(): void
```
Resetea el formulario a valores por defecto y establece nueva fecha/hora actual.

## Reglas y validaciones

| Campo | Tipo | Validación |
|-------|------|------------|
| `IDCiudad` | select | Obligatorio |
| `IDPlanta` | select | Obligatorio |
| `IDTanque` | select | Obligatorio |
| `Fecha` | date | Obligatoria, entre hoy y 2 días atrás |
| `Hora` | time | Obligatoria |
| `Temperatura` | number | Obligatoria, step 0.1 |
| `AlturaCms` | number | Obligatoria, > 0 |
| `CuentaLitros` | number | Obligatoria, ≥ 0 |

## Lógica de dependencias entre combos

```
Ciudad (IDCiudad)
  ├─► Planta (IDPlanta) ← Se limpia cuando cambia ciudad
  │    └─► Tanque (IDTanque) ← Se limpia cuando cambia ciudad O planta
```

Cuando el usuario cambia la ciudad:
1. `IDPlanta` se resetea a `""`
2. `IDTanque` se resetea a `""`

Cuando el usuario cambia la planta:
1. `IDTanque` se resetea a `""`

## Integración de datos

### Tabla: `TanqueLecturas`

Campos insertados:
```typescript
{
  IDTanque: number,           // Convertido de string
  Fecha: string,              // YYYY-MM-DD
  Hora: string,               // HH:MM:SS
  LecturaCms: number,         // AlturaCms convertido
  Temperatura: number,        // Convertido de string
  VolActualTA: 0,            // Fijo en 0
  VolActual15C: 0,           // Fijo en 0
  CuentaLitros: number,       // Convertido de string
  FechaRegistro: Date,        // Timestamp actual
  IDUsuarioRegistro: 1        // Usuario fijo (hardcoded)
}
```

## Estructura Visual

```
┌─────────────────────────────────────────────┐
│ Captura Diaria de Lecturas                  │
│                                             │
│ [Alert de éxito/error si existe]           │
│                                             │
│ ┌─── DATOS DEL TANQUE ───┐                 │
│ │ Ciudad | Planta | Tanque │               │
│ └─────────────────────────┘                │
│                                             │
│ ┌─── DATOS DE LECTURA ────┐                │
│ │ Fecha      | Hora  | Temp (°C)  │        │
│ │ Altura(cm) | Cuenta Litros     │         │
│ └──────────────────────────┘               │
│                                             │
│              [Limpiar] [Guardar]           │
└─────────────────────────────────────────────┘
```

## UX Características
- Inicializa fecha/hora por defecto al montar
- Botón para limpiar formulario y restablecer defaults
- Mensajes de éxito/error con `Alert` descartable
- Botón "Guardar" muestra "Guardando..." durante envío
- Form cards con headers estilizados (`bg-secondary text-white`)
- Diseño responsive con Bootstrap Grid

## Ejemplo de uso
```tsx
import CapturaLecturas from './components/CapturaLecturas';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/captura" element={<CapturaLecturas />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## Notas técnicas
- Los inputs devuelven strings, por lo que se usa `Number()` para convertir antes de insertar en BD
- La hora se formatea añadiendo `:00` si solo contiene `HH:MM`
- Las validaciones usan funciones personalizadas (ej. `validate` para fecha)
- El campo `IDUsuarioRegistro` está hardcoded a `1` (posible mejora futura con autenticación)
- `VolActualTA` y `VolActual15C` se establecen en `0` (posiblemente calculados por stored procedures futuros)
- El modo de react-hook-form es `onSubmit` con `reValidateMode: onChange` para validación dinámica después del primer submit
