# Implementación Visual: Reporte de Detalle de Consumos

Este plan detalla los pasos para implementar la interfaz visual del modal de detalle de consumos, permitiendo al cliente visualizar la estructura de datos propuesta antes de la integración con el backend.

## Proposed Changes

### Documentation

#### [MODIFY] [ReporteConsumosDetalle.md](file:///c:/Users/85233588/Documents/Diesel/DieselApp/docs/Backlog/ReporteConsumosDetalle.md)
*   Refinar el contenido para que sea una especificación técnica formal.
*   Incluir secciones de descripción, objetivos y estructura de tablas.

### Frontend

#### [NEW] [ReporteConsumosDetalleModal.tsx](file:///c:/Users/85233588/Documents/Diesel/DieselApp/src/components/ReporteConsumosDetalleModal.tsx)
*   Crear un componente de modal de React-Bootstrap.
*   Implementar dos pestañas o secciones: "Entradas" y "Salidas".
*   Llenar las tablas con datos mock representativos.
*   Incluir el botón de "Exportar CSV" en la tabla de salidas como se solicitó.

#### [MODIFY] [ReporteConsumos.tsx](file:///c:/Users/85233588/Documents/Diesel/DieselApp/src/components/ReporteConsumos.tsx)
*   Importar el nuevo componente `ReporteConsumosDetalleModal`.
*   Gestionar el estado para abrir/cerrar el modal.
*   Sustituir el texto "(Fase 2)" por un botón "Ver Detalle" que dispare el modal.

## Verification Plan

### Manual Verification
1.  Navegar a la ruta de Reporte de Consumos.
2.  Realizar una consulta (se pueden usar los filtros actuales).
3.  Hacer clic en el botón "Ver Detalle" de cualquier fila.
4.  Verificar que el modal se abra correctamente y muestre los datos mock en ambas tablas (Entradas y Salidas).
5.  Verificar que el diseño sea consistente con el resto de la aplicación.
