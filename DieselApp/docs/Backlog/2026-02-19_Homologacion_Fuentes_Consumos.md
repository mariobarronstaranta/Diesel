# Bitácora: Homologación de Fuentes en Reporte de Consumos

Se detectó y corrigió una inconsistencia en el tipo de letra utilizado para mostrar el detalle de los consumos.

## Cambios Realizados

#### [MODIFY] [ReporteConsumosDetalleModal.tsx](file:///Users/user/Documents/Learning/Diesel/DieselApp/src/components/ReporteConsumosDetalleModal.tsx)

- **Eliminación de font-monospace**: Se removió la clase CSS `font-monospace` de las celdas `<td>` que mostraban valores numéricos (Litros, CuentaLitros, Horómetro, Odómetro).
- **Justificación**: Homologar el diseño con el modal del **Reporte de Lecturas**, el cual utiliza la fuente tipográfica estándar del sistema definida en `index.css`.
- **Estandarización**: Esto asegura que todos los reportes presenten la información de manera coherente, sin variaciones de estilo entre diferentes módulos.

## Verificación

- Se comparó el modal de `ReporteConsumosDetalleModal.tsx` con el de `ReporteLecturas.tsx`.
- Ambos modales ahora utilizan la misma fuente para la información del detalle de la tabla.
- Se verificó que la legibilidad se mantiene óptima sin el uso de fuente monoespaciada.
