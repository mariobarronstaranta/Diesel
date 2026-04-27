# AI_Context.md — Contexto del Proyecto: Control de Diésel

> **Propósito:** Proveer a cualquier flujo de IA (Claude, Gemini, GPT, etc.) el contexto
> técnico, funcional y de negocio suficiente para generar código, consultas SQL, rutas de
> refactorización o documentación **sin fricción ni suposiciones incorrectas**.
> Mantener este archivo actualizado tras cada cambio estructural significativo.

**Última actualización:** 2026-04-22
**Versión:** 1.6

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
├── TransaccionalSync/             # Componente ETL (SQL Server → Supabase)
│   ├── config/                    # Configuración de conexiones
│   └── scripts/                   # Scripts PowerShell y SQL de sincronización
└── vite.config.ts
```

---

## 4. Rutas de la Aplicación

| Ruta                                | Componente              | Descripción                                                        |
| ----------------------------------- | ----------------------- | ------------------------------------------------------------------ |
| `/`                                 | `Login`                 | Pantalla de autenticación                                          |
| `/dashboard`                        | `Dashboard`             | Resumen ejecutivo con gráficas                                     |
| `/captura`                          | `CapturaLecturas`       | Inventario físico de tanque (Lecturas)                             |
| `/entradas`                         | `EntradasDiesel`        | Registro de recepción de pipas                                     |
| `/salidas`                          | `SalidasDiesel`         | Registro de despacho a unidades                                    |
| `/reportes/lecturas`                | `ReporteLecturas`       | Historial de lecturas de inventario                                |
| `/reportes/consumos`                | `ReporteConsumos`       | Reporte Entradas vs Salidas por fecha                              |
| `/reportes/rendimiento`             | `ReporteRendimientos`   | Métricas Km/Lt y Hr/Lt por unidad                                  |
| `/reportes/rendimiento-consolidado` | `ReporteRendimientosV2` | Rendimiento consolidado por unidad con cargas en múltiples tanques |
| `/reportes/productividad`           | `ReporteProductividad`  | Cruce diesel + viajes SP (M3/Viaje, Lt/M3)                         |

---

## 5. Modelo de Datos Principal (Tablas Supabase)

> Los nombres de columnas en Supabase siguen **PascalCase con comillas dobles**.

### 5.1 `TanqueMovimiento` — Tabla central de transacciones

| Columna               | Tipo         | Descripción                                  |
| --------------------- | ------------ | -------------------------------------------- |
| `IdTanqueMovimiento`  | bigint PK    | Identificador único (auto-increment)         |
| `CveCiudad`           | varchar      | Clave de ciudad (ej. `"MTY"`, `"GDL"`)       |
| `IdTanque`            | bigint       | Referencia al tanque                         |
| `FechaCarga`          | date         | Fecha operativa del negocio                  |
| `HoraCarga`           | time         | Hora operativa del negocio                   |
| `TemperaturaCarga`    | bigint       | Temperatura registrada                       |
| `LitrosCarga`         | bigint       | Volumen transferido (Entrada o Salida)       |
| `AlturaTanque`        | numeric(8,2) | Equivalente a LecturaCms (Entradas/Lecturas) |
| `CuentaLitros`        | bigint       | Lectura del contador mecánico                |
| `Remision`            | varchar      | Documento de referencia (Entradas/Salidas)   |
| `IdProveedor`         | bigint       | Proveedor (Entradas)                         |
| `Observaciones`       | varchar      | Nota aclaratoria opcional                    |
| `TipoMovimiento`      | varchar      | `'E'` = Entrada, `'S'` = Salida              |
| `FechaHoraMovimiento` | timestamp    | Registro de sistema (servidor)               |
| `IdUnidad`            | bigint       | Vehículo (Salidas)                           |
| `IdPersonal`          | bigint       | Operador/Personal (Salidas)                  |
| `FolioVale`           | varchar      | Número de vale físico                        |
| `Horimetro`           | bigint       | Horas de la unidad (Salidas)                 |
| `Odometro`            | bigint       | Kilometraje de la unidad (Salidas)           |

> ⚠️ **IMPORTANTE:** `TanqueMovimiento` **NO** tiene columna `Activo`. No filtrar por ese campo.

### 5.2 Catálogos

| Tabla               | PK                    | Columnas relevantes                                                 |
| ------------------- | --------------------- | ------------------------------------------------------------------- |
| `Tanque`            | `IDTanque`            | `CveCiudad`, `Nombre`, `IDPlanta`, `Capacidad`, `IDTipoCombustible` |
| `Ciudad`            | `IDCiudad`            | `Descripcion`, `CveCiudad` (text)                                   |
| `Planta`            | `IDPlanta`            | `Nombre`, `CveCiudad`, `IDCiudad`                                   |
| `Unidad`            | `IDUnidad`            | `IDClaveUnidad`, `ClaveAlterna`, `Planta`, `CveCiudad`, `Activo`    |
| `Operadores`        | `IDPersonal`          | `CvePersonal`, `Nombre`, `APaterno`, `AMaterno`, `CveCiudad`        |
| `Proveedores`       | `IdProveedor`         | `NombreProveedor`                                                   |
| `Usuarios`          | `IDUsuario`           | `CveUsuario`, `Password`, `Correo`, `CveCiudad`, `NombrePerfil`     |
| `TanqueLecturas`    | `IDTanqueLecturas`    | `IDTanque`, `Fecha`, `LecturaCms`, `VolActualTA`, `VolActual15C`    |
| `VolumenTanque`     | `IDVolumenTanque`     | `IDTanque`, `Volumen`, `Altura` (Tabla de cubicación)               |
| `AjusteVolumetrico` | `IDAjusteVolumetrico` | `Temperatura`, `FactorAjuste`, `Densidad`                           |

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

| Función RPC                     | Propósito                                     | Parámetros principales                                                           |
| ------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------- |
| `get_reporte_consumos`          | Totales E/S agrupados por fecha/ciudad/tanque | `p_fecha_inicio`, `p_fecha_fin`, `p_cve_ciudad?`, `p_id_tanque?`, `p_id_unidad?` |
| `get_entradas_detalle`          | Detalle de movimientos de Entrada             | `p_fecha`, `p_ciudad`, `p_id_tanque`                                             |
| `get_salidas_detalle`           | Detalle de movimientos de Salida              | `p_fecha`, `p_ciudad`, `p_id_tanque`, `p_id_unidad?`                             |
| `get_rendimientos_detalle`      | Detalle de movimientos para rendimiento       | Igual + `p_id_unidad?`                                                           |
| `reporte_rendimientos_v2`       | Rendimiento consolidado por unidad            | `p_fecha_inicio`, `p_fecha_fin`, `p_cve_ciudad?`, `p_id_tanque?`, `p_id_unidad?` |
| `get_rendimientos_detalle_v2`   | Detalle consolidado de movimientos por unidad | `p_fecha_inicio`, `p_fecha_fin`, `p_cve_ciudad`, `p_id_unidad`                   |
| `sp_obtener_lecturas_diarias`   | Lecturas de inventario físico                 | `p_ciudad?`, `p_fecha_inicial`, `p_fecha_final`, `p_id_tanque?`                  |
| `sp_obtener_lecturas_diarias_consumos` | Lecturas agregadas + consumos por tanque/fecha | `p_ciudad?`, `p_fecha_inicial`, `p_fecha_final`, `p_id_tanque?`                  |
| `fn_calcular_consumo_alturas_por_fecha_tanque` | Cálculo escalar de Consumo Alturas por fecha/tanque | `p_fecha`, `p_id_tanque`                                                           |
| `fn_obtener_lecturas_por_fecha` | Lecturas para captura y detalle de inventario | `p_fecha`, `p_tanque`                                                            |
| `reporte_productividad`         | Cruce SP + TanqueMovimiento por unidad        | `p_fecha_inicio`, `p_fecha_fin`, `p_cve_ciudad?`, `p_id_tanque?`                 |

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
- **Lecturas Diarias (Inventario):** `LecturaCms` debe ser > 0. La retroactividad permitida no es fija; se controla desde `window.AppConfig.diasPermitidosHaciaAtrasCaptura` en `public/config.js`. En el estado actual del proyecto está configurada en 60 días.
- **`FechaHoraMovimiento`:** Se genera en el servidor (SQL `NOW()`). El frontend **no** debe enviarla. La `FechaCarga` es la fecha operativa de negocio que sí puede capturar el usuario.
- **Divisiones métricas:** Siempre usar `NULLIF(divisor, 0)` en SQL para proteger contra `÷0`.

### 8.3 Jerarquía Geográfica

```
CveCiudad (raíz)
├── Tanque(s)
├── Unidad(es) → restringido por Ciudad y Tanque (si se selecciona)
├── Personal/Operador(es) → solo en Salidas
└── Planta(s) → solo en CapturaLecturas

