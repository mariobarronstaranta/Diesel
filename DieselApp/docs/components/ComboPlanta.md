# ComboPlanta

## Propósito
Selector dependiente de planta por ciudad para captura de lecturas.

## Dependencias
- `react`, `react-bootstrap`
- `react-hook-form`
- `supabase` client local

## Props
- `idCiudad: number | null`
- `register: UseFormRegister<any>`

## Estado interno
- `plantas: Planta[]`
- `loading: boolean`

## Integración de datos
- Tabla: `Planta`
- Filtro: `IDCiudad = idCiudad`
- Orden: `Nombre`

## Comportamiento
- Si no hay `idCiudad`, limpia resultados y deshabilita el selector.
- Registra `IDPlanta` como requerido.
- Muestra spinner junto a la etiqueta durante la consulta.
