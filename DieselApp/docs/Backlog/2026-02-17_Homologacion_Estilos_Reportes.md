# Bitácora: Homologación de Estilos en Reportes (Final)

Se completó la homologación total de estilos en la aplicación, incluyendo tablas, botones y ventanas modales de ambos reportes principales.

## Cambios Realizados

#### [MODIFY] [ReporteLecturas.tsx](file:///c:/Users/85233588/Documents/Diesel/DieselApp/src/components/ReporteLecturas.tsx)
- **Tabla Principal**: Botón "Detalle" homologado a `variant="outline-primary"`.
- **Modal**: Botones "Editar" y "Eliminar" homologados a estilos de botón con borde.

#### [MODIFY] [ReporteConsumos.tsx](file:///c:/Users/85233588/Documents/Diesel/DieselApp/src/components/ReporteConsumos.tsx)
- **Tabla Principal**: Botón "Detalle" (antes "Ver Detalle") homologado a `variant="outline-primary"`.

#### [MODIFY] [ReporteConsumosDetalleModal.tsx](file:///c:/Users/85233588/Documents/Diesel/DieselApp/src/components/ReporteConsumosDetalleModal.tsx)
- **Tablas**: Se cambió el encabezado a color gris `#6c757d` con texto blanco para coincidir con el reporte de lecturas.
- **Botón Exportar**: Se cambió a `variant="success"` y se actualizó el texto a **"Exportar CSV"** para una homologación total.
- **Tabs Personalizados**: Se implementaron estilos para que cada pestaña tenga una identidad visual:
    - **Salidas**: Color azul y fondo celeste suave al estar activa. Encabezado centrado, en color negro y negrita: **"Movimiento de Salidas de Combustible"**.
    - **Entradas**: Color naranja y fondo crema suave al estar activa. Encabezado centrado, en color negro y negrita: **"Movimiento de Entras de Combustibles a Tanques"**.
    - Se mejoró el indicador de pestaña activa con un borde inferior más marcado.
- **Efectos**: Se añadió el efecto de desenfoque (`backdrop-filter: blur(5px)`) al fondo del modal.
- **Fuentes**: Se estandarizó el uso de `font-monospace` para valores numéricos y se centraron las columnas de tipo fecha/hora.
- **Layout**: Se ajustó el padding del cuerpo del modal y el estilo del footer (`bg-light`).

## Verificación
- Las ventanas modales de ambos reportes ahora son visualmente idénticas en estructura, colores y tipografía.
