# ReporteRendimientosV2

**Ubicación**: `src/components/ReporteRendimientosV2.tsx`

## Descripción

El componente `ReporteRendimientosV2` introduce un cálculo consolidado de rendimiento por unidad para resolver el caso donde una misma unidad carga combustible en múltiples tanques dentro del mismo periodo.

La versión actual en producción (`ReporteRendimientos`) sigue agrupando por **Tanque + Unidad**. Esta versión nueva agrupa por **Unidad**, de forma que el KPI principal no se fracture por la fuente de abastecimiento.

## Regla funcional principal

- El rendimiento se calcula con **todas las cargas de la unidad** dentro del rango consultado.
- El filtro **Tanque** no recorta el KPI; sirve para ubicar unidades que hayan cargado en ese tanque durante el periodo.
- El reporte muestra además el **Tanque Principal** y los **Tanques Utilizados** por unidad.

## Reglas de negocio detalladas

1. La unidad es el eje del consolidado; el tanque deja de ser la llave principal del renglón.
2. Si se selecciona un tanque, solo se usa para encontrar qué unidades participaron allí dentro del rango.
3. Una vez definidas esas unidades, el cálculo final usa todas sus salidas del periodo, aunque provengan de otros tanques.
4. `Kms Recorridos` y `Hrs Recorridos` ya no se calculan con `MAX - MIN` del periodo.
5. El nuevo cálculo suma, por cada salida del rango, el delta contra la salida inmediata anterior de la misma unidad.
6. Si no existe salida previa válida, el movimiento aporta `0` al acumulado de kms/hrs.
7. `Tanque Principal` es el tanque con más litros suministrados a la unidad dentro del universo consolidado.
8. `Tanques Utilizados` concatena todos los tanques distintos usados por la unidad en el rango consolidado.

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
| **Kms Rec.**           | Suma de deltas por movimiento: `Odometro actual - Odometro de la salida inmediata anterior` |
| **Hrs Rec.**           | Suma de deltas por movimiento: `Horimetro actual - Horimetro de la salida inmediata anterior` |
| **Km/Lt**              | `Kms Rec. / Carga Total`                               |
| **Hr/Lt**              | `Hrs Rec. / Carga Total`                               |
| **Lt/Hr**              | `Carga Total / Hrs Rec.`                               |
| **Tanque Principal**   | Tanque con mayor volumen surtido a esa unidad          |
| **Tanques Utilizados** | Lista agregada de tanques donde cargó                  |

## Resumen visible del reporte

Encima de la tabla principal se muestran tres tarjetas de resumen, calculadas sobre todos los renglones visibles del resultado actual:

1. `Total Diesel`: suma de `Carga Total`.
2. `Total Kms`: suma de `Kms Rec.`.
3. `Total Horas`: suma de `Hrs Rec.`.

Estas tarjetas son un resumen ejecutivo de lectura rápida y no sustituyen la tabla por unidad.

Notas de cálculo:

1. Para cada movimiento dentro del rango, la salida inmediata anterior de la unidad se obtiene con la función `public.fn_obtener_valores_previos_salida`.
2. Si el movimiento no tiene anterior válido, su contribución a Kms/Hrs es `0`.
3. El filtro por tanque sigue definiendo unidades objetivo, pero el KPI se consolida con todas las cargas de esas unidades dentro del periodo.
4. La UI no recalcula estas métricas; consume directamente los valores devueltos por `public.reporte_rendimientos_v2` para evitar diferencias entre pantalla y SQL.

## RPCs utilizados

- `public.reporte_rendimientos_v2`
- `public.get_rendimientos_detalle_v2`

**Script**: `docs/Scripts/Rendimientos_v2.sql`

## Modal de detalle

**Componente**: `ReporteRendimientosDetalleModalV2.tsx`

El detalle muestra todos los movimientos de salida de la unidad dentro del periodo, incluyendo columna de **Tanque**, porque el KPI consolidado puede combinar varias fuentes de carga.

Reglas del modal:

1. El modal vuelve a consultar a la BD usando los filtros originales del reporte y el `IDUnidad` del renglón seleccionado.
2. El RPC `public.get_rendimientos_detalle_v2` devuelve por movimiento los valores actuales y también `Odómetro Ant` y `Horometro Ant`.
3. Esas columnas `Ant` son informativas: ayudan a explicar visualmente de dónde sale el delta por movimiento del consolidado.
4. El modal calcula además dos columnas derivadas en frontend:
	- `Dif Odometro = Odómetro - Odómetro Ant`
	- `Dif Horometro = Horómetro - Horometro Ant`
	Si no existe valor anterior, la diferencia se muestra como `-`.
5. En edición inline solo se modifican `Litros`, `Cuenta Litros`, `Odómetro` y `Horómetro` del movimiento actual.
6. Después de editar, el modal recarga el detalle desde la RPC para refrescar también campos derivados o de referencia.

Orden actual de columnas del modal:

| Columna |
| :------ |
| `ID` |
| `Tanque` |
| `Fecha` |
| `Hora` |
| `Litros` |
| `Cuenta Litros` |
| `Odómetro Ant` |
| `Odómetro` |
| `Horometro Ant` |
| `Horómetro` |
| `Dif Odometro` |
| `Dif Horometro` |

Encima de la tabla del modal también se muestran tres tarjetas resumen:

1. `Total Diesel`: suma de `Litros`.
2. `Total Kms`: suma de `Dif Odometro`.
3. `Total Horas`: suma de `Dif Horometro`.

## Exportación

- **CSV** del resultado consolidado.
- **CSV** del modal de detalle con el mismo orden de columnas visible en pantalla.
- **PDF** con formato corporativo, filtros activos y fila final de totales agregados del periodo.
- En el PDF, los indicadores totales (`Km/Lt`, `Hr/Lt`, `Lt/Hr`) se recalculan con totales acumulados y no como promedio simple entre unidades.

## Integración

| Elemento          | Valor                                        |
| :---------------- | :------------------------------------------- |
| Ruta              | `/reportes/rendimiento-consolidado`          |
| Menú              | Reportes → Rendimiento Consolidado           |
| Estado productivo | Activo en menú de reportes                   |
