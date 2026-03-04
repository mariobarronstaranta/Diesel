# ComboUnidadesSearchable

## Propósito

Versión con búsqueda predictiva (typeahead) del selector de unidades vehiculares. Reemplaza a `ComboUnidades` en `SalidasDiesel` para permitir búsqueda por texto mientras se mantiene el comportamiento de combo con ID como valor.

## Diferencia respecto a ComboUnidades

| Aspecto           | ComboUnidades                 | ComboUnidadesSearchable      |
| ----------------- | ----------------------------- | ---------------------------- |
| Librería UI       | `react-bootstrap Form.Select` | `react-select`               |
| Registro RHF      | `register()`                  | `Controller`                 |
| Búsqueda          | No                            | Sí (filtra mientras escribe) |
| Limpiar selección | No                            | Sí (botón ✕)                 |
| Dependencia extra | Ninguna                       | `react-select`               |

## Firma del Componente

```typescript
function ComboUnidadesSearchable({
  control,
  name,
  error,
  cveCiudad,
}: ComboUnidadesSearchableProps): JSX.Element;
```

## TypeScript Types

### ComboUnidadesSearchableProps

```typescript
interface ComboUnidadesSearchableProps {
  control: Control<any>; // Control de react-hook-form
  name: string; // Nombre del campo en el formulario
  error?: FieldError; // Error de validación
  cveCiudad?: string; // Ciudad para filtrar
}
```

## Props

- `control` — objeto `control` de `useForm` (no `register`)
- `name` — nombre del campo (`"IDUnidad"` en SalidasDiesel)
- `error?` — error de validación de react-hook-form
- `cveCiudad?` — clave de ciudad para filtrar unidades

## Dependencias

- `react-select` — selector con búsqueda
- `react-hook-form` (`Controller`, `Control`, `FieldError`)
- `react-bootstrap` (`Form`, `Spinner`)
- `useComboLoader` — hook interno de carga
- `supabase` client local

## Fuente de datos

- **Tabla**: `Unidades`
- **Filtros**: `CveCiudad = cveCiudad`, `Activo = "1"`
- **Orden**: `IDClaveUnidad` ascendente
- **Valor almacenado**: `IDUnidad` (número como string en el form)
- **Etiqueta visible**: `IDClaveUnidad (ClaveAlterna)`

## Comportamiento

- Sin ciudad seleccionada: deshabilitado, placeholder "Primero seleccione una ciudad"
- Con ciudad: muestra input de búsqueda activo
- Soporta filtrado por cualquier parte del texto de la etiqueta
- Botón ✕ para limpiar la selección
- Borde rojo si hay error de validación

## Ejemplo de uso

```tsx
import { useForm, Controller } from "react-hook-form";
import ComboUnidadesSearchable from "./ComboUnidadesSearchable";

function SalidasDiesel() {
  const {
    control,
    formState: { errors },
  } = useForm<SalidasForm>();
  const cveCiudad = watch("CveCiudad");

  return (
    <ComboUnidadesSearchable
      control={control}
      name="IDUnidad"
      error={errors.IDUnidad}
      cveCiudad={cveCiudad}
    />
  );
}
```

## Contexto de uso

Exclusivo de `SalidasDiesel`. No se usa en `EntradasDiesel` ni `CapturaLecturas`.

## Notas técnicas

- Usa `useComboLoader` de `../shared/hooks/useComboLoader` — misma fuente que `ComboUnidades`
- El valor del campo sigue siendo `IDUnidad` como string — compatible con el insert existente en `TanqueMovimiento`
- Requiere pasar `control` en lugar de `register` al formulario padre
