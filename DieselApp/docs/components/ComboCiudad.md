# ComboCiudad

## Propósito
Selector de ciudad para formularios con `react-hook-form`. Carga catálogo desde Supabase y expone el valor en el campo `IDCiudad`.

## Dependencias
- `react`, `react-bootstrap`
- `react-hook-form`
- `supabase` client local

## Props
- `register: UseFormRegister<any>`
- `error?: { message?: string }`

## Estado interno
- `ciudades: Ciudad[]`
- `loading: boolean`

## Integración de datos
- Tabla: `Ciudad`
- Consulta: `select(IDCiudad, CveCiudad, Descripcion).order(Descripcion)`

## Comportamiento
- Muestra spinner mientras carga.
- Deshabilita `<select>` durante carga.
- Muestra error de validación de `react-hook-form` si existe.
