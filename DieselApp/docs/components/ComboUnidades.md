# ComboUnidades

## Propósito
Selector de unidades activas por ciudad, utilizado en el flujo de salidas.

## Dependencias
- `react`, `react-bootstrap`
- `react-hook-form`
- `supabase` client local

## Props
- `register: UseFormRegister<any>`
- `error?: FieldError`
- `cveCiudad?: string`

## Estado interno
- `unidades: Unidad[]`
- `loading: boolean`

## Integración de datos
- Tabla: `Unidades`
- Filtros:
  - `CveCiudad = cveCiudad`
  - `Activo = "1"`
- Orden: `IDClaveUnidad ASC`

## Comportamiento
- Si no hay ciudad, resetea opciones.
- Registra `IDUnidad` como obligatorio.
- Maneja error con logging y lista vacía como fallback.
