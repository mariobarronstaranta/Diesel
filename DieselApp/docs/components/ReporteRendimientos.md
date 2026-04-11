# ReporteRendimientos

**Ubicación**: `src/components/ReporteRendimientos.tsx`

## Descripción

El componente `ReporteRendimientos` muestra los consumos de diésel acumulados en un rango de fechas, relacionando los litros consumidos con el horómetro y el odómetro de cada unidad. Solo considera movimientos de tipo salida (`TipoMovimiento = 'S'`).

El resultado está agrupado por **Tanque + Unidad**, mostrando totales acumulados del rango completo (sin desglose por día).

## Filtros

| Filtro            | Tipo                                                             | Obligatorio |
| :---------------- | :--------------------------------------------------------------- | :---------- |
| **Ciudad**        | Combo (`ComboCveCiudad`)                                         | Sí          |
| **Tanque**        | Combo (`ComboTanquePorCiudad`, `optional`) — depende de Ciudad   | No          |
| **Unidad**        | Combo (`ComboUnidades`, `optional`) — depende de Ciudad y Tanque | No          |
| **Fecha Inicial** | Date                                                             | Sí          |
| **Fecha Final**   | Date                                                             | Sí          |

### Comportamiento en cascada de los combos

1. **Ciudad** es obligatoria. Habilita Tanque y Unidad.
2. Al cambiar **Ciudad** → se resetean automáticamente `IDTanque` e `IDUnidad`.
3. Al cambiar **Tanque** → se resetea automáticamente `IDUnidad`.
4. **Tanque = (Todos)** → Combo Unidad muestra todas las unidades con movimientos en la ciudad (vía `TanqueMovimiento.CveCiudad`).
5. **Tanque específico** → Combo Unidad muestra solo las unidades con movimientos en ese tanque (vía `TanqueMovimiento.IdTanque`).

> **Criterio unificado de Unidades**: En ambos modos el combo consulta `TanqueMovimiento` como fuente, no el catálogo `Unidades` directamente. Garantiza que solo aparezcan unidades con movimientos reales registrados.

## Datos de Salida

| Columna            | Descripción                                             |
| :----------------- | :------------------------------------------------------ |
| **Tanque**         | `Tanque.Nombre`                                         |
| **Unidad**         | `IDClaveUnidad(ClaveAlterna)` de la tabla `Unidades`    |
| **Carga Total**    | `SUM(LitrosCarga)` de los movimientos de salida         |
| **Kms Recorridos** | `MAX(Odometro) - MIN(Odometro)`                         |
| **Hrs Recorridos** | `MAX(Horimetro) - MIN(Horimetro)`                       |
| **Kms/Lts**        | `Kms Recorridos / Carga Total` (protegido con `NULLIF`) |
| **Hrs/Lts**        | `Hrs Recorridos / Carga Total` (protegido con `NULLIF`) |

## Exportación

- **CSV** con el total de filas del resultado.
- **PDF** con formato corporativo, encabezado, filtros activos, tabla del reporte y fila de totales agregados del periodo.

## Función RPC (Supabase)

**Nombre**: `public.reporte_rendimientos`  
**Script**: `docs/Scripts/Rendimientos.sql`

```sql
reporte_rendimientos(
    p_fecha_inicio date,        -- Obligatorio
    p_fecha_fin    date,        -- Obligatorio
    p_cve_ciudad   text    DEFAULT NULL,
    p_id_tanque    bigint  DEFAULT NULL,
    p_id_unidad    bigint  DEFAULT NULL   -- Nuevo (2026-03-11)
)
```

Llamada desde el frontend:

```ts
await supabase.rpc("reporte_rendimientos", {
  p_fecha_inicio: data.FechaInicial,
  p_fecha_fin: data.FechaFinal,
  p_cve_ciudad: data.CveCiudad || null,
  p_id_tanque: data.IDTanque ? parseInt(data.IDTanque) : null,
  p_id_unidad: data.IDUnidad ? parseInt(data.IDUnidad) : null,
});
```

