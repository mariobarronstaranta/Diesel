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

## Tablas Involucradas

- `TanqueMovimiento` — movimientos de salida (filtro `TipoMovimiento = 'S'`)
- `Tanque` — nombre del tanque (`TanqueMovimiento.IdTanque = Tanque.IDTanque`)
- `Unidades` — clave de unidad (`TanqueMovimiento.IdUnidad = Unidades.IDUnidad`)

## Dependencias

- `ComboCveCiudad`
- `ComboTanquePorCiudad`
- `src/types/reportes.types.ts` → `ReporteRendimientosData`, `ReporteRendimientosForm`

## Integración

| Elemento | Valor                                                                      |
| :------- | :------------------------------------------------------------------------- |
| Ruta     | `/reportes/rendimiento`                                                    |
| Menú     | Reportes → Rendimiento (`TopNav.tsx`)                                      |
| App.tsx  | `<Route path="/reportes/rendimiento" element={<ReporteRendimientos />} />` |

## Historial de Cambios

| Fecha      | Cambio                                                                         |
| :--------- | :----------------------------------------------------------------------------- |
| 2026-02-19 | Creación inicial: SQL, tipos, componente, rutas y menú.                        |
| 2026-02-19 | Se eliminó la columna **Fecha** del resultado para mostrar totales acumulados. |
