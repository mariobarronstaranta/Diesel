# Especificación Técnica

## Módulo TransaccionalSync — Sincronización SQL Server → Supabase

**Proyecto**: DieselApp  
**Módulo**: TransaccionalSync  
**Fecha**: 2026-02-23  
**Versión**: 1.1  
**Autor**: Mario Barron

---

## 1. Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          AWS VM  (Windows Server 2022)                  │
│                                                                         │
│   ┌──────────────────┐     ┌───────────────────────────────────────┐    │
│   │  SQL Server Agent │────▶│    Sync-ViajesSupabase.ps1            │    │
│   │  Job 06:00 AM     │     │    (PowerShell 5.1 nativo)            │    │
│   └──────────────────┘     └───────────────┬──────────────────────┘    │
│                                             │                           │
│   ┌─────────────────────────────────────────▼──────────────────────┐   │
│   │               SQL Server Standard 2018                          │   │
│   │                                                                  │   │
│   │   EXEC sp_SincronizarViajesCierres  → 150-200 registros         │   │
│   │   EXEC sp_RegistrarInicioSync       → abre Sync_Ejecucion      │   │
│   │   EXEC sp_RegistrarDetalleSync      → registra Sync_Detalle    │   │
│   │   EXEC sp_CerrarSync                → cierra con estatus        │   │
│   │                                                                  │   │
│   │   Tablas transaccionales:  Viaje, Pedidos, PedidoViajeCierre... │   │
│   │   Tablas de control:       Sync_Ejecucion, Sync_Detalle         │   │
│   └──────────────────────────────────────────────────────────────────┘  │
│                                             │                           │
│                              HTTPS / REST API (puerto 443 saliente)     │
└─────────────────────────────────────────────┼───────────────────────────┘
                                              │
                                              ▼
                              ┌───────────────────────────┐
                              │        Supabase            │
                              │   (PostgreSQL en la nube)  │
                              │                            │
                              │  DELETE por Id_Viaje       │
                              │  INSERT bulk (1 request)   │
                              │  on_conflict=ignore dupes  │
                              │                            │
                              │  InformacionGeneral_Cierres│
                              │  TanqueMovimiento          │
                              │  Unidades, Tanque, ...     │
                              └───────────────────────────┘
