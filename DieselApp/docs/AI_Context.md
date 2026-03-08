# AI_Context.md — Contexto del Proyecto: Control de Diésel

> **Propósito:** Proveer a cualquier flujo de IA (Claude, Gemini, GPT, etc.) el contexto
> técnico, funcional y de negocio suficiente para generar código, consultas SQL, rutas de
> refactorización o documentación **sin fricción ni suposiciones incorrectas**.
> Mantener este archivo actualizado tras cada cambio estructural significativo.

**Última actualización:** 2026-03-08
**Versión:** 1.1

---

## 1. Descripción del Sistema

**Control de Diésel** es una aplicación web interna que permite a empresas de transporte (flotas de camiones revolvedores) gestionar de forma exhaustiva el ciclo completo del combustible:

| Fase                      | Descripción                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| **Recepción (Entradas)**  | Registro de llegada de pipas de proveedores contra factura/remisión física               |
| **Despacho (Salidas)**    | Registro de litros entregados a cada unidad/operador con lectura de odómetro u horómetro |
| **Inventario (Lecturas)** | Corte físico del tanque con regla métrica y cuenta litros                                |
| **Reportería**            | Consumos, Rendimientos (Km/Lt, Hr/Lt), Productividad (M3/Viaje, Lt/M3) y Lecturas        |

El sistema no es un ERP; es un **módulo de trazabilidad y control de combustible** que se alimenta de datos de campo y genera métricas directivas.

---

## 2. Stack Tecnológico

| Capa               | Tecnología                                   | Versión        |
| ------------------ | -------------------------------------------- | -------------- |
| Frontend framework | React                                        | 19.x           |
| Lenguaje           | TypeScript                                   | ~5.9           |
| Bundler            | Vite                                         | 7.x            |
| UI Kit             | Bootstrap + react-bootstrap                  | 5.3.x / 2.10.x |
| Formularios        | react-hook-form                              | 7.x            |
| Selects buscables  | react-select                                 | 5.x            |
| Gráficas           | Recharts                                     | 3.x            |
| Routing            | react-router-dom                             | 7.x            |
| Backend / BaaS     | Supabase (PostgreSQL + PostgREST + Auth)     | 2.x            |
| Despliegue         | IIS (Windows Server) vía `deploy-to-iis.bat` |

**Base URL de la app:** `/dieselapp` (configurada como `basename` en `BrowserRouter`).

---

## 3. Estructura del Proyecto

```
DieselApp/
├── src/
│   ├── App.tsx                    # Router raíz + layout shell
│   ├── auth/
│   │   └── Login.tsx              # Autenticación con Supabase Auth
│   ├── components/                # Componentes de página y modales
│   │   ├── Dashboard.tsx
│   │   ├── CapturaLecturas.tsx
│   │   ├── EntradasDiesel.tsx
│   │   ├── SalidasDiesel.tsx
│   │   ├── ReporteConsumos.tsx
│   │   ├── ReporteConsumosDetalleModal.tsx
│   │   ├── ReporteLecturas.tsx
│   │   ├── ReporteRendimientos.tsx
│   │   ├── ReporteRendimientosDetalleModal.tsx
│   │   ├── ReporteProductividad.tsx
│   │   ├── ReporteProductividadDetalleModal.tsx
│   │   ├── TopNav.tsx
│   │   ├── Combo*.tsx             # Catálogos (Ciudad, Tanque, Planta, Unidad, Operadores, Proveedor)
│   │   └── Combo*Searchable.tsx   # Variantes buscables con react-select
│   ├── config/
│   │   └── supabase.ts            # Cliente Supabase (singleton)
│   ├── shared/
│   │   ├── errors/
│   │   │   └── supabaseErrorHandler.ts   # Convierte PostgrestError → mensaje en español
│   │   ├── hooks/
│   │   │   ├── useComboLoader.ts         # Hook genérico para cargar catálogos
│   │   │   └── useFormAlert.ts           # Manejo de alertas en formularios
│   │   └── types/
│   │       └── errors.types.ts           # AsyncState<T>
│   ├── types/
│   │   ├── reportes.types.ts      # Interfaces de respuesta de RPCs de reportes
│   │   └── dashboard.types.ts
│   └── supabase/                  # (cliente Supabase — ver config/)
├── docs/
│   ├── AI_Context.md              # Este archivo
│   ├── Capacitacion/              # Documentación funcional para usuarios y IA
│   │   └── ControlDiesel-ManualMaestro.md   # Documento maestro consolidado
│   ├── Backlog/                   # Historias de usuario y deuda técnica
│   └── Scripts/                   # DDL/DML de RPCs en Supabase
└── vite.config.ts
```

