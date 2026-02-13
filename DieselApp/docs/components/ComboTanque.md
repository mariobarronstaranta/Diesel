# ComboTanque

## Propósito
Selector dependiente de tanque por planta para captura de lecturas.

## Dependencias
- `react`, `react-bootstrap`
- `react-hook-form`
- `supabase` client local

## Props
- `idPlanta: number | null`
- `register: UseFormRegister<any>`

## Estado interno
- `tanques: Tanque[]`
- `loading: boolean`

## Integración de datos
- Tabla: `Tanque`
- Filtro: `IDPlanta = idPlanta`
- Orden: `Nombre`

## Comportamiento
- Si no hay `idPlanta`, limpia la lista y bloquea selección.
- Registra `IDTanque` como requerido.
- Mensajes dinámicos: seleccionar planta / cargando / seleccionar tanque.
