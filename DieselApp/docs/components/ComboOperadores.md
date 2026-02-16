# ComboOperadores

## Propósito
Selector de operadores filtrado por ciudad y tipo de personal. Utilizado en el módulo de salidas de diésel para identificar al conductor del vehículo.

## Firma del Componente
```typescript
function ComboOperadores({ register, error, cveCiudad }: ComboOperadoresProps): JSX.Element
```

## TypeScript Types

### Operador
```typescript
interface Operador {
  IDPersonal: number;
  Nombre: string;
  APaterno: string;
  AMaterno: string;
}
```

### ComboOperadoresProps
```typescript
interface ComboOperadoresProps {
  register: UseFormRegister<any>;
  error?: FieldError;
  cveCiudad?: string;
}
```

## Props
- `register: UseFormRegister<any>` - Función de registro de react-hook-form
- `error?: FieldError` - Error de validación de react-hook-form
- `cveCiudad?: string` - Clave de ciudad opcional para filtrado

## Dependencias
- `react` (`useEffect`, `useState`)
- `react-bootstrap` (`Form`)
- `react-hook-form` (`UseFormRegister`, `FieldError`)
- `supabase` client local

## Estado interno
- `operadores: Operador[]` - Operadores filtrados por ciudad y tipo
- `loading: boolean` - Indicador de carga (inicia en `false`)

## React Hooks
- `useState<Operador[]>([])` - Almacena operadores
- `useState<boolean>(false)` - Estado de carga
- `useEffect(() => {...}, [cveCiudad])` - Recarga cuando cambia ciudad

## Funciones Internas

### fetchOperadores
```typescript
async function fetchOperadores(): Promise<void>
```
Consulta operadores filtrados por:
1. `TipoPersonal = "OP"` - Solo operadores (no otros tipos de personal)
2. `CveCiudad` - Ciudad seleccionada

Usa bloque `try-catch-finally` para manejo de errores.

## Integración de datos
- **Tabla**: `Operadores`
- **Consulta**: `select("IDPersonal, Nombre, APaterno, AMaterno").eq("TipoPersonal", "OP").eq("CveCiudad", cveCiudad).order("Nombre", { ascending: true })`
- **Campo del formulario**: `IdOperador` (registra `IDPersonal` del operador)
- **Validación**: "El operador es obligatorio"
- **Filtros**: Por tipo de personal "OP" y ciudad

## Formato de visualización
Las opciones muestran el nombre completo: **Nombre APaterno AMaterno**

Ejemplo: `Juan Pérez García`

## Comportamiento

### Lógica de dependencia
1. **Si `cveCiudad` no está definido**: Limpia operadores y deshabilita selector
2. **Si `cveCiudad` cambia**: Ejecuta nueva consulta filtrada
3. **Durante carga**: Deshabilita selector

### Estados del selector

| Condición | Texto de opción | Estado |
|-----------|----------------|--------|
| Sin ciudad | "Primero seleccione una ciudad" | Deshabilitado |
| Cargando | "Cargando..." | Deshabilitado |
| Listo | "Seleccione un operador" | Habilitado |

## Relación con datos de salida

```
Salida de Diésel
├─ Unidad (vehículo)
├─ Operador (conductor) ◄── Este componente
├─ Horímetro
├─ Odómetro
└─ Litros cargados
```

## Ejemplo de uso
```tsx
import { useForm } from 'react-hook-form';
import ComboCveCiudad from './components/ComboCveCiudad';
import ComboUnidades from './components/ComboUnidades';
import ComboOperadores from './components/ComboOperadores';

type SalidasForm = {
  CveCiudad: string;
  IDUnidad: string;
  IdOperador: string;
  Horimetro: string;
  Odometro: string;
  // otros campos...
};

function SalidasDiesel() {
  const { register, watch, formState: { errors } } = useForm<SalidasForm>();
  const cveCiudad = watch('CveCiudad');

  return (
    <form>
      <ComboCveCiudad register={register} />
      
      <h4>Datos de Unidad</h4>
      <ComboUnidades 
        register={register}
        error={errors.IDUnidad}
        cveCiudad={cveCiudad}
      />
      <ComboOperadores 
        register={register}
        error={errors.IdOperador}
        cveCiudad={cveCiudad}
      />
      
      {/* Campos de horímetro, odómetro, etc. */}
    </form>
  );
}
```

## Contexto de uso
Este componente se utiliza en el módulo de **Salidas de Diésel** para:
- Registrar quién opera el vehículo que recibe combustible
- Asociar la salida con el personal responsable
- Filtrar solo operadores (no todo el personal)
- Vincular con horímetro y odómetro para control de consumo

## Notas técnicas
- Usa tabla `Operadores` pero registra el campo como `IdOperador` (no `IDPersonal`)
- Filtro `TipoPersonal = "OP"` distingue operadores de otro personal (mecánicos, administrativos, etc.)
- Ordena por nombre (no por apellido)
- No muestra spinner visual (similar a `ComboUnidades`)
- Usa `try-catch-finally` sin registrar errores en consola (diferente de otros combos)
- El error se convierte a string con `as string` para compatibilidad con `Form.Control.Feedback`
