# DieselApp

Aplicación web interna para control operativo de diésel en patios y plantas de empresas de transporte. Centraliza captura de lecturas, recepción de combustible, salidas por unidad y reportes operativos sobre inventario, consumo, rendimiento y productividad.

## Stack

- React 19
- TypeScript 5.9
- Vite 7
- Bootstrap 5 + react-bootstrap
- react-hook-form
- Supabase

## Funcionalidad principal

- Captura diaria de lecturas físicas de tanque.
- Registro de entradas de combustible.
- Registro de salidas a unidades.
- Reportes de lecturas, consumos, rendimientos y productividad.
- Exportación de reportes en CSV y, en algunos módulos, PDF.

## Estructura relevante

```text
DieselApp/
├── public/
│   └── config.js
├── src/
│   ├── components/
│   ├── shared/
│   ├── supabase/
│   └── types/
├── docs/
│   ├── AI_Context.md
│   ├── Capacitacion/
│   ├── components/
│   └── Scripts/
├── deploy-to-iis.bat
└── vite.config.ts
```

## Requisitos

- Node.js 20 o superior.
- Acceso a las credenciales/configuración de Supabase.
- Archivo de configuración global en `public/config.js`.

## Configuración local

La aplicación expone configuración global desde `public/config.js` mediante `window.AppConfig`.

Ejemplo actual:

```js
window.AppConfig = {
  diasPermitidosHaciaAtrasCaptura: 60,
};
```

Ese valor controla la retroactividad permitida en calendarios de captura de inventario.

## Scripts disponibles

```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

## Documentación del proyecto

- `docs/AI_Context.md`: contexto técnico y funcional consolidado.
- `docs/components/`: documentación técnica por componente.
- `docs/Capacitacion/`: manuales operativos y de capacitación.
- `docs/Scripts/`: scripts SQL/RPC usados por Supabase.

## Despliegue

El proyecto contempla despliegue en IIS mediante `deploy-to-iis.bat`. La aplicación se sirve bajo la base `/dieselapp`.

## Nota de mantenimiento

Cuando se cambie el comportamiento de un componente o una regla de negocio, debe actualizarse también la documentación relacionada en `docs/components/`, `docs/Capacitacion/` y, si aplica, `docs/AI_Context.md`.
