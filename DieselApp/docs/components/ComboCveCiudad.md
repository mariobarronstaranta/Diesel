# ComboCveCiudad

## Propósito
Selector de ciudad para formularios con `react-hook-form`. Similar a `ComboCiudad`, pero expone el valor en el campo `CveCiudad` (clave alfanumérica) en vez de `IDCiudad` (número).

## Firma del Componente
```typescript
function ComboCveCiudad({ register, error }: ComboCveCiudadProps): JSX.Element
```

## TypeScript Types

### Ciudad
```typescript
type Ciudad = {
  IDCiudad: number;
  CveCiudad: string;
  Descripcion: string;
}
```

### ComboCveCiudadProps
```typescript
interface ComboCveCiudadProps {
  register: UseFormRegister<any>;
  error?: {
    message?: string;
  };
}
```

## Props
- `register: UseFormRegister<any>` - Función de registro de react-hook-form
- `error?: { message?: string }` - Objeto de error opcional de validación

## Dependencias
- `react` (`useEffect`, `useState`)
- `react-bootstrap` (`Form`, `Spinner`)
- `react-hook-form` (`UseFormRegister`)
- `supabase` client local

## Estado interno
- `ciudades: Ciudad[]` - Array de ciudades
- `loading: boolean` - Indicador de carga

## React Hooks
- `useState<Ciudad[]>([])` - Listado de ciudades
- `useState<boolean>(true)` - Estado de carga
- `useEffect(() => {...}, [])` - Carga inicial de ciudades

## Funciones Internas

### cargarCiudades
```typescript
async function cargarCiudades(): Promise<void>
```
Carga el catálogo de ciudades desde Supabase, ordenado alfabéticamente por descripción.

## Integración de datos
- **Tabla**: `Ciudad`
- **Consulta**: `select("IDCiudad, CveCiudad, Descripcion").order("Descripcion", { ascending: true })`
- **Campo del formulario**: `CveCiudad` ⚠️ **Diferencia clave vs. ComboCiudad**
- **Validación**: Campo obligatorio
- **Valor de opción**: `ciudad.CveCiudad` (string) en lugar de `ciudad.IDCiudad` (number)
- **Key de renderizado**: `ciudad.CveCiudad` para evitar duplicados

## Diferencias con ComboCiudad

| Aspecto | ComboCiudad | ComboCveCiudad |
|---------|-------------|----------------|
| Campo registrado | `IDCiudad` | `CveCiudad` |
| Tipo de valor | `number` | `string` |
| Uso típico | Formularios que requieren ID numérico | Formularios que necesitan clave alfanumérica |
| Key del map | `ciudad.IDCiudad` | `ciudad.CveCiudad` |
| Value del option | `ciudad.IDCiudad` | `ciudad.CveCiudad` |

## Comportamiento
- Muestra spinner durante carga
- Deshabilita selector mientras carga
- Formato visual: "Descripcion (CveCiudad)"
- Valida campo como obligatorio

## Ejemplo de uso
```tsx
import { useForm } from 'react-hook-form';
import ComboCveCiudad from './components/ComboCveCiudad';

type FormData = {
  CveCiudad: string;  // Nota: string, no number
  // otros campos...
};

function ReporteForm() {
  const { register, formState: { errors } } = useForm<FormData>();

  return (
    <form>
      <ComboCveCiudad 
        register={register} 
        error={errors.CveCiudad} 
      />
      {/* otros campos */}
    </form>
  );
}
```

## Casos de uso
Este componente se utiliza típicamente en:
- Formularios de reportes donde se filtra por código de ciudad
- Módulos que requieren identificación por clave alfanumérica
- Integraciones con sistemas externos que usan `CveCiudad` como referencia
