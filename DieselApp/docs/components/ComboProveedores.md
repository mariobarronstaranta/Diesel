# ComboProveedores

## Propósito
Selector de proveedores para formularios de entrada de diésel. Carga el catálogo completo sin filtros.

## Firma del Componente
```typescript
function ComboProveedores({ register, error }: ComboProveedoresProps): JSX.Element
```

## TypeScript Types

### Proveedor
```typescript
type Proveedor = {
  IdProveedor: number;
  NombreProveedor: string;
}
```

### ComboProveedoresProps
```typescript
interface ComboProveedoresProps {
  register: UseFormRegister<any>;
  error?: {
    message?: string;
  };
}
```

## Props
- `register: UseFormRegister<any>` - Función de registro de react-hook-form
- `error?: { message?: string }` - Error de validación opcional

## Dependencias
- `react` (`useEffect`, `useState`)
- `react-bootstrap` (`Form`, `Spinner`)
- `react-hook-form` (`UseFormRegister`)
- `supabase` client local

## Estado interno
- `proveedores: Proveedor[]` - Listado completo de proveedores
- `loading: boolean` - Indicador de carga (inicia en `true`)

## React Hooks
- `useState<Proveedor[]>([])` - Almacena proveedores
- `useState<boolean>(true)` - Estado de carga inicial
- `useEffect(() => {...}, [])` - Carga proveedores al montar (array de dependencias vacío)

## Funciones Internas

### cargarProveedores
```typescript
async function cargarProveedores(): Promise<void>
```
Carga el catálogo completo de proveedores ordenado alfabéticamente.

## Integración de datos
- **Tabla**: `Proveedores`
- **Consulta**: `select("IdProveedor, NombreProveedor").order("NombreProveedor", { ascending: true })`
- **Campo del formulario**: `IdProveedor`
- **Validación**: "Seleccione un proveedor"
- **Sin filtros**: Carga todos los registros activos

## Comportamiento
- Carga inicial automática al montar el componente
- Muestra spinner debajo del selector durante carga
- Deshabilita selector mientras carga
- Ordena proveedores alfabéticamente por nombre
- Maneja errores registrándolos en consola

## Estados del selector

| Condición | Texto de opción | Estado |
|-----------|----------------|--------|
| Cargando | "Cargando..." | Deshabilitado |
| Listo | "Seleccione" | Habilitado |

## Ejemplo de uso
```tsx
import { useForm } from 'react-hook-form';
import ComboProveedores from './components/ComboProveedores';

type EntradasForm = {
  IdProveedor: string;
  Remision: string;
  // otros campos...
};

function EntradasDiesel() {
  const { register, formState: { errors } } = useForm<EntradasForm>();

  return (
    <form>
      {/* Otros campos... */}
      <ComboProveedores 
        register={register}
        error={errors.IdProveedor}
      />
      {/* Campo de remisión, etc. */}
    </form>
  );
}
```

## Contexto de uso
Este componente se utiliza específicamente en el módulo de **Entradas de Diésel** para registrar:
- El proveedor que suministra el combustible
- Asociado con número de remisión
- Parte de los datos de carga junto con litros, temperatura, etc.

## Notas técnicas
- A diferencia de otros combos, este **no tiene dependencias** de ciudad o planta
- El campo usa `IdProveedor` (con mayúscula en `Id`) para coincidir con el esquema de base de datos
- Errores de consulta se registran en consola pero no se muestran en UI
- El componente sigue el patrón estándar de combos con spinner y feedback de validación
