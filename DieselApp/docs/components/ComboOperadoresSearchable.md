# ComboOperadoresSearchable

## Propósito

Versión con búsqueda predictiva (typeahead) del selector de operadores. Reemplaza a `ComboOperadores` en `SalidasDiesel` para permitir buscar por nombre mientras se mantiene el `IDPersonal` como valor almacenado.

## Diferencia respecto a ComboOperadores

| Aspecto           | ComboOperadores               | ComboOperadoresSearchable    |
| ----------------- | ----------------------------- | ---------------------------- |
| Librería UI       | `react-bootstrap Form.Select` | `react-select`               |
| Registro RHF      | `register()`                  | `Controller`                 |
| Búsqueda          | No                            | Sí (filtra mientras escribe) |
| Limpiar selección | No                            | Sí (botón ✕)                 |
| Dependencia extra | Ninguna                       | `react-select`               |

## Firma del Componente

```typescript
function ComboOperadoresSearchable({
  control,
  name,
  error,
  cveCiudad,
}: ComboOperadoresSearchableProps): JSX.Element;
```

## TypeScript Types

### ComboOperadoresSearchableProps

```typescript
interface ComboOperadoresSearchableProps {
  control: Control<any>; // Control de react-hook-form
  name: string; // Nombre del campo en el formulario
  error?: FieldError; // Error de validación
  cveCiudad?: string; // Ciudad para filtrar
}
```

## Props

- `control` — objeto `control` de `useForm` (no `register`)
- `name` — nombre del campo (`"IdOperador"` en SalidasDiesel)
- `error?` — error de validación de react-hook-form
- `cveCiudad?` — clave de ciudad para filtrar operadores

## Dependencias

- `react-select` — selector con búsqueda
- `react-hook-form` (`Controller`, `Control`, `FieldError`)
- `react-bootstrap` (`Form`, `Spinner`)
- `useComboLoader` — hook interno de carga
- `supabase` client local

## Fuente de datos

- **Tabla**: `Operadores`
- **Filtros**: `TipoPersonal = "OP"`, `CveCiudad = cveCiudad`
- **Orden**: `Nombre` ascendente
- **Valor almacenado**: `IDPersonal` (como string en el form, mapeado a `IdPersonal` en el insert)
- **Etiqueta visible**: `Nombre APaterno AMaterno`

## Comportamiento

- Sin ciudad seleccionada: deshabilitado, placeholder "Primero seleccione una ciudad"
- Con ciudad: muestra input de búsqueda activo con placeholder "Buscar operador..."
- Filtra por cualquier parte del nombre completo
- Botón ✕ para limpiar la selección
- Borde rojo si hay error de validación

## Ejemplo de uso

```tsx
import ComboOperadoresSearchable from "./ComboOperadoresSearchable";

function SalidasDiesel() {
  const {
    control,
    formState: { errors },
  } = useForm<SalidasForm>();

  return (
    <ComboOperadoresSearchable
      control={control}
      name="IdOperador"
      error={errors.IdOperador}
      cveCiudad={cveCiudad}
    />
  );
}
```

## Contexto de uso

Exclusivo de `SalidasDiesel`. El `ComboOperadores` original sigue disponible para otros usos futuros.

## Notas técnicas

- El filtro `TipoPersonal = "OP"` es idéntico al de `ComboOperadores`
- El valor guardado (`IDPersonal` como string) es compatible con el insert existente en `TanqueMovimiento.IdPersonal`
- Requiere `control` en el formulario padre (no `register`)
