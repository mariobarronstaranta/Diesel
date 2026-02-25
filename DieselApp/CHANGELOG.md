# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/).

> **Nota:** Para mayor detalle de cada jornada de trabajo (incluyendo justificación de actividades), consultar los archivos en [`docs/Bitacora/`](./docs/Bitacora/).

---

## [Unreleased]

### Added

- Nuevo reporte **Rendimiento** (`/reportes/rendimiento`) con cálculos acumulados de Kms/Lts y Hrs/Lts por unidad.
- Función RPC `public.reporte_rendimientos` en Supabase (script: `docs/Scripts/Rendimientos.sql`). ⏳ Pendiente ejecutar en producción.
- Entrada **Rendimiento** en el menú desplegable de Reportes (`TopNav.tsx`).
- Tipos TypeScript `ReporteRendimientosData` y `ReporteRendimientosForm` en `reportes.types.ts`.
- Documentación técnica del componente en `docs/components/ReporteRendimientos.md`.
- **Edición inline en modal de detalle de Rendimientos** (`ReporteRendimientosDetalleModal.tsx`): campos Litros, CuentaLitros, Horómetro y Odómetro editables con update directo a `TanqueMovimiento`.

### Changed

- Homologación de tipografía en `ReporteConsumosDetalleModal.tsx`: eliminación de clase `font-monospace` en tablas de Salidas y Entradas.
- **Dashboard movido** de link directo en TopNav al dropdown de **Reportes** como primer item, con separador visual (`TopNav.tsx`).

---

## [0.5.0] - 2026-02-18

### Added

- Menú hamburguesa responsivo en `TopNav.tsx` con drawer lateral y overlay de cierre.
- Variables CSS corporativas `--corporate-yellow` (#f0ad4e) y `--corporate-dark` en `index.css`.
- Clase `.table-corporate` con encabezados oscuros y texto blanco.

### Changed

- Estandarización global de botones: acciones principales → amarillo corporativo, secundarias → gris neutro, de lista → outline corporativo.
- Estilo de `Card.Header` unificado con fondo oscuro en todos los módulos.
- Módulos actualizados: `App.css`, `CapturaLecturas.tsx`, `ReporteLecturas.tsx`, `EntradasDiesel.tsx`, `SalidasDiesel.tsx`, `ReporteConsumos.tsx`, `ReporteConsumosDetalleModal.tsx`.

---

## [0.4.0] - 2026-02-17

### Added

- Función RPC Supabase `get_salidas_detalle`: detalle de movimientos de salida por fecha/ciudad/tanque (script: `docs/Scripts/get_salidas_detalle.sql`).
- Función RPC Supabase `get_entradas_detalle`: detalle de movimientos de entrada por fecha/ciudad/tanque (script: `docs/Scripts/get_entradas_detalle.sql`).
- Logo corporativo en `TopNav.tsx` (`src/assets/images/logo.png`, 55x43 px).
- Exportación CSV funcional en ambas pestañas del modal de detalle de consumos.
- Estados de carga (spinner), error (alert rojo) y sin datos (alert azul) en `ReporteConsumosDetalleModal.tsx`.
- Pestañas con colores distintivos: Salidas → azul (#0d6efd), Entradas → naranja (#fd7e14).
- Documentación técnica de `ReporteConsumos.md` en `docs/components/`.

### Changed

- `ReporteConsumosDetalleModal.tsx`: datos mock reemplazados por datos reales de Supabase en ambas pestañas.
- `ReporteConsumos.tsx`: estado `filaSeleccionada` extendido con `idTanque`.
- Colores de encabezados de tabla en modal de detalle cambiados a gris (#6c757d) con texto blanco.
- Botón "Detalle" cambiado a `variant="outline-primary"`.

### Fixed

- **Bug crítico:** Error `date/time field value out of range` al enviar fecha formateada (dd/MM/yyyy) a PostgreSQL. Solución: pasar siempre en formato ISO (yyyy-MM-dd) y formatear solo para display.

---

## [0.3.0] - 2026-02-16

### Added

- Documentación técnica de componentes recuperada desde `origin/main`: `CapturaLecturas.md`, `Login.md`, `ReporteLecturas.md`, `EntradasDiesel.md`, `SalidasDiesel.md`, `TopNav.md`, combos (8 archivos).

### Fixed

- Restauración del repositorio a commit estable `3a3b340` tras corrupción por eliminación de `TopNav.tsx` en commits posteriores.
- Rama de respaldo creada: `backup/stable-2026-02-16`.

---

## [0.2.0] - 2026-02-12

### Added

- Reporte de Lecturas diario (`/reportes/lecturas`) con `ReporteLecturas.tsx`.

---

## [0.1.0] - Inicial

### Added

- Módulo de Captura de Lecturas (`CapturaLecturas.tsx`).
- Módulo Entradas de Diesel (`EntradasDiesel.tsx`).
- Módulo Salidas de Diesel (`SalidasDiesel.tsx`).
- Autenticación con Supabase (`Login.tsx`).
- Navegación principal (`TopNav.tsx`).
- Reporte de Consumos (`ReporteConsumos.tsx`) con modal de detalle (`ReporteConsumosDetalleModal.tsx`).