```

---

## 2. Infraestructura del Servidor

| Característica    | Valor                                                |
| ----------------- | ---------------------------------------------------- |
| OS                | Windows Server 2022                                  |
| RAM               | 16 GB                                                |
| Procesador        | 8 núcleos                                            |
| Motor de BD       | SQL Server Standard Edition 2018                     |
| Nube              | AWS VM                                               |
| Acceso a internet | HTTPS saliente (puerto 443) requerido hacia Supabase |

---

## 3. Modelo de Datos — SQL Server

### 3.1 Tablas de Control

#### `dbo.Sync_Ejecucion`

Registro maestro de cada ejecución del proceso. Una fila por día de sincronización.

| Columna             | Tipo            | Nullable | Descripción                                         |
| ------------------- | --------------- | -------- | --------------------------------------------------- |
| `IDEjecucion`       | INT IDENTITY PK | No       | ID autoincremental                                  |
| `FechaProceso`      | DATE            | No       | Fecha de los viajes sincronizados                   |
| `FechaInicio`       | DATETIME        | No       | Inicio de la ejecución (default: GETDATE())         |
| `FechaFin`          | DATETIME        | Sí       | Fin de la ejecución (NULL mientras corre)           |
| `TotalRegistros`    | INT             | No       | Registros obtenidos del SP origen                   |
| `RegistrosEnviados` | INT             | No       | Registros confirmados en Supabase                   |
| `Estatus`           | VARCHAR(20)     | No       | `EN_PROCESO` \| `EXITOSO` \| `ERROR` \| `SIN_DATOS` |
| `HttpStatusCode`    | INT             | Sí       | Código HTTP de la respuesta de Supabase             |
| `MensajeError`      | NVARCHAR(MAX)   | Sí       | Detalle del error si aplica                         |
| `HostEjecucion`     | VARCHAR(100)    | No       | Servidor que ejecutó el proceso                     |
| `UsuarioEjecucion`  | VARCHAR(100)    | No       | Usuario de Windows del proceso                      |

**Índices:**

- `PK_Sync_Ejecucion` → `IDEjecucion`
- `IX_Sync_Ejecucion_FechaProceso` → `FechaProceso DESC`

#### `dbo.Sync_Detalle`

Detalle de cada viaje enviado en una ejecución.

| Columna        | Tipo            | Nullable | Descripción                       |
| -------------- | --------------- | -------- | --------------------------------- |
| `IDDetalle`    | INT IDENTITY PK | No       | ID autoincremental                |
| `IDEjecucion`  | INT FK          | No       | Referencia a `Sync_Ejecucion`     |
| `IDViaje`      | BIGINT          | No       | ID del viaje sincronizado         |
| `Remision`     | VARCHAR(50)     | Sí       | Remisión del cierre del viaje     |
| `IDUnidad`     | BIGINT          | Sí       | ID de la unidad (camión)          |
| `NombreUnidad` | VARCHAR(100)    | Sí       | Clave del camión                  |
| `FechaViaje`   | DATE            | Sí       | Fecha de realización del viaje    |
| `Estatus`      | VARCHAR(20)     | No       | `ENVIADO` \| `ERROR`              |
| `MensajeError` | NVARCHAR(500)   | Sí       | Detalle si el registro tuvo error |

**Índices:**

- `PK_Sync_Detalle` → `IDDetalle`
- `FK_Sync_Detalle_Ejecucion` → `IDEjecucion`
- `IX_Sync_Detalle_IDViaje` → `IDViaje`

#### `dbo.vw_Sync_Resumen`

Vista de monitoreo que muestra las ejecuciones con duración calculada en segundos.

---

### 3.2 Tabla Destino — Supabase

#### `public."InformacionGeneral_Cierres"`

Tabla desnormalizada en Supabase. Llave primaria compuesta.

| Columna             | Tipo   | PK  | Origen                                          |
| ------------------- | ------ | --- | ----------------------------------------------- |
| `Id_Viaje`          | BIGINT | ✅  | `Viaje.Id_Viaje`                                |
| `Remision`          | TEXT   | ✅  | `PedidoViajeCierre.Remision`                    |
| `IDPedido`          | BIGINT |     | `Pedidos.IDPedido`                              |
| `CargaViaje`        | DOUBLE |     | `PedidoViajeCierre.CargaViaje` (m³)             |
| `IDPlanta`          | BIGINT |     | `Viaje.IDPlanta`                                |
| `NombrePlantaViaje` | TEXT   |     | `Plantas.Nombre`                                |
| `IDUnidad`          | BIGINT |     | `Viaje.IDUnidad` ← **llave de JOIN con diésel** |
| `NombreUnidad`      | TEXT   |     | `Unidad.IDClaveUnidad`                          |
| `IDOperador`        | BIGINT |     | `Viaje.IDOperador`                              |
| `NombreOperador`    | TEXT   |     | `Personal.Nombre + APaterno`                    |
| `IDEstatusViaje`    | BIGINT |     | `Viaje.IDEstatusViaje`                          |
| `NombreEstatus`     | TEXT   |     | `EstatusViaje.Descripcion`                      |
| `FechaInicio`       | TEXT   |     | `Viaje.FechaInicio`                             |
| `HoraInicio`        | TEXT   |     | `Viaje.HoraInicio`                              |
| `HoraFin`           | TEXT   |     | `Viaje.HoraFin`                                 |
| `IDObra`            | BIGINT |     | `Pedidos.IDObra`                                |
| `NombreObra`        | TEXT   |     | `Obra.Nombre`                                   |
| `IDClienteSAE`      | BIGINT |     | `Pedidos.IDCliente`                             |
| `NombreCliente`     | TEXT   |     | `Clientes.NombreCompleto`                       |
| `IDUso`             | BIGINT |     | `PedidoDetalle.IDUso`                           |
| `NombreUso`         | TEXT   |     | `Uso.Descripcion`                               |
| `IDProducto`        | BIGINT |     | `Producto.IDProducto`                           |
| `NombreProducto`    | TEXT   |     | `Producto.Descripcion`                          |
| `CveCiudad`         | TEXT   |     | `Pedidos.CveCiudad`                             |
| `NombreVendedor`    | TEXT   |     | `Personal.Nombre + APaterno` (vendedor)         |

> **Llave de JOIN con DieselApp**: `IDUnidad` es la columna que une esta tabla con `TanqueMovimiento.IdUnidad` y `Unidades.IDUnidad` en Supabase.

---

## 4. Stored Procedures

### 4.1 `sp_SincronizarViajesCierres` — Origen de Datos

**Archivo**: `scripts/sp_SincronizarViajesCierres.sql`

```sql
EXEC dbo.sp_SincronizarViajesCierres
    @FechaInicio date,      -- Requerido
    @FechaFin    date = NULL -- Por defecto = @FechaInicio