---

## 4. Rutas de la Aplicación

| Ruta                      | Componente             | Descripción                                |
| ------------------------- | ---------------------- | ------------------------------------------ |
| `/`                       | `Login`                | Pantalla de autenticación                  |
| `/dashboard`              | `Dashboard`            | Resumen ejecutivo con gráficas             |
| `/captura`                | `CapturaLecturas`      | Inventario físico de tanque (Lecturas)     |
| `/entradas`               | `EntradasDiesel`       | Registro de recepción de pipas             |
| `/salidas`                | `SalidasDiesel`        | Registro de despacho a unidades            |
| `/reportes/lecturas`      | `ReporteLecturas`      | Historial de lecturas de inventario        |
| `/reportes/consumos`      | `ReporteConsumos`      | Reporte Entradas vs Salidas por fecha      |
| `/reportes/rendimiento`   | `ReporteRendimientos`  | Métricas Km/Lt y Hr/Lt por unidad          |
| `/reportes/productividad` | `ReporteProductividad` | Cruce diesel + viajes SP (M3/Viaje, Lt/M3) |

---

## 5. Modelo de Datos Principal (Tablas Supabase)

> Los nombres de columnas en Supabase siguen **PascalCase con comillas dobles**.

### 5.1 `TanqueMovimiento` — Tabla central de transacciones

| Columna               | Tipo          | Descripción                                          |
| --------------------- | ------------- | ---------------------------------------------------- |
| `IDTanqueMovimiento`  | bigint PK     | Identificador único del movimiento                   |
| `FechaCarga`          | date          | Fecha operativa del movimiento (campo de negocio)    |
| `FechaHoraMovimiento` | timestamptz   | Timestamp inmutable de inserción (servidor)          |
| `CveCiudad`           | text          | Clave de ciudad (ej. `"MTY"`, `"GDL"`)               |
| `IdTanque`            | bigint FK     | Referencia al tanque                                 |
| `TipoMovimiento`      | char(1)       | `'E'` = Entrada, `'S'` = Salida                      |
| `LitrosCarga`         | numeric(10,2) | Volumen en litros                                    |
| `LecturaCms`          | numeric(8,2)  | Altura en cm (solo Entradas y Lecturas; Salidas = 0) |
| `CuentaLitros`        | numeric       | Lectura del contador físico del surtidor             |
| `Odometro`            | numeric       | Kilometraje del vehículo (solo Salidas)              |
| `Horimetro`           | numeric       | Horómetro del vehículo (solo Salidas)                |
| `IDPersonal`          | bigint FK     | Operador/conductor (solo Salidas)                    |
| `IDUnidad`            | bigint FK     | Vehículo (solo Salidas)                              |
| `IDProveedor`         | bigint FK     | Proveedor de pipa (solo Entradas)                    |
| `Remision`            | text          | Número de remisión/factura del proveedor (Entradas)  |
| `IDUsuarioRegistro`   | uuid FK       | ID del usuario Supabase que creó el registro         |

> ⚠️ **IMPORTANTE:** `TanqueMovimiento` **NO** tiene columna `Activo`. No filtrar por ese campo.

### 5.2 Catálogos

