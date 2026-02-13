# ComboOperadores

## Propósito
Selector de operadores por ciudad para el formulario de salidas.

## Dependencias
- `react`, `react-bootstrap`
- `react-hook-form`
- `supabase` client local

## Props
- `register: UseFormRegister<any>`
- `error?: FieldError`
- `cveCiudad?: string`

## Estado interno
- `operadores: Operador[]`
- `loading: boolean`

## Integración de datos
- Tabla: `Operadores`
- Filtros:
  - `TipoPersonal = "OP"`
  - `CveCiudad = cveCiudad`
- Orden: `Nombre ASC`

## Comportamiento
- Si no hay ciudad, no habilita selección.
- Registra `IdOperador` como obligatorio.
- Renderiza nombre completo concatenado en cada opción.
