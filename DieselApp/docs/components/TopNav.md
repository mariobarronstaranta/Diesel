# TopNav

## Propósito
Barra superior de navegación principal de la aplicación DieselApp.

## Firma del Componente
```typescript
function TopNav(): JSX.Element
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
  - `/reportes/lecturas`
  - `#/consumos` (placeholder/hash route)

## Comportamiento
- Usa clase activa automática de `NavLink` para resaltar ruta actual.
- Mantiene marca visual de producto (`DieselApp`) y grupo de acciones en cabecera.

## CSS Classes
- `top-nav` - Contenedor principal del header
- `top-nav__brand` - Marca de la aplicación
- `top-nav__links` - Contenedor de navegación
- `top-nav__link` - Enlaces de navegación
- `top-nav__link--active` - Estado activo del enlace (aplicado automáticamente por NavLink)
- `top-nav__action` - Botones de acción (dropdown toggle)

## Estructura Visual
```
┌─────────────────────────────────────────────────────────┐
│ DieselApp  │  Inicio  Lecturas  Entradas  Salidas  ▾Reportes │
└─────────────────────────────────────────────────────────┘
```

## Accesibilidad
- Incluye `aria-label="Main"` en el elemento `<nav>` para identificación de lectores de pantalla

## Ejemplo de uso
```tsx
import TopNav from './components/TopNav';

function App() {
  return (
    <>
      <TopNav />
      <main>
        {/* Contenido de la aplicación */}
      </main>
    </>
  );
}
```

## Notas técnicas
- El componente usa una función de renderizado dinámico para las clases CSS de `NavLink`, aplicando `top-nav__link--active` basado en el estado `isActive` proporcionado por React Router
- El dropdown de Reportes mezcla `NavLink` (para navegación SPA) y enlaces hash tradicionales
