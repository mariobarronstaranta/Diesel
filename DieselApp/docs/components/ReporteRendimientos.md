# ReporteRendimientos

**Ubicación**: `src/components/ReporteRendimientos.tsx`

## Descripción

El componente `ReporteRendimientos` muestra los consumos de diésel acumulados en un rango de fechas, relacionando los litros consumidos con el horómetro y el odómetro de cada unidad. Solo considera movimientos de tipo salida (`TipoMovimiento = 'S'`).

El resultado está agrupado por **Tanque + Unidad**, mostrando totales acumulados del rango completo (sin desglose por día).

## Filtros

| Filtro            | Tipo                                               | Obligatorio |
| :---------------- | :------------------------------------------------- | :---------- |
| **Ciudad**        | Combo (`ComboCveCiudad`)                           | No          |
| **Tanque**        | Combo (`ComboTanquePorCiudad`) — depende de Ciudad | No          |
| **Fecha Inicial** | Date                                               | Sí          |
| **Fecha Final**   | Date                                               | Sí          |

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

## Función RPC (Supabase)

**Nombre**: `public.reporte_rendimientos`  
**Script**: `docs/Scripts/Rendimientos.sql`

```sql
reporte_rendimientos(
    p_fecha_inicio date,        -- Obligatorio
    p_fecha_fin    date,        -- Obligatorio
    p_cve_ciudad   text DEFAULT NULL,
    p_id_tanque    bigint DEFAULT NULL
)
```

Llamada desde el frontend:

```ts
await supabase.rpc("reporte_rendimientos", {
  p_fecha_inicio: data.FechaInicial,
  p_fecha_fin: data.FechaFinal,
  p_cve_ciudad: data.CveCiudad || null,
  p_id_tanque: data.IDTanque ? parseInt(data.IDTanque) : null,
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

- `TanqueMovimiento` — movimientos de salida (filtro `TipoMovimiento = 'S'`), edición inline de 4 campos
- `Tanque` — nombre del tanque (`TanqueMovimiento.IdTanque = Tanque.IDTanque`)
- `Unidades` — clave de unidad (`TanqueMovimiento.IdUnidad = Unidades.IDUnidad`)

## Dependencias

- `ComboCveCiudad`
- `ComboTanquePorCiudad`
- `ReporteRendimientosDetalleModal`
- `src/types/reportes.types.ts` → `ReporteRendimientosData`, `ReporteRendimientosForm`, `RendimientoDetalleItem`

## Integración

| Elemento | Valor                                                                      |
| :------- | :------------------------------------------------------------------------- |
| Ruta     | `/reportes/rendimiento`                                                    |
| Menú     | Reportes → Rendimiento (`TopNav.tsx`)                                      |
| App.tsx  | `<Route path="/reportes/rendimiento" element={<ReporteRendimientos />} />` |

## Historial de Cambios

| Fecha      | Cambio                                                                                                       |
| :--------- | :----------------------------------------------------------------------------------------------------------- |
| 2026-02-19 | Creación inicial: SQL, tipos, componente, rutas y menú.                                                      |
| 2026-02-19 | Se eliminó la columna **Fecha** del resultado para mostrar totales acumulados.                               |
| 2026-02-24 | Edición inline en modal de detalle: Litros, CuentaLitros, Horómetro, Odómetro con update a TanqueMovimiento. |
