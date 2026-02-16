# ComboUnidades

## Propósito
Selector de unidades vehiculares filtrado por ciudad y estado activo. Utilizado en el módulo de salidas de diésel para identificar el vehículo que recibe combustible.

## Firma del Componente
```typescript
function ComboUnidades({ register, error, cveCiudad }: ComboUnidadesProps): JSX.Element
```

## TypeScript Types

### Unidad
```typescript
interface Unidad {
  IDUnidad: number;
  IDClaveUnidad: string;
  ClaveAlterna: string;
}
```

### ComboUnidadesProps
```typescript
interface ComboUnidadesProps {
  register: UseFormRegister<any>;
  error?: FieldError;
  cveCiudad?: string;
}
```

## Props
- `register: UseFormRegister<any>` - Función de registro de react-hook-form
- `error?: FieldError` - Error de validación de react-hook-form (tipo específico)
- `cveCiudad?: string` - Clave de ciudad opcional para filtrado

## Dependencias
- `react` (`useEffect`, `useState`)
- `react-bootstrap` (`Form`)
- `react-hook-form` (`UseFormRegister`, `FieldError`)
- `supabase` client local

## Estado interno
- `unidades: Unidad[]` - Unidades filtradas por ciudad y activas
- `loading: boolean` - Indicador de carga (inicia en `false`)

## React Hooks
- `useState<Unidad[]>([])` - Almacena unidades
- `useState<boolean>(false)` - Estado de carga
- `useEffect(() => {...}, [cveCiudad])` - Recarga cuando cambia ciudad

## Funciones Internas

### fetchUnidades
```typescript
async function fetchUnidades(): Promise<void>
```
Consulta unidades filtradas por:
1. `CveCiudad` - Ciudad seleccionada
2. `Activo = "1"` - Solo unidades activas

Usa bloque `try-catch-finally` para manejo robusto de errores.

## Integración de datos
- **Tabla**: `Unidades`
- **Consulta**: `select("IDUnidad, IDClaveUnidad, ClaveAlterna").eq("CveCiudad", cveCiudad).eq("Activo", "1").order("IDClaveUnidad", { ascending: true })`
- **Campo del formulario**: `IDUnidad`
- **Validación**: "La unidad es obligatoria"
- **Filtros**: Por ciudad y estado activo

## Formato de visualización
Las opciones se muestran con formato: **IDClaveUnidad(ClaveAlterna)**

Ejemplo: `150(PIPA-01)`

## Comportamiento

### Lógica de dependencia
1. **Si `cveCiudad` no está definido**: Limpia unidades y deshabilita selector
2. **Si `cveCiudad` cambia**: Ejecuta nueva consulta filtrada
3. **Durante carga**: Deshabilita selector

### Estados del selector

| Condición | Texto de opción | Estado |
|-----------|----------------|--------|
| Sin ciudad | "Primero seleccione una ciudad" | Deshabilitado |
| Cargando | "Cargando..." | Deshabilitado |
| Listo | "Seleccione una unidad" | Habilitado |

## Ejemplo de uso
```tsx
import { useForm } from 'react-hook-form';
import ComboCveCiudad from './components/ComboCveCiudad';
import ComboUnidades from './components/ComboUnidades';

type SalidasForm = {
  CveCiudad: string;
  IDUnidad: string;
  IdOperador: string;
  // otros campos...
};

function SalidasDiesel() {
  const { register, watch, formState: { errors } } = useForm<SalidasForm>();
  const cveCiudad = watch('CveCiudad');

  return (
    <form>
      <ComboCveCiudad register={register} />
      <ComboUnidades 
        register={register}
        error={errors.IDUnidad}
        cveCiudad={cveCiudad}
      />
      {/* Otros campos... */}
    </form>
  );
}
```

## Contexto de uso
Este componente se utiliza en el módulo de **Salidas de Diésel** para:
- Identificar el vehículo que recibe combustible
- Asociar la salida con odómetro y horímetro del vehículo
- Vincular con el operador asignado
- Filtrar solo unidades activas de la ciudad seleccionada

## Notas técnicas
- Usa `FieldError` específico de react-hook-form en lugar del genérico `{ message?: string }`
- El filtro `Activo = "1"` usa string, no booleano
- Usa `try-catch-finally` para manejo de errores más robusto que otros combos
- El error se convierte a string con `as string` para el tipo de `Form.Control.Feedback`
- Ordena por `IDClaveUnidad` (no por `ClaveAlterna`)
- No muestra spinner visual (a diferencia de otros combos)
