# EntradasDiesel

## Propósito
Capturar movimientos de entrada de diésel en tabla `TanqueMovimiento` con `TipoMovimiento = "E"`.

## Dependencias
- `react`, `react-bootstrap`, `react-hook-form`
- Componentes internos: `ComboCveCiudad`, `ComboTanquePorCiudad`, `ComboProveedores`
- `supabase` client local

## Modelo de formulario
Campos relevantes:
- Tanque: `CveCiudad`, `IDTanque`, `Fecha`, `Hora`, `Temperatura`
- Carga: `LitrosCarga`, `Altura`, `CuentaLitros`, `IdProveedor`, `Remision`, `Observaciones`

## Estado interno
- `loading`: estado de envío
- `message`: alert de resultado

## Reglas y comportamiento
- Fecha y hora se inicializan automáticamente.
- Al cambiar ciudad se limpia selección de tanque.
- Conversión de numéricos al enviar (`Number(...)`).
- Validación requerida en los campos críticos de carga.

## Integración de datos
- Tabla destino: `TanqueMovimiento`.
- Campos de negocio:
  - `TipoMovimiento = "E"`
  - `FechaHoraMovimiento` se construye en hora local (`YYYY-MM-DD HH:mm:ss`).
- El formulario soporta remisión/proveedor específicos de entradas.

## UX
- Estructura por tarjetas: datos del tanque + datos de carga.
- Botón limpiar restablece valores y defaults.
- Indicador visual de envío en botón guardar.