| Tabla       | PK                 | Columnas relevantes                                   |
| ----------- | ------------------ | ----------------------------------------------------- |
| `Tanque`    | `IDTanque`         | `CveCiudad`, `Nombre`                                 |
| `Ciudad`    | `CveCiudad` (text) | `Nombre`                                              |
| `Planta`    | `IDPlanta`         | `CveCiudad`, `Nombre` (solo usado en CapturaLecturas) |
| `Unidad`    | `IDUnidad`         | `CveCiudad`, `NombreUnidad`                           |
| `Personal`  | `IDPersonal`       | `CveCiudad`, `Nombre` (operadores/conductores)        |
| `Proveedor` | `IDProveedor`      | `NombreProveedor`                                     |

### 5.3 Vista Externa: `InformacionGeneral_Cierres`

Vista de sistema de báscula (SP) con datos de viajes/remisiones de camiones revolvedores.

| Columna          | Tipo real                                  | Notas críticas                                                          |
| ---------------- | ------------------------------------------ | ----------------------------------------------------------------------- |
| `IDUnidad`       | bigint (puede ser null)                    | Unidades de báscula no registradas en DieselApp retornan `null`         |
| `FechaInicio`    | **string** texto `M/D/YYYY HH:MM:SS AM/PM` | ⚠️ NO usar `.gte()`/`.lte()` en PostgREST; filtrar **en memoria** en JS |
| `NombreUnidad`   | text                                       |                                                                         |
| `CargaViaje`     | numeric                                    | Metros cúbicos entregados                                               |
| `Remision`       | text                                       |                                                                         |
| `NombreProducto` | text                                       |                                                                         |
| `NombreCliente`  | text                                       |                                                                         |

---

## 6. RPCs en Supabase (Funciones PostgreSQL)

Todas se llaman vía `supabase.rpc('nombre_funcion', { params })`.

| Función RPC                     | Propósito                                     | Parámetros principales                                           |
| ------------------------------- | --------------------------------------------- | ---------------------------------------------------------------- |
| `get_reporte_consumos`          | Totales E/S agrupados por fecha/ciudad/tanque | `p_fecha_inicio`, `p_fecha_fin`, `p_cve_ciudad?`, `p_id_tanque?` |
| `get_entradas_detalle`          | Detalle de movimientos de Entrada             | `p_fecha_inicio`, `p_fecha_fin`, `p_cve_ciudad?`, `p_id_tanque?` |
| `get_salidas_detalle`           | Detalle de movimientos de Salida              | Igual que entradas                                               |
| `get_rendimientos_detalle`      | Detalle de movimientos para rendimiento       | Igual + `p_id_unidad?`                                           |
| `sp_obtener_lecturas_diarias`   | Lecturas de inventario físico                 | `p_fecha`, `p_cve_ciudad?`, `p_id_planta?`, `p_id_tanque?`       |
| `fn_obtener_lecturas_por_fecha` | Lecturas para captura (validación 48 hrs)     | `p_fecha`, `p_id_tanque`                                         |
| `reporte_productividad`         | Cruce SP + TanqueMovimiento por unidad        | `p_fecha_inicio`, `p_fecha_fin`, `p_cve_ciudad?`, `p_id_tanque?` |

> Scripts DDL en: `docs/Scripts/*.sql`

---

## 7. Patrones de Arquitectura Frontend

### 7.1 Shared Layer

```
src/shared/
├── errors/
│   └── supabaseErrorHandler.ts     # handleSupabaseError(error) → string en español
├── hooks/
│   ├── useComboLoader.ts           # Hook genérico para catálogos reactivos
│   └── useFormAlert.ts             # Estado de alertas (success/error) en formularios
└── types/
    └── errors.types.ts             # AsyncState<T> = { data: T[], loading: boolean, error: string | null }
```

**`useComboLoader<T>(queryFn, deps?, enabled?)`:**

- Maneja `loading`, `data[]` y `error` automáticamente.
- Soporta dependencias reactivas (ej. recargar unidades al cambiar ciudad).
- Parámetro `enabled` para carga condicional (ej. esperar a que se seleccione ciudad).
- Nunca silencia errores; los traduce con `handleSupabaseError`.

