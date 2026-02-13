# ComboProveedores

## Propósito
Selector de proveedor para el registro de entradas de diésel.

## Dependencias
- `react`, `react-bootstrap`
- `react-hook-form`
- `supabase` client local

## Props
- `register: UseFormRegister<any>`
- `error?: { message?: string }`

## Estado interno
- `proveedores: Proveedor[]`
- `loading: boolean`

## Integración de datos
- Tabla: `Proveedores`
- Consulta: `select(IdProveedor, NombreProveedor).order(NombreProveedor)`

## Comportamiento
- Registra campo `IdProveedor` como requerido.
- Deshabilita el select durante carga.
- En caso de error de consulta, registra en consola y mantiene estado seguro.
