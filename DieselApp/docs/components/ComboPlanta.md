# ComboPlanta

## Propósito
Selector de planta filtrado por ciudad. Se utiliza en formularios de captura donde se requiere una selección en cascada: Ciudad → Planta → Tanque.

## Firma del Componente
```typescript
function ComboPlanta({ idCiudad, register }: ComboPlantaProps): JSX.Element
```

## TypeScript Types

### Planta
```typescript
interface Planta {
  IDPlanta: number;
  Nombre: string;
}
```

### ComboPlantaProps
```typescript
interface ComboPlantaProps {
  idCiudad: number | null;
  register: UseFormRegister<any>;
}
```

## Props
- `idCiudad: number | null` - ID de la ciudad seleccionada; controla el filtrado y estado del componente
- `register: UseFormRegister<any>` - Función de registro de react-hook-form

## Dependencias
- `react` (`useEffect`, `useState`)
- `react-bootstrap` (`Spinner`)
- `react-hook-form` (`UseFormRegister`)
- `supabase` client local

## Estado interno
- `plantas: Planta[]` - Array de plantas filtradas por ciudad
- `loading: boolean` - Indicador de carga durante consulta

## React Hooks
- `useState<Planta[]>([])` - Almacena plantas de la ciudad seleccionada
- `useState<boolean>(false)` - Estado de carga (inicia en `false`, no `true` como otros combos)
- `useEffect(() => {...}, [idCiudad])` - Recarga plantas cuando cambia la ciudad

## Funciones Internas

### fetchPlantas
```typescript
async function fetchPlantas(): Promise<void>
```
Consulta plantas filtradas por `IDCiudad`. Si ocurre error, lo registra en consola y limpia el estado.

## Integración de datos
- **Tabla**: `Planta`
- **Consulta**: `select("IDPlanta, Nombre").eq("IDCiudad", idCiudad).order("Nombre")`
- **Campo del formulario**: `IDPlanta`
- **Validación**: Campo obligatorio (`required: true`)

## Comportamiento en cascada

```
┌─────────────┐
│ ComboCiudad │
└──────┬──────┘
       │ idCiudad
       ▼
┌──────────────┐
│ ComboPlanta  │ ← Filtra plantas por ciudad
└──────┬───────┘
       │ idPlanta
       ▼
┌──────────────┐
│ ComboTanque  │ ← Filtra tanques por planta
└──────────────┘
```

### Lógica de dependencia
1. **Si `idCiudad` es `null`**: Limpia el array de plantas y deshabilita el selector
2. **Si `idCiudad` cambia**: Ejecuta nueva consulta filtrada
3. **Durante carga**: Muestra spinner y deshabilita selector

## Estados del selector

| Condición | Texto de opción por defecto | Estado |
|-----------|----------------------------|--------|
| Sin ciudad seleccionada | "Seleccione una ciudad" | Deshabilitado |
| Cargando | "Cargando plantas..." | Deshabilitado |
| Listo | "Seleccione una planta" | Habilitado |

## Ejemplo de uso
```tsx
import { useForm } from 'react-hook-form';
import ComboCiudad from './components/ComboCiudad';
import ComboPlanta from './components/ComboPlanta';

type FormData = {
  IDCiudad: string;
  IDPlanta: string;
};

function CapturaForm() {
  const { register, watch } = useForm<FormData>();
  const idCiudad = watch('IDCiudad');

  return (
    <form>
      <ComboCiudad register={register} />
      <ComboPlanta 
        idCiudad={idCiudad ? Number(idCiudad) : null} 
        register={register} 
      />
    </form>
  );
}
```

## Notas técnicas
- El componente muestra el spinner inline en el label junto al texto "Planta"
- La consulta convierte `idCiudad` a `Number()` explícitamente para asegurar tipo correcto
- Si hay error en la consulta, se registra en consola pero no se muestra al usuario
- El operador de coalescencia nula (`data ?? []`) asegura que siempre haya un array válido
