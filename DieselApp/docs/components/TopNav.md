# TopNav

## Propósito

Barra superior de navegación principal de la aplicación DieselApp.

## Firma del Componente

```typescript
function TopNav(): JSX.Element;
```

Este componente no recibe props.

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
  - `/dashboard` (📊 Dashboard)
  - ─── (separador)
  - `/reportes/lecturas` (Lecturas)
  - `/reportes/consumos` (Consumos)
  - `/reportes/rendimiento` (Rendimiento)

## Comportamiento

- Usa clase activa automática de `NavLink` para resaltar ruta actual.
- Mantiene marca visual de producto (`DieselApp`) y grupo de acciones en cabecera.
- Menú hamburguesa responsivo en móvil con drawer lateral y overlay de cierre.

## CSS Classes

- `top-nav` - Contenedor principal del header
- `top-nav__brand` - Marca de la aplicación
- `top-nav__links` - Contenedor de navegación
- `top-nav__link` - Enlaces de navegación
- `top-nav__link--active` - Estado activo del enlace (aplicado automáticamente por NavLink)
- `top-nav__action` - Botones de acción (dropdown toggle)
- `top-nav__hamburger` / `top-nav__hamburger--open` - Botón hamburguesa (móvil)
- `top-nav__links--open` - Drawer abierto (móvil)
- `top-nav__overlay` - Overlay de cierre (móvil)

## Estructura Visual

```
┌──────────────────────────────────────────────────────┐
│ DieselApp  │  Inicio  Lecturas  Entradas  Salidas  ▾Reportes │
│                                                ├─ 📊 Dashboard │
│                                                ├─────────────── │
│                                                ├─ Lecturas      │
│                                                ├─ Consumos      │
│                                                └─ Rendimiento   │
└──────────────────────────────────────────────────────┘
```

## Accesibilidad

- Incluye `aria-label="Main"` en el elemento `<nav>` para identificación de lectores de pantalla

## Ejemplo de uso

```tsx
import TopNav from "./components/TopNav";

function App() {
  return (
    <>
      <TopNav />
      <main>{/* Contenido de la aplicación */}</main>
    </>
  );
}
```

## Notas técnicas

- El componente usa una función de renderizado dinámico para las clases CSS de `NavLink`, aplicando `top-nav__link--active` basado en el estado `isActive` proporcionado por React Router
- El dropdown de Reportes usa `NavLink` como componente base via `as={NavLink}` para navegación SPA

## Historial de Cambios

| Fecha      | Cambio                                                                   |
| :--------- | :----------------------------------------------------------------------- |
| 2026-02-18 | Menú hamburguesa responsivo con drawer lateral y overlay.                |
| 2026-02-24 | Dashboard movido de link directo a primer item del dropdown de Reportes. |