```

**Filtros aplicados:**

- Solo camiones revolvedores: `Unidad.IDClaveUnidad LIKE '%CR%'`
- Solo viajes con remisión confirmada: `PVC.Remision IS NOT NULL AND LEN(...) > 0`
- Solo productos de clasificación `CONC` (concreto)

**Tablas involucradas**: `Viaje`, `Plantas`, `Unidad`, `Personal`, `EstatusViaje`, `PedidoViaje`, `Pedidos`, `Obra`, `Ciudad`, `Clientes`, `PedidoDetalle`, `Uso`, `PedidoProducto`, `Producto`, `PedidoViajeCierre`

**Optimizaciones aplicadas:**

- CTE `ViajesBase` pre-filtra antes de los JOINs
- `SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED` (equivale a NOLOCK en todas las tablas)
- `SET NOCOUNT ON`

---

### 4.2 `sp_RegistrarInicioSync`

```sql
EXEC dbo.sp_RegistrarInicioSync
    @FechaProceso date,
    @IDEjecucion  int OUTPUT
```

Inserta en `Sync_Ejecucion` con estatus `EN_PROCESO` y retorna el ID generado.

---

### 4.3 `sp_CerrarSync`

```sql
EXEC dbo.sp_CerrarSync
    @IDEjecucion       int,
    @TotalRegistros    int,
    @RegistrosEnviados int,
    @Estatus           varchar(20),   -- EXITOSO | ERROR | SIN_DATOS
    @HttpStatusCode    int = NULL,
    @MensajeError      nvarchar(max) = NULL
```

Actualiza `Sync_Ejecucion` con el resultado final. Llamado tanto en éxito como en error.

---

### 4.4 `sp_RegistrarDetalleSync`

```sql
EXEC dbo.sp_RegistrarDetalleSync
    @IDEjecucion int,
    @Detalle     dbo.TVP_Sync_Detalle READONLY   -- Table-Valued Parameter
```

Inserta el lote de viajes en `Sync_Detalle`. El TVP `dbo.TVP_Sync_Detalle` debe existir antes del SP.

---

## 5. Script PowerShell — Orquestador

**Archivo**: `scripts/Sync-ViajesSupabase.ps1`  
**Runtime**: PowerShell 5.1 (incluido en Windows Server 2022)  
**Dependencias externas**: Ninguna  
**Encoding HTTP**: UTF-8 sin BOM (byte array)  
**Log automático**: `C:\Concretec\logs\SyncLog_YYYY-MM-DD.txt`

### Parámetros

| Parámetro       | Tipo   | Default                      | Descripción                                      |
| --------------- | ------ | ---------------------------- | ------------------------------------------------ |
| `-FechaProceso` | string | Ayer (`-1 day`)              | Fecha de los viajes a sincronizar (`yyyy-MM-dd`) |
| `-ConfigPath`   | string | `..\config\sync.config.json` | Ruta al archivo de configuración                 |
| `-LogDir`       | string | `C:\Concretec\logs`          | Directorio de logs (se crea automáticamente)     |

### Flujo de Ejecución

```
1. Leer sync.config.json
2. Abrir conexión SQL Server (SQL Auth: User Id + Password)
3. EXEC sp_RegistrarInicioSync → obtener @IDEjecucion
4. EXEC sp_SincronizarViajesCierres @FechaInicio
5. Si TotalRegistros = 0 → sp_CerrarSync (SIN_DATOS) → exit 0
6. Construir array de objetos JSON (un objeto por viaje)
7. Convertir JSON a UTF-8 (byte array sin BOM)
8. POST /rest/v1/InformacionGeneral_Cierres?on_conflict=Id_Viaje,Remision
   Header: Prefer: return=minimal,resolution=ignore-duplicates