**`handleSupabaseError(error)`:**

- Mapea códigos PG (`23505`, `23503`, `23502`, `23514`, `42501`, `PGRST301`) a mensajes en español.
- Detecta patrones de texto para RLS, JWT expirado y errores de red.
- Nunca expone detalles técnicos internos al usuario final.

### 7.2 Componentes Combo

Todos los combos siguen el patrón `Combo[Entidad].tsx`:

- Reciben `value`, `onChange`, y parámetros de filtro vía props.
- Usan internamente `useComboLoader`.
- Variantes `*Searchable.tsx` usan `react-select` para búsqueda predictiva.

**Cascada Ciudad → [Tanque | Unidad | Operador | Planta]:**
Cuando cambia `CveCiudad`, los combos dependientes se resetean y recargan. Esta lógica es **obligatoria** para evitar combinaciones inválidas.

### 7.3 Convención de Tipos

- Interfaces de respuesta de RPCs definidas en `src/types/reportes.types.ts`.
- Las interfaces nombran los campos **exactamente como los retorna la RPC** (PascalCase para campos de BD, camelCase para alias definidos en SQL).

---

## 8. Reglas de Negocio Críticas

### 8.1 Tipos de Movimiento

| `TipoMovimiento` | Nombre              | Campos requeridos                       | Campos prohibidos                                 |
| ---------------- | ------------------- | --------------------------------------- | ------------------------------------------------- |
| `'E'`            | Entrada (Recepción) | `IDProveedor`, `Remision`, `LecturaCms` | `IDPersonal`, `IDUnidad`, `Odometro`, `Horimetro` |
| `'S'`            | Salida (Despacho)   | `IDPersonal`, `IDUnidad`                | `IDProveedor`, `Remision`                         |

### 8.2 Validaciones Obligatorias

- **`LecturaCms` en Salidas:** Siempre se registra como `0`. No solicitar ni validar altura en despachos.
- **Lecturas Diarias (Inventario):** `LecturaCms` debe ser > 0. Máximo 48 horas hacia atrás respecto al momento actual.
- **`FechaHoraMovimiento`:** Se genera en el servidor (SQL `NOW()`). El frontend **no** debe enviarla. La `FechaCarga` es la fecha operativa de negocio que sí puede capturar el usuario.
- **Divisiones métricas:** Siempre usar `NULLIF(divisor, 0)` en SQL para proteger contra `÷0`.

### 8.3 Jerarquía Geográfica

```
CveCiudad (raíz)
├── Tanque(s)
├── Unidad(es) → solo en Salidas
├── Personal/Operador(es) → solo en Salidas
└── Planta(s) → solo en CapturaLecturas
```

Al cambiar `CveCiudad` en cualquier formulario, **todos los combos descendientes se limpian y recargan**.

### 8.4 Reporte de Productividad — Casos Especiales

- Unidades con actividad en báscula (SP) pero **no registradas en DieselApp** retornan `IDUnidad = null`. Se muestran con badge rojo "No Registrada".
- `InformacionGeneral_Cierres.FechaInicio` es un **string** en formato `M/D/YYYY HH:MM:SS AM/PM`. Filtrar **siempre en memoria (JavaScript)**, nunca con PostgREST `.gte()`/`.lte()`.
- El cálculo de Horómetro/Odómetro total = `MAX(valor) - MIN(valor)` en el periodo, no suma acumulativa.

---

## 9. Seguridad y Autenticación

- Autenticación mediante **Supabase Auth** (email/password).
- RLS (Row Level Security) activo en tablas sensibles.
- `IDUsuarioRegistro` se asigna automáticamente desde `auth.uid()` en triggers o defaults de BD.
- Los reportes con edición inline son accesibles **solo para perfiles administrativos** (implementar verificación de rol en frontend y RLS en backend).
- `handleSupabaseError` intercepta errores `42501` (RLS) y `PGRST301` (JWT expirado) con mensajes claros al usuario.

---

