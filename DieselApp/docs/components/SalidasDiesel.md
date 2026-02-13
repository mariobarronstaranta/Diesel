# SalidasDiesel

## Propósito
Registrar salidas de diésel en `TanqueMovimiento` con `TipoMovimiento = "S"`.

## Dependencias
- `react`, `react-bootstrap`, `react-hook-form`
- Componentes internos: `ComboCveCiudad`, `ComboTanquePorCiudad`, `ComboUnidades`, `ComboOperadores`
- `supabase` client local

## Modelo de formulario
- Tanque: `CveCiudad`, `IDTanque`, `Fecha`, `Hora`, `Temperatura`
- Unidad: `IDUnidad`, `IdOperador`, `Horimetro`, `Odometro`
- Carga: `LitrosCarga`, `CuentaLitros`, `FolioVale`, `Observaciones`

## Estado interno
- `loading`, `message`
- `cveCiudad` sincronizada desde `watch("CveCiudad")`

## Reglas y comportamiento
- Defaults automáticos para fecha/hora.
- Al cambiar ciudad, limpia tanque y unidad.
- Validaciones obligatorias para datos críticos (operador, unidad, litros, folio, etc.).

## Integración de datos
- Tabla destino: `TanqueMovimiento`.
- Campos específicos de salida:
  - `TipoMovimiento = "S"`
  - `IdUnidad`, `IdPersonal`, `FolioVale`, `Horimetro`, `Odometro`
  - `Remision` e `IdProveedor` se envían como `null`.

## UX
- Tres bloques visuales: tanque, unidad, carga.
- Botones de limpiar y guardar con control de estado de envío.