## Modal de Detalle

**Componente**: `ReporteRendimientosDetalleModal.tsx`  
**Función RPC**: `get_rendimientos_detalle`

Al hacer clic en **Detalle** en una fila del reporte, se abre un modal con los movimientos individuales de salida de combustible para esa combinación Tanque/Unidad.

### Columnas del Detalle

| Columna           | Editable | Descripción                                |
| :---------------- | :------: | :----------------------------------------- |
| ID Movimiento     |    No    | `IdTanqueMovimiento` (PK)                  |
| Fecha             |    No    | Fecha del movimiento                       |
| Hora              |    No    | Hora del movimiento                        |
| **Litros**        |  **Sí**  | `LitrosCarga` en tabla `TanqueMovimiento`  |
| **Cuenta Litros** |  **Sí**  | `CuentaLitros` en tabla `TanqueMovimiento` |
| **Horómetro**     |  **Sí**  | `Horimetro` en tabla `TanqueMovimiento`    |
| **Odómetro**      |  **Sí**  | `Odometro` en tabla `TanqueMovimiento`     |
| Acción            |    —     | Botones: Editar / Ok / X                   |

### Flujo de Edición

1. Clic en **Editar** → los 4 campos se convierten en `<Form.Control type="number">`
2. Clic en **Ok** → `supabase.from("TanqueMovimiento").update({...}).eq("IdTanqueMovimiento", id)`
3. Clic en **X** → cancela sin guardar
4. Solo una fila editable a la vez

> Mismo patrón implementado en `ReporteConsumosDetalleModal.tsx`.

## Tablas Involucradas

- `TanqueMovimiento` — movimientos de salida (filtro `TipoMovimiento = 'S'`), edición inline, fuente para lookup de unidades
- `Tanque` — nombre del tanque
- `Unidades` — detalle de unidad (IDClaveUnidad, ClaveAlterna)

## Dependencias

- `ComboCveCiudad`
- `ComboTanquePorCiudad` (con `optional={true}`)
- `ComboUnidades` (con `optional={true}` y prop `idTanque`)
- `ReporteRendimientosDetalleModal`
- `src/types/reportes.types.ts` → `ReporteRendimientosData`, `ReporteRendimientosForm`, `RendimientoDetalleItem`

## Integración

| Elemento | Valor                                                                      |
| :------- | :------------------------------------------------------------------------- |
| Ruta     | `/reportes/rendimiento`                                                    |
| Menú     | Reportes → Rendimiento (`TopNav.tsx`)                                      |
| App.tsx  | `<Route path="/reportes/rendimiento" element={<ReporteRendimientos />} />` |

## Historial de Cambios

| Fecha      | Cambio                                                                                                        |
| :--------- | :------------------------------------------------------------------------------------------------------------ |
| 2026-02-19 | Creación inicial: SQL, tipos, componente, rutas y menú.                                                       |
| 2026-02-19 | Se eliminó la columna **Fecha** del resultado para mostrar totales acumulados.                                |
| 2026-02-24 | Edición inline en modal de detalle: Litros, CuentaLitros, Horómetro, Odómetro con update a TanqueMovimiento.  |
| 2026-03-11 | Combo **Tanque** pasa a ser opcional (wildcard Todos). **Ciudad** pasa a ser obligatorio.                     |
| 2026-03-11 | Nuevo combo **Unidad** opcional con cascada desde Tanque. Reseteo automático en cascada al cambiar selección. |
| 2026-03-11 | Fuente de unidades unificada a `TanqueMovimiento` en ambos modos (Todos/específico).                          |
| 2026-03-11 | RPC `reporte_rendimientos` recibe nuevo parámetro `p_id_unidad bigint DEFAULT NULL`.                          |
| 2026-03-11 | Validación `required` agregada a Fecha Inicial y Fecha Final para evitar llamadas al API sin fechas.          |
