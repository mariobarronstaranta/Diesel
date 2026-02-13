# ComboCveCiudad

## Propósito
Selector de ciudad basado en clave (`CveCiudad`) para formularios donde se necesita guardar la clave textual en lugar del ID numérico.

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
- Registra el campo `CveCiudad` como requerido.
- El valor de opción es `CveCiudad`.
- Renderiza spinner y mensaje de carga cuando aplica.
