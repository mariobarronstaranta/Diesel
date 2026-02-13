# CapturaLecturas

## Propósito
Formulario principal para registrar lecturas diarias de tanques (`TanqueLecturas`).

## Dependencias
- `react`, `react-bootstrap`
- `react-hook-form`
- Componentes internos: `ComboCiudad`, `ComboPlanta`, `ComboTanque`
- `supabase` client local

## Modelo de formulario
Campos controlados:
- `IDCiudad`, `IDPlanta`, `IDTanque`
- `Fecha`, `Hora`
- `Temperatura`, `AlturaCms`, `CuentaLitros`

## Estado interno
- `isLoading`: estado de envío
- `alertMessage`: mensaje global (`success`/`danger`)

## Reglas y validaciones
- Fecha obligatoria, con rango: hoy y hasta 2 días hacia atrás.
- Hora obligatoria.
- Temperatura obligatoria.
- Altura obligatoria y mayor a 0.
- Cuenta litros obligatoria y mayor o igual a 0.

## Lógica de dependencias entre combos
- Al cambiar ciudad, limpia `IDPlanta` e `IDTanque`.
- Al cambiar planta, limpia `IDTanque`.

## Integración de datos
- Inserta en tabla `TanqueLecturas`.
- Conversión de tipos string → number antes de persistir.
- Ajusta hora a formato `HH:MM:SS`.
- Envío define `VolActualTA` y `VolActual15C` en `0` e incluye metadata de registro.

## UX
- Inicializa fecha/hora por defecto al montar.
- Botón para limpiar formulario y restablecer defaults.
- Mensajes de éxito/error con `Alert` descartable.