### 8.4 Inventario y Reporte de Lecturas

- `CapturaLecturas` usa una cascada obligatoria `Ciudad -> Planta -> Tanque`.
- `ReporteLecturas` permite filtros opcionales por ciudad y tanque.
- En `ReporteLecturas`, cuando no se selecciona ciudad o tanque, el frontend envía `null` para solicitar consulta sin ese filtro.
- `ReporteLecturas` consume la RPC `sp_obtener_lecturas_diarias_consumos` para obtener: `Entradas`, `Consumo Salidas`, `Consumo C. Litros` y `Consumo Alturas` por `tanque + fecha`.
- `Consumo Alturas` se calcula en la función `fn_calcular_consumo_alturas_por_fecha_tanque(fecha, tanque)`, invocada por la RPC:
    - Sin entrada: `Vol(LecturaInicial) - Vol(LecturaFinal)`.
    - Con entrada: `Vol(LecturaInicial) - Vol(AlturaTanque)` + `Vol(Altura2Tanque) - Vol(LecturaFinal)`.
    - Si hay múltiples entradas en el día/tanque, se usa la primera por `HoraCarga`.
- `ReporteLecturas` soporta exportación a CSV y PDF del resumen agregado y respeta el filtro visual aplicado.
- `ReporteLecturas` incluye el check `Mostrar Tanques sin Movimientos` con este flujo:
    - Seleccionado (default): muestra todos los renglones.
    - Sin seleccionar: oculta renglones donde simultáneamente `Entradas = 0`, `Consumo Salidas = 0`, `Consumo C. Litros = 0` y `Consumo Alturas = 0`.
