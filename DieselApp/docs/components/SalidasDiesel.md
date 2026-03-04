# SalidasDiesel

## Propósito

Registrar salidas de diésel en `TanqueMovimiento` con `TipoMovimiento = "S"`.

## Firma del Componente

```typescript
function SalidasDiesel(): JSX.Element;
```

No recibe props - es un componente de página completo.

## TypeScript Types

### SalidasForm

```typescript
interface SalidasForm {
  CveCiudad: string;
  IDTanque: string;
  Fecha: string;
  Hora: string;
  Temperatura: string;
  IDUnidad: string; // Vehículo
  IdOperador: string; // Conductor
  Horimetro: string;
  Odometro: string;
  LitrosCarga: string;
  CuentaLitros: string;
  FolioVale: string; // Folio del vale de salida
  Observaciones: string;
}
```

## Dependencias

- `react` (`useState`, `useEffect`)
- `react-bootstrap` (`Container`, `Card`, `Form`, `Button`, `Row`, `Col`, `Alert`, `Spinner`)
- `react-hook-form` (`useForm`, `Controller`)
- `react-select` — búsqueda predictiva en combos de Unidad y Operador
- Componentes internos: `ComboCveCiudad`, `ComboTanquePorCiudad`, `ComboUnidadesSearchable`, `ComboOperadoresSearchable`
- `supabase` client local

## Estado interno

- `loading: boolean` - Estado de envío
- `message: { type, text } | null` - Mensaje de resultado
- `cveCiudad: string` - Ciudad seleccionada sincronizada desde watch

## React Hooks

### useState

- `useState<boolean>(false)` - `loading`
- `useState<{type: 'success' | 'danger', text: string} | null>(null)` - `message`
- `useState<string>("")` - `cveCiudad` (estado separado para pasar a combos hijos)

### useForm

```typescript
const {
  register,
  handleSubmit,
  formState: { errors },
  watch,
  reset,
  setValue,
  control, // Requerido para combos searchable (Controller)
} = useForm<SalidasForm>({
  mode: "onSubmit",
  reValidateMode: "onChange",
});
```

### useEffect

1. **Inicialización** - `useEffect(() => setDefaults(), [])`
2. **Sincronización `cveCiudad`** - `useEffect(() => { setCveCiudad(watchCveCiudad); ... }, [watchCveCiudad])`
   - Cuando cambia ciudad, limpia tanque y unidad

### watch

- `watch("CveCiudad")` - Se asigna a `watchCveCiudad` para detectar cambios

## Funciones Internas

### setDefaults

```typescript
function setDefaults(): void;
```

Establece fecha y hora actuales en formato `YYYY-MM-DD` y `HH:MM`.

### handleClean

```typescript
function handleClean(): void;
```

Resetea todos los campos y restablece fecha/hora a valores actuales.

### onSubmit

```typescript
async function onSubmit(data: SalidasForm): Promise<void>;
```

1. Activa estado de carga
2. Construye timestamp local (`YYYY-MM-DD HH:MM:SS`)
3. Convierte valores numéricos
4. Inserta en `TanqueMovimiento` con tipo "S"
5. Establece campos de entrada (`Remision`, `IdProveedor`) como `null`
6. Muestra mensaje de éxito/error
7. Limpia formulario si es exitoso

## Reglas y validaciones

| Campo           | Tipo              | Validación  | Componente                  |
| --------------- | ----------------- | ----------- | --------------------------- |
| `CveCiudad`     | select            | Obligatorio | `ComboCveCiudad`            |
| `IDTanque`      | select            | Obligatorio | `ComboTanquePorCiudad`      |
| `Fecha`         | date              | Obligatoria | `Form.Control`              |
| `Hora`          | time              | Obligatoria | `Form.Control`              |
| `Temperatura`   | number            | Obligatoria | `Form.Control`              |
| `IDUnidad`      | searchable select | Obligatorio | `ComboUnidadesSearchable`   |
| `IdOperador`    | searchable select | Obligatorio | `ComboOperadoresSearchable` |
| `Horimetro`     | number            | Obligatorio | `Form.Control`              |
| `Odometro`      | number            | Obligatorio | `Form.Control`              |
| `LitrosCarga`   | number            | Obligatorio | `Form.Control`              |
| `CuentaLitros`  | number            | Obligatorio | `Form.Control`              |
| `FolioVale`     | text              | Obligatorio | `Form.Control`              |
| `Observaciones` | textarea          | Opcional    | `Form.Control`              |