9. EXEC sp_RegistrarDetalleSync (via TVP con todos los viajes)
10. EXEC sp_CerrarSync (EXITOSO, HTTP code)
11. Si cualquier excepción: sp_CerrarSync (ERROR, mensaje) → exit 1
```

### Estrategia INSERT con Ignore Duplicates

Se utiliza la funcionalidad UPSERT de PostgREST para insertar registros nuevos e ignorar duplicados:

- `?on_conflict=Id_Viaje,Remision` — columnas de la PK
- `Prefer: resolution=ignore-duplicates` — si ya existe, se salta

Esto permite ejecutar el script **múltiples veces** para la misma fecha sin error.

> **Nota**: Si en el futuro se requiere actualizar registros ya enviados, se puede cambiar a `resolution=merge-duplicates` o restaurar la estrategia DELETE+INSERT.

---

## 6. SQL Server Agent Job

**Archivo**: `scripts/create_agent_job.sql`  
**Base**: `msdb`

| Configuración | Valor                         |
| ------------- | ----------------------------- |
| Nombre        | `DieselSync_ViajesSupabase`   |
| Tipo de paso  | PowerShell                    |
| Frecuencia    | Diario                        |
| Hora          | 06:00 AM                      |
| Reintentos    | 1 reintento a los 10 minutos  |
| En falla      | Registra en historial del Job |

### Ruta esperada del script en el servidor

```
C:\Concretec\scripts\Sync-ViajesSupabase.ps1
C:\Concretec\config\sync.config.json
```

---

## 7. Configuración (`sync.config.json`)

```json
{
  "SqlServer": "DesarrolloVS",
  "Database": "Pedidos",
  "SqlUser": "pedidos",
  "SqlPassword": "pedidos",
  "TablaDestino": "InformacionGeneral_Cierres",
  "SupabaseUrl": "https://ecnasowhigllrhkbvphr.supabase.co",
  "SupabaseKey": "eyJhbGci... (JWT completo)"
}
```

> ⚠️ La `SupabaseKey` **debe ser un JWT** (empieza con `eyJhbGci...`). Las keys en formato `sb_secret_*` NO son compatibles con la REST API de PostgREST.

> **CRÍTICO**: Este archivo nunca debe subirse al repositorio. Está incluido en `.gitignore`.

---

## 8. Cruce de Datos en Supabase

La función PostgreSQL `reporte_rendimientos` en Supabase se enriquecerá para incluir datos de viajes:

```sql
-- JOIN entre diesel y viajes por IDUnidad y fecha
LEFT JOIN (
    SELECT
        "IDUnidad",
        COUNT(*)         AS "NumViajes",
        SUM("CargaViaje") AS "M3Cargados"
    FROM public."InformacionGeneral_Cierres"
    WHERE "FechaInicio"::date BETWEEN p_fecha_inicio AND p_fecha_fin
    GROUP BY "IDUnidad"
) v ON v."IDUnidad" = u."IDUnidad"
```

**Métricas resultantes del cruce:**

| Métrica        | Fórmula                             |
| -------------- | ----------------------------------- |
| Num Viajes     | COUNT(Id_Viaje) por unidad en rango |
| M³ Cargados    | SUM(CargaViaje) por unidad en rango |
| M³ / Litro     | M³ Cargados / Total Litros diésel   |
| Litros / Viaje | Total Litros diésel / Num Viajes    |
| Km / Litro     | Ya existente                        |
| Hrs / Litro    | Ya existente                        |

---

## 9. Índices Recomendados en SQL Server

Verificar con `EXEC sp_helpindex 'NombreTabla'` antes de crear:

```sql
-- Filtro principal del SP (mayor impacto)
CREATE INDEX IX_Viaje_FechaInicio_IDUnidad
    ON dbo.Viaje (FechaInicio, IDUnidad);