- Orden actual de columnas en `ReporteLecturas`:
    - `Ciudad`, `Tanque`, `Fecha Lectura`
    - `Altura (cms)` Inicial/Final
    - `Cuenta Litros` Inicial/Final
    - `Entradas`, `Consumo Salidas`, `Consumo C. Litros`, `Consumo Alturas`
    - `Acción`
- Orden de despliegue recomendado de scripts SQL para este reporte:
    - `docs/Scripts/fn_calcular_consumo_alturas_por_fecha_tanque.sql`
    - `docs/Scripts/sp_obtener_lecturas_diarias_consumos.sql`

### 8.5 Rendimientos Actual vs Consolidado

- `ReporteRendimientos` se mantiene como versión actual en producción y agrupa por `Tanque + Unidad`.
- `ReporteRendimientosV2` es una versión paralela que consolida el KPI por `Unidad`, evitando distorsiones cuando la misma unidad carga en múltiples tanques dentro del periodo.
- En `ReporteRendimientosV2`, el filtro por tanque funciona como criterio de selección de unidades involucradas, pero el cálculo del rendimiento usa todas las cargas de la unidad dentro del rango consultado.
- `Kms Recorridos` y `Hrs Recorridos` en consolidado se calculan como suma de deltas por movimiento respecto a la salida inmediata anterior de la unidad (no como `MAX - MIN` del periodo).
- La función helper `fn_obtener_valores_previos_salida` devuelve odómetro/horímetro previos para el cálculo por movimiento.
- Si un movimiento no tiene salida previa válida para la unidad, su aporte a `Kms Recorridos` y `Hrs Recorridos` es `0`.
- `Tanque Principal` se define como el tanque con mayor suma de `LitrosCarga` para la unidad dentro del universo consolidado; en empate gana el nombre de tanque en orden alfabético.
- `Tanques Utilizados` lista todos los tanques distintos donde la unidad cargó dentro del universo consolidado.
- Etiquetas visibles actuales en el resumen consolidado:
    - `Kms Rec.`, `Hrs Rec.`, `Km/Lt`, `Hr/Lt`, `Lt/Hr`
