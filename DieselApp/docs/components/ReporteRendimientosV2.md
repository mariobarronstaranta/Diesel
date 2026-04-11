# ReporteRendimientosV2

**Ubicación**: `src/components/ReporteRendimientosV2.tsx`

## Descripción

El componente `ReporteRendimientosV2` introduce un cálculo consolidado de rendimiento por unidad para resolver el caso donde una misma unidad carga combustible en múltiples tanques dentro del mismo periodo.

La versión actual en producción (`ReporteRendimientos`) sigue agrupando por **Tanque + Unidad**. Esta versión nueva agrupa por **Unidad**, de forma que el KPI principal no se fracture por la fuente de abastecimiento.

## Regla funcional principal

- El rendimiento se calcula con **todas las cargas de la unidad** dentro del rango consultado.
- El filtro **Tanque** no recorta el KPI; sirve para ubicar unidades que hayan cargado en ese tanque durante el periodo.
- El reporte muestra además el **Tanque Principal** y los **Tanques Utilizados** por unidad.

## Filtros

| Filtro            | Tipo                                     | Obligatorio |
| :---------------- | :--------------------------------------- | :---------- |
| **Ciudad**        | Combo (`ComboCveCiudad`)                 | Sí          |
| **Tanque**        | Combo (`ComboTanquePorCiudad`, opcional) | No          |
| **Unidad**        | Combo (`ComboUnidades`, opcional)        | No          |
| **Fecha Inicial** | Date                                     | Sí          |
| **Fecha Final**   | Date                                     | Sí          |

## Datos de salida

| Columna                | Descripción                                            |
| :--------------------- | :----------------------------------------------------- |
| **Unidad**             | Unidad consolidada                                     |
| **Carga Total**        | Suma de litros de salida de la unidad en el periodo    |
| **Kms Recorridos**     | `MAX(Odometro) - MIN(Odometro)` sobre toda la unidad   |
| **Hrs Recorridos**     | `MAX(Horimetro) - MIN(Horimetro)` sobre toda la unidad |
| **Kms/Lts**            | `Kms Recorridos / Carga Total`                         |
| **Hrs/Lts**            | `Hrs Recorridos / Carga Total`                         |
| **Tanque Principal**   | Tanque con mayor volumen surtido a esa unidad          |
| **Tanques Utilizados** | Lista agregada de tanques donde cargó                  |

## RPCs utilizados

- `public.reporte_rendimientos_v2`
- `public.get_rendimientos_detalle_v2`

**Script**: `docs/Scripts/Rendimientos_v2.sql`

## Modal de detalle

**Componente**: `ReporteRendimientosDetalleModalV2.tsx`

El detalle muestra todos los movimientos de salida de la unidad dentro del periodo, incluyendo columna de **Tanque**, porque el KPI consolidado puede combinar varias fuentes de carga.

## Exportación

- **CSV** del resultado consolidado.
- **PDF** con formato corporativo, filtros activos y fila final de totales agregados del periodo.

## Integración

| Elemento          | Valor                                        |
| :---------------- | :------------------------------------------- |
| Ruta              | `/reportes/rendimiento-consolidado`          |
| Menú              | Reportes → Rendimiento Consolidado           |
| Estado productivo | Paralelo al reporte actual, sin reemplazarlo |
