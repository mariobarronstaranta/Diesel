# ComboTanquePorCiudad

## Propósito
Selector de tanque filtrado directamente por `CveCiudad`, utilizado en formularios de entradas y salidas.

## Dependencias
- `react`, `react-bootstrap`
- `react-hook-form`
- `supabase` client local

## Props
- `cveCiudad: string | null`
- `register: UseFormRegister<any>`
- `error?: { message?: string }`

## Estado interno
- `tanques: Tanque[]`
- `loading: boolean`

## Integración de datos
- Tabla: `Tanque`
- Filtro: `CveCiudad = cveCiudad`
- Orden: `Nombre ASC`

## Comportamiento
- Si no hay ciudad seleccionada, no consulta y deja lista vacía.
- Registra `IDTanque` como obligatorio.
- Presenta estado de carga y feedback de validación.