- Encima de la tabla principal se muestran tarjetas resumen calculadas sobre el dataset visible:
    - `Total Diesel` = suma de `Carga Total`
    - `Total Kms` = suma de `Kms Recorridos`
    - `Total Horas` = suma de `Hrs Recorridos`
- El modal `ReporteRendimientosDetalleModalV2` muestra el detalle cronológico por movimiento e incluye columnas de referencia `Odómetro Ant` y `Horometro Ant`, calculadas con la misma lógica del helper de previos.
- En el modal de detalle solo son editables los valores capturados del movimiento actual (`Litros`, `Cuenta Litros`, `Odómetro`, `Horómetro`); los campos `Ant` son informativos y no se editan.
- Orden actual de columnas en el modal de detalle de Rendimientos V2:
    - `ID`, `Tanque`, `Fecha`, `Hora`
    - `Litros`, `Cuenta Litros`
    - `Odómetro Ant`, `Odómetro`
    - `Horometro Ant`, `Horómetro`
    - `Dif Odometro`, `Dif Horometro`
- En el modal también se muestran tarjetas resumen:
    - `Total Diesel` = suma de `Litros`
    - `Total Kms` = suma de `Dif Odometro`
    - `Total Horas` = suma de `Dif Horometro`
- Exportaciones del consolidado:
    - CSV: replica el resumen visible por unidad.
    - PDF: recalcula fila de totales sobre el dataset consultado y obtiene `Km/Lt`, `Hr/Lt` y `Lt/Hr` total con base en totales acumulados, no como promedio simple.
```

Al cambiar `CveCiudad` en cualquier formulario, **todos los combos descendientes se limpian y recargan**. En el Reporte de Consumos y Rendimientos, al cambiar `Tanque` también se limpia `Unidad`.

### 8.4 Reporte de Productividad — Casos Especiales

- Unidades con actividad en báscula (SP) pero **no registradas en DieselApp** retornan `IDUnidad = null`. Se muestran con badge rojo "No Registrada".
- `InformacionGeneral_Cierres.FechaInicio` es un **string** en formato `M/D/YYYY HH:MM:SS AM/PM`. Filtrar **siempre en memoria (JavaScript)**, nunca con PostgREST `.gte()`/`.lte()`.
- El cálculo de Horómetro/Odómetro total = `MAX(valor) - MIN(valor)` en el periodo, no suma acumulativa.
- **Precisión Temporal (Productividad por Carga):** Se utilizan los campos `HoraCarga` (en `TanqueMovimiento`) y `HoraInicio` (en `InformacionGeneral_Cierres`) para correlacionar eventos con precisión de minutos, evitando solapamientos en días con múltiples recargas.

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
9. **ReporteLecturas (filtro check):** El check "Mostrar Tanques sin Movimientos" inicia activo. Si se desactiva, se excluyen renglones con todos los indicadores de movimiento/consumo en cero.

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
| Sincronización SP     | `TransaccionalSync/scripts/`                                      | Scripts de integración con sistema de producción                |

---

## 14. Componente de Sincronización (TransaccionalSync)

Este componente es un proceso ETL externo (PowerShell + T-SQL) que alimenta la vista `InformacionGeneral_Cierres` en Supabase con datos reales del sistema de producción local.

### 14.1 Scripts Principales

- **`Sync-ViajesSupabase.ps1`**: Sincronización diferencial diaria (programada vía SQL Agent).
- **`Sync-ViajesSupabase-Backfill.ps1`**: Script manual para reprocesar rangos históricos de fechas.

### 14.2 Control y Auditoría (SQL Server)

El proceso deja trazabilidad en el servidor de origen:

- **`Sync_Ejecucion`**: Maestro de ejecuciones (estatus, registros enviados, HTTP status).
- **`Sync_Detalle`**: Detalle por viaje enviado para identificar fallos puntuales.