-- JOIN costoso con cierres
CREATE INDEX IX_PedidoViajeCierre_IDViaje_IDPedido
    ON dbo.PedidoViajeCierre (IDViaje, IDPedido)
    INCLUDE (Remision, CargaViaje);

-- Filtro de camiones revolvedores
CREATE INDEX IX_Unidad_IDClaveUnidad
    ON dbo.Unidad (IDClaveUnidad)
    INCLUDE (IDUnidad);
```

---

## 10. Consideraciones de Seguridad

| Aspecto                  | Implementación                                                          |
| ------------------------ | ----------------------------------------------------------------------- |
| Credenciales SQL Server  | SQL Auth (usuario `pedidos` con acceso a base `Pedidos`)                |
| Credenciales Supabase    | Archivo `sync.config.json` fuera del repo, en `.gitignore`              |
| Key de Supabase          | JWT `anon` key — no usar formato `sb_secret_*`                          |
| Permisos del usuario ETL | Solo `EXECUTE` en los 4 SPs, `SELECT` en tablas transaccionales         |
| Puerto requerido         | 443 HTTPS saliente desde la VM hacia `*.supabase.co`                    |
| Supabase RLS             | Deshabilitado en `InformacionGeneral_Cierres` (tabla de sincronización) |
| Encoding                 | UTF-8 sin BOM forzado en body HTTP (byte array)                         |

---

## 11. Plan de Despliegue

### Paso 1 — Preparar el servidor

```powershell
# Crear carpeta del proceso en el servidor
mkdir C:\Concretec\scripts
mkdir C:\Concretec\config

# Copiar archivos desde el repositorio
# (los archivos SQL se ejecutan desde SSMS, no desde PowerShell)
```

### Paso 2 — Ejecutar scripts SQL en SSMS (en orden)

```
1. create_sync_tables.sql          → Crea Sync_Ejecucion, Sync_Detalle
2. sp_RegistrarInicioSync.sql
3. sp_CerrarSync.sql
4. sp_RegistrarDetalleSync.sql     → Crea el tipo TVP_Sync_Detalle además del SP
5. sp_SincronizarViajesCierres.sql
6. create_agent_job.sql            → Crea el Job en SQL Server Agent
```

### Paso 3 — Configurar credenciales

```
Editar: C:\Concretec\config\sync.config.json
Llenar: SqlServer, Database, SupabaseUrl, SupabaseKey
```

### Paso 4 — Prueba manual

```powershell
cd C:\Concretec\scripts
.\Sync-ViajesSupabase.ps1 -FechaProceso "2026-02-22"
```

### Paso 5 — Verificar resultado

```sql
-- En SQL Server
SELECT TOP 5 * FROM dbo.vw_Sync_Resumen ORDER BY FechaInicio DESC;

-- En Supabase (desde el dashboard o psql)
SELECT COUNT(*) FROM "InformacionGeneral_Cierres"
WHERE "FechaInicio" = '2026-02-22';
```

### Paso 6 — Activar el Job

```sql
EXEC msdb.dbo.sp_update_job
    @job_name = N'DieselSync_ViajesSupabase',
    @enabled  = 1;
```

---

## 12. Restricciones PowerShell 5.1

El servidor ejecuta PS 5.1 (incluido en Windows Server 2022). **No usar** las siguientes características de PS 7+:

| Característica    | PS 7+          | Alternativa PS 5.1                     |
| ----------------- | -------------- | -------------------------------------- |
| Null-coalescing   | `$x ?? $y`     | `if ($null -eq $x) { $y } else { $x }` |
| Null-conditional  | `$x?.Method()` | `if ($x) { $x.Method() }`              |
| Ternary           | `$x ? $a : $b` | `if ($x) { $a } else { $b }`           |
| URL interpolation | `"$url?param"` | `$url + "?param"`                      |

---

## 13. Bitácora de Cambios Técnicos

| Versión | Fecha      | Descripción                                                                                                             |
| ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1.0.0   | 2026-02-23 | Creación inicial: SP de origen, tablas de control, SPs de control, PowerShell orquestador, SQL Server Agent Job         |
| 1.1.0   | 2026-02-23 | Fix PS 5.1 compat, SQL Auth, INSERT-only con ignore-duplicates, UTF-8 encoding, log a archivo, datos reales de conexión |
