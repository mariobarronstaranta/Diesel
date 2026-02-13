# TopNav

## Propósito
Barra superior de navegación principal de la aplicación DieselApp.

## Dependencias
- `react-router-dom` (`NavLink`)
- `react-bootstrap` (`Dropdown`)

## Rutas y acciones
- Links directos:
  - `/` (Inicio)
  - `/captura` (Lecturas)
  - `/entradas` (Entradas)
  - `/salidas` (Salidas)
- Menú desplegable **Reportes**:
  - `/reportes/lecturas`
  - `#/consumos` (placeholder/hash route)

## Comportamiento
- Usa clase activa automática de `NavLink` para resaltar ruta actual.
- Mantiene marca visual de producto (`DieselApp`) y grupo de acciones en cabecera.
