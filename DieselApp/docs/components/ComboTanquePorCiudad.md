# ComboTanquePorCiudad

## Propósito
Selector de tanque filtrado directamente por ciudad (no por planta). Permite selección en 2 niveles: Ciudad → Tanque, omitiendo el nivel intermedio de planta.

## Firma del Componente
```typescript
function ComboTanquePorCiudad({ cveCiudad, register, error }: ComboTanquePorCiudadProps): JSX.Element
```

## TypeScript Types

### Tanque
```typescript
type Tanque = {
  IDTanque: number;
  Nombre: string;
}
```

### ComboTanquePorCiudadProps
```typescript
interface ComboTanquePorCiudadProps {
  cveCiudad: string | null;
  register: UseFormRegister<any>;
  error?: {
    message?: string;
  };
}
```

## Props
- `cveCiudad: string | null` - **Clave de ciudad** (no ID numérico); controla el filtrado
- `register: UseFormRegister<any>` - Función de registro de react-hook-form
- `error?: { message?: string }` - Error de validación opcional

## Dependencias
- `react` (`useEffect`, `useState`)
- `react-bootstrap` (`Form`, `Spinner`)
- `react-hook-form` (`UseFormRegister`)
- `supabase` client local

## Estado interno
- `tanques: Tanque[]` - Tanques filtrados por ciudad
- `loading: boolean` - Estado de carga (inicia en `false`)

## React Hooks
- `useState<Tanque[]>([])` - Almacena tanques
- `useState<boolean>(false)` - Estado de carga
- `useEffect(() => {...}, [cveCiudad])` - Recarga cuando cambia `cveCiudad`

## Funciones Internas

### cargarTanques
```typescript
async function cargarTanques(): Promise<void>
```
Consulta tanques filtrados por `CveCiudad` (campo string, no numérico).

## Integración de datos
- **Tabla**: `Tanque`
- **Consulta**: `select("IDTanque, Nombre").eq("CveCiudad", cveCiudad).order("Nombre", { ascending: true })`
- **Campo del formulario**: `IDTanque`
- **Validación**: "Seleccione un tanque"

## Diferencias con ComboTanque

| Aspecto | ComboTanque | ComboTanquePorCiudad |
|---------|-------------|----------------------|
| Filtro | `IDPlanta` (number) | `CveCiudad` (string) |
| Jerarquía | Ciudad → Planta → Tanque | Ciudad → Tanque |
| Columna de filtro | `eq("IDPlanta", ...)` | `eq("CveCiudad", ...)` |
| Uso | Formularios de captura | Formularios de reportes/movimientos |

## Comportamiento en cascada

### Jerarquía simplificada
```
Ciudad (CveCiudad)
  └─► Tanque (IDTanque) ◄── Este componente
  
vs. ComboTanque:

Ciudad (IDCiudad)
  └─► Planta (IDPlanta)
       └─► Tanque (IDTanque)
```

### Lógica de dependencia
1. **Si `cveCiudad` es `null`**: Limpia array y deshabilita selector
2. **Si `cveCiudad` cambia**: Limpia array actual, luego carga nuevos tanques
3. **Durante carga**: Muestra spinner y deshabilita selector

## Estados del selector

| Condición | Texto de opción | Estado |
|-----------|----------------|--------|
| Sin ciudad | "Seleccione una ciudad" | Deshabilitado |
| Cargando | "Cargando..." | Deshabilitado |
| Listo | "Seleccione" | Habilitado |

## Ejemplo de uso
```tsx
import { useForm } from 'react-hook-form';
import ComboCveCiudad from './components/ComboCveCiudad';
import ComboTanquePorCiudad from './components/ComboTanquePorCiudad';

type FormData = {
  CveCiudad: string;
  IDTanque: string;
};

function EntradasForm() {
  const { register, watch, formState: { errors } } = useForm<FormData>();
  const cveCiudad = watch('CveCiudad');

  return (
    <form>
      <ComboCveCiudad register={register} />
      <ComboTanquePorCiudad 
        cveCiudad={cveCiudad || null} 
        register={register}
        error={errors.IDTanque}
      />
    </form>
  );
}
```

## Notas técnicas
- A diferencia de `ComboTanque`, este componente usa `CveCiudad` (string) en lugar de `IDPlanta` (number)
- Limpia el array de tanques **antes** de iniciar la carga para evitar mostrar datos obsoletos
- El spinner se muestra debajo del selector (no inline en el label)
- Soporte completo para feedback de errores de validación