## Lógica de cascada

```
Ciudad (CveCiudad)
  ├─► Tanque (IDTanque) ← Se limpia cuando cambia ciudad
  └─► Unidad (IDUnidad) ← Se limpia cuando cambia ciudad
       └─► Operador (IdOperador) ← Mismo filtro de ciudad
```

Al cambiar ciudad:

1. `IDTanque` se resetea
2. `IDUnidad` se resetea
3. Operador se recarga (mismo filtro de ciudad)

## Integración de datos

### Tabla: `TanqueMovimiento`

Campos insertados:

```typescript
{
  CveCiudad: string,
  IdTanque: number,
  FechaCarga: string,             // YYYY-MM-DD
  HoraCarga: string,              // HH:MM
  TemperaturaCarga: number,
  LitrosCarga: number,
  AlturaTanque: 0,                // Fijo en 0 (no se captura en salidas)
  CuentaLitros: number,
  Remision: null,                 // Específico de entradas
  IdProveedor: null,              // Específico de entradas
  Observaciones: string,
  TipoMovimiento: "S",            // "S" = Salida
  FechaHoraMovimiento: string,    // Timestamp local YYYY-MM-DD HH:MM:SS
  IdUnidad: number,               // ← Campos específicos de salidas ↓
  IdPersonal: number,             // Mapeado desde IdOperador
  FolioVale: string,
  Horimetro: number,
  Odometro: number
}
```

## Estructura Visual

```
┌──────────────────────────────────────────┐
│ Registro de Salidas de Diesel            │
│                                          │
│ [Alert de éxito/error si existe]        │
│                                          │
│ ┌─── DATOS DEL TANQUE ─────┐            │
│ │ Ciudad          | Tanque  │            │
│ │ Fecha | Hora | Temperatura │           │
│ └──────────────────────────┘            │
│                                          │
│ ┌─── DATOS DE UNIDAD ───────┐           │
│ │ Unidad | Operador          │           │
│ │ Horímetro | Odómetro      │           │
│ └──────────────────────────┘            │
│                                          │
│ ┌─── DATOS DE CARGA ────────┐           │
│ │ Litros | Cuenta Litros | Vale │       │
│ │ Observaciones (textarea)  │           │
│ └───────────────────────────┘           │
│                                          │
│          [Limpiar] [Guardar]            │
└──────────────────────────────────────────┘
```

## Diferencias con EntradasDiesel

| Aspecto                      | EntradasDiesel             | SalidasDiesel                                    |
| ---------------------------- | -------------------------- | ------------------------------------------------ |
| TipoMovimiento               | "E"                        | "S"                                              |
| Campos específicos           | Proveedor, Remisión        | Unidad, Operador, Horímetro, Odómetro, FolioVale |
| Estructura visual            | 2 bloques (Tanque + Carga) | 3 bloques (Tanque + Unidad + Carga)              |
| AlturaTanque                 | Capturado                  | Fijo en 0                                        |
| Remision/IdProveedor         | Capturados                 | `null`                                           |
| Campo identificador vehículo | N/A                        | IDUnidad, IdOperador                             |

## UX Características

- Tres bloques visuales: tanque, unidad, carga
- Botones de limpiar y guardar con control de estado de envío
- Spinner en botón guardar durante procesamiento
- Estado `cveCiudad` sincronizado para pasar a múltiples combos
- Validaciones dinámicas después del primer submit

## Ejemplo de uso

```tsx
import SalidasDiesel from "./components/SalidasDiesel";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/salidas" element={<SalidasDiesel />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## Notas técnicas

- `control` es necesario además de `register` para los combos searchable (`ComboUnidadesSearchable`, `ComboOperadoresSearchable`)
- `ComboUnidades` y `ComboOperadores` originales **no se modificaron** — los componentes searchable son variantes independientes
- El valor guardado en `TanqueMovimiento` no cambia: `IDUnidad → IdUnidad`, `IDPersonal → IdPersonal`
- Usa un estado separado `cveCiudad` (sincronizado con `watch("CveCiudad")`) para pasar la misma ciudad a todos los combos hijos
- El campo `IdOperador` del formulario se mapea a `IdPersonal` en la base de datos
- `AlturaTanque` se establece en `0` porque no se captura en salidas
- Los campos de entradas (`Remision`, `IdProveedor`) se envían como `null` explícitamente
- Modo de validación: `onSubmit` con `reValidateMode: onChange`
- Incluye controles para horímetro y odómetro para tracking de consumo por vehículo
