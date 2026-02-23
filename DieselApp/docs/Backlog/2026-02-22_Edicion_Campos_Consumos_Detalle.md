# Bitácora: Edición de Campos en Detalle de Consumos (Salidas)

## Objetivo
Permitir que los campos de Litros, CuentaLitros, Horómetro y Odómetro sean editables en el reporte **Modal de Detalle de Consumos** (pestaña Salidas). Se identificó la necesidad de corregir valores capturados erróneamente por los usuarios.

## Cambios Realizados

### 1. Actualización en Base de Datos (Supabase)

#### Función: `get_salidas_detalle`
Se modificó el script SQL (`docs/scripts/get_salidas_detalle.sql`) y se ejecutó en Supabase para que la consulta devuelva la columna `id_tanque_movimiento`.

**Por qué:** Para poder realizar un `UPDATE` directo a la base de datos desde el cliente de Supabase en React, necesitamos la llave primaria (`IdTanqueMovimiento`) que permita identificar qué renglón modificar sin afectar a otros.

**Nuevas líneas agregadas:**
```sql
DROP FUNCTION IF EXISTS get_salidas_detalle(DATE, VARCHAR, BIGINT);

CREATE OR REPLACE FUNCTION get_salidas_detalle(...)
RETURNS TABLE (
    id_tanque_movimiento BIGINT, -- Se agregó el ID retornado
    ...
)
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tm."IdTanqueMovimiento" AS id_tanque_movimiento, -- Se mapeó del Select
        ...
```

### 2. Modificación del Componente React Frontend

#### Archivo: `src/components/ReporteConsumosDetalleModal.tsx`

1. **Estado de Edición:**
   Se agregaron los estados necesarios para manejar la interacción de edición del renglón sin afectar al resto de la tabla:
   - `editingId`: Guarda el `id_tanque_movimiento` del renglón seleccionado.
   - `editForm`: Objeto que conserva temporalmente los valores de *litros, cuenta_litros, horometro y odometro* que el usuario está tecleando.
   - `isUpdating`: Booleano para inhabilitar botones y mostrar un _Spinner_ durante la carga a Supabase para evitar doble envíos.

2. **Funciones Manejadoras:**
   - **`handleEditStart`**: Valida que exista el ID. Si el ID falta (por no haber actualizado la función SQL en base de datos), bloquea la ejecución con un alert. De lo contrario, pone la tabla en modo edición.
   - **`handleUpdate`**: Válida que los campos numéricos existan, realiza un `supabase.from('TanqueMovimiento').update({...}).eq('IdTanqueMovimiento', id)`, y luego manda ejecutar `cargarSalidas()` para refrescar la tabla y quitar el modo de edición de inmediato, ofreciendo un flujo rápido (sin dialogos de confirmación extra).

3. **Modificaciones Visuales (UI):**
   - Se homologaron los encabezados de la tabla (*"CuentaLitros"* a *"Cuenta Litros"*).
   - Se renderizó dinámicamente el contenido de las celdas: si el `editingId` coincide con el del renglón, se incrustan `<Form.Control type="number">` en vez del texto plano.
   - Se agregó la nueva columna final **"Acción"** que despliega el botón de _Editar_, y cuando se está editando cambia por botones de _Ok_ (Guardar) y _X_ (Cancelar).

## Estado de Implementación
- ✓ SQL Función `get_salidas_detalle` modificada.
- ✓ Base de Datos (Supabase) actualizada por el cliente.
- ✓ Componente `ReporteConsumosDetalleModal` soporta la edición fluida (sin doble confirmación) de 4 campos clave.
- ✓ Proyecto compila sin errores a nivel TypeScript (`npm run build`).

## Recomendaciones
- Si se busca implementar la edición para la pestaña de **Entradas**, se deberá hacer el mismo flujo: actualizar la función correspondiente `get_entradas_detalle` en base de datos para recuperar su ID, agregar el estado para Entradas y replicar la lógica de `<Form.Control>` en esa segunda tabla.