## 10. Convenciones de Desarrollo

| Aspecto                                  | Convención                                             |
| ---------------------------------------- | ------------------------------------------------------ |
| Idioma de UI                             | Español (es-MX)                                        |
| Idioma del código (variables, funciones) | English camelCase / PascalCase                         |
| Idioma de comentarios                    | Español                                                |
| Fechas en BD                             | `YYYY-MM-DD` (date) / ISO 8601 (timestamptz)           |
| Fechas en UI                             | `DD/MM/YYYY` formato visual                            |
| Moneda/métricas                          | Decimales con 2 cifras significativas                  |
| Errores al usuario                       | Siempre en español, nunca mensajes técnicos            |
| Valores cero en tablas de reporte        | Renderizar como `—` (guión largo) para claridad visual |
| Combos                                   | Cascada estricta; cambio de nodo padre resetea hijos   |

---

## 11. Deuda Técnica y Gotchas Conocidos

1. **`TanqueMovimiento` sin columna `Activo`:** No existe. No filtrar por ella.
2. **`InformacionGeneral_Cierres.FechaInicio` como string:** Ver sección 8.4.
3. **`IDUnidad` null en vista SP:** Unidades no registradas en DieselApp; manejar silenciosamente.
4. **`LecturaCms` es `numeric(8,2)`** (migrado desde `int`). RPCs que retornen este campo deben declararla como `numeric`, no `integer`. Usar `parseFloat` (no `parseInt`) en frontend.
5. **Edición retroactiva de inventario:** No existe lógica de asiento compensatorio; editar un movimiento antiguo **no** recalcula el inventario histórico automáticamente.
6. **Temperatura (`TemperaturaC`):** Campo capturado en Entradas, actualmente anecdótico. No influye en cálculos volumétricos (corrección 15°C pendiente de implementar).
7. **`Planta` solo aplica en Lecturas:** No tiene peso transaccional en Salidas/Entradas; costeo de inventario es a nivel `CveCiudad`.
8. **Despliegue en IIS:** El build de Vite va a `/dieselapp`. El `basename` del router debe coincidir.

---

## 12. Checklist para Nuevas Features

Antes de implementar un nuevo componente o modificar uno existente, verificar:

- [ ] ¿La feature respeta la jerarquía `CveCiudad → [entidades]`?
- [ ] ¿Los combos dependientes se resetean correctamente al cambiar la ciudad?
- [ ] ¿Las divisiones en SQL usan `NULLIF`?
- [ ] ¿Los errores de Supabase pasan por `handleSupabaseError`?
- [ ] ¿Las fechas en `InformacionGeneral_Cierres` se filtran en memoria?
- [ ] ¿Los campos `numeric` se parsean con `parseFloat` en frontend?
- [ ] ¿Los valores cero en tablas de reporte se renderizan como `—`?
- [ ] ¿Los tipos de respuesta de nuevas RPCs están definidos en `src/types/`?
- [ ] ¿El script DDL de la nueva función está guardado en `docs/Scripts/`?

---

## 13. Referencias de Documentación Interna

| Documento             | Ruta                                                              | Contenido                                                       |
| --------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------- |
| Manual Maestro        | `docs/Capacitacion/ControlDiesel-ManualMaestro.md`                | Visión funcional completa, reglas de negocio, flujos operativos |
| Deuda Técnica         | `docs/Backlog/Deudatecnica_20260304.md`                           | Hallazgos de auditoría y riesgos pendientes                     |
| Backlog Productividad | `docs/Backlog/2026-02-26_Reporte_Productividad_y_Rentabilidad.md` | KPIs y semáforos del reporte de productividad                   |
| Scripts SQL           | `docs/Scripts/*.sql`                                              | DDL de todas las RPCs de Supabase                               |
| API Config            | `docs/API_CONFIG_GUIDE.md`                                        | Guía de configuración de variables de entorno                   |
| Bitácora              | `docs/Bitacora/`                                                  | Log de cambios y decisiones de arquitectura                     |
