# ComboCiudad

## Propósito
Selector de ciudad para formularios con `react-hook-form`. Carga catálogo desde Supabase y expone el valor en el campo `IDCiudad`.

## Firma del Componente
```typescript
function ComboCiudad({ register, error }: ComboCiudadProps): JSX.Element
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

### ComboCiudadProps
```typescript
interface ComboCiudadProps {
  register: UseFormRegister<any>;
  error?: {
    message?: string;
  };
}
```

## Props
- `register: UseFormRegister<any>` - Función de registro de react-hook-form para vincular el campo al formulario
- `error?: { message?: string }` - Objeto de error opcional de validación del formulario

## Dependencias
- `react` (`useEffect`, `useState`)
- `react-bootstrap` (`Form`, `Spinner`)
- `react-hook-form` (`UseFormRegister`)
- `supabase` client local

## Estado interno
- `ciudades: Ciudad[]` - Array de ciudades cargadas desde la base de datos
- `loading: boolean` - Indicador de carga durante consulta a Supabase

## React Hooks
- `useState<Ciudad[]>([])` - Almacena el listado de ciudades
- `useState<boolean>(true)` - Estado de carga inicial
- `useEffect(() => {...}, [])` - Ejecuta la carga de ciudades al montar el componente

## Funciones Internas

### cargarCiudades
```typescript
async function cargarCiudades(): Promise<void>
```
Función asíncrona que:
1. Activa el estado de carga
2. Consulta la tabla `Ciudad` en Supabase
3. Ordena resultados por `Descripcion` ascendente
4. Actualiza el estado con los datos obtenidos
5. Desactiva el estado de carga

## Integración de datos
- **Tabla**: `Ciudad`
- **Consulta**: `select("IDCiudad, CveCiudad, Descripcion").order("Descripcion", { ascending: true })`
- **Campo del formulario**: `IDCiudad`
- **Validación**: Campo obligatorio con mensaje "Seleccione"

## Comportamiento
- Muestra spinner mientras carga los datos
- Deshabilita `<select>` durante carga para prevenir interacción
- Muestra error de validación de `react-hook-form` si existe
- Formato de opción: "Descripcion (CveCiudad)" - ejemplo: "Monterrey (MTY)"

## Ejemplo de uso
```tsx
import { useForm } from 'react-hook-form';
import ComboCiudad from './components/ComboCiudad';

type FormData = {
  IDCiudad: string;
  // otros campos...
};

function MiFormulario() {
  const { register, formState: { errors } } = useForm<FormData>();

  return (
    <form>
      <ComboCiudad 
        register={register} 
        error={errors.IDCiudad} 
      />
      {/* otros campos */}
    </form>
  );
}
```

## Notas técnicas
- El componente usa el operador spread (`...register("IDCiudad", {...})`) para vincular el campo al formulario
- La validación `isInvalid={!!error}` convierte el objeto error a booleano para activar estilos de error
- La opción por defecto cambia dinámicamente entre "Cargando ciudades..." y "Seleccione" según el estado de carga
