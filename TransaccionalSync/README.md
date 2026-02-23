# TransaccionalSync

## Sincronización de Viajes SQL Server → Supabase

**Proyecto**: DieselApp | **Versión**: 1.1 | **Fecha**: 2026-02-23

---

## ¿Qué es este módulo?

Proceso ETL que sincroniza **diariamente** los viajes cerrados de los camiones revolvedores desde el sistema transaccional en **SQL Server** hacia la base de datos en la nube **Supabase**, permitiendo cruzar la información de producción (m³ de cemento) con el consumo de diésel por unidad.

### Documentación

| Documento                                                    | Descripción                                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| [📋 Requerimiento de Negocio](docs/requerimiento_negocio.md) | Contexto, objetivos, requerimientos funcionales y criterios de aceptación      |
| [⚙️ Especificación Técnica](docs/especificacion_tecnica.md)  | Arquitectura, modelo de datos, SPs, script PowerShell y plan de despliegue     |
| [📓 Bitácora de Despliegue](docs/bitacora_despliegue.md)     | Registro cronológico del primer despliegue, problemas encontrados y soluciones |

---

## Estructura de Archivos

```
TransaccionalSync/
├── docs/
│   ├── requerimiento_negocio.md     Requerimiento desde el punto de vista de negocio
│   ├── especificacion_tecnica.md    Diseño técnico completo
│   └── bitacora_despliegue.md       Registro del despliegue y lecciones aprendidas
│
├── scripts/
│   ├── create_sync_tables.sql       DDL: Sync_Ejecucion, Sync_Detalle, vw_Sync_Resumen
│   ├── create_agent_job.sql         SQL Server Agent Job (06:00 AM diario)
│   ├── sp_SincronizarViajesCierres.sql  SP origen de datos (viajes del día)
│   ├── sp_RegistrarInicioSync.sql   SP control — abre ejecución
│   ├── sp_CerrarSync.sql            SP control — cierra con estatus
│   ├── sp_RegistrarDetalleSync.sql  SP control — detalle por viaje (TVP)
│   └── Sync-ViajesSupabase.ps1      Script PowerShell orquestador
│
├── config/
│   └── sync.config.json             ⚠️ Credenciales (NO subir a git — en .gitignore)
│
├── logs/                            Bitácoras generadas automáticamente
│   └── SyncLog_YYYY-MM-DD.txt       Un archivo por día de ejecución
│
├── .gitignore
└── README.md
```

---

## Datos de Conexión

| Componente    | Valor                                      |
| ------------- | ------------------------------------------ |
| Servidor SQL  | `DesarrolloVS`                             |
| Base de datos | `Pedidos`                                  |
| Autenticación | SQL Auth (`pedidos` / `pedidos`)           |
| Supabase URL  | `https://ecnasowhigllrhkbvphr.supabase.co` |
| Supabase Key  | `anon` JWT (empieza con `eyJhbGci...`)     |

> ⚠️ **IMPORTANTE**: La key de Supabase debe ser un **JWT** (`eyJhbGci...`), no un token `sb_secret_*`. Ver sección de troubleshooting en la bitácora.

---

## Instalación Rápida

### 1. Copiar al servidor

```
C:\Concretec\
├── scripts\Sync-ViajesSupabase.ps1
├── config\sync.config.json
└── logs\                              ← se crea automáticamente
```

### 2. Ejecutar en SSMS (en este orden)

```
1. create_sync_tables.sql
2. sp_RegistrarInicioSync.sql
3. sp_CerrarSync.sql
4. sp_RegistrarDetalleSync.sql
5. sp_SincronizarViajesCierres.sql
6. create_agent_job.sql
```

### 3. Configurar credenciales

```json
// C:\Concretec\config\sync.config.json
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

### 4. Probar manualmente

```powershell
cd C:\Concretec\scripts
.\Sync-ViajesSupabase.ps1 -FechaProceso "2026-02-22"
```

### 5. Verificar resultado

```sql
-- SQL Server
SELECT TOP 5 * FROM dbo.vw_Sync_Resumen ORDER BY FechaInicio DESC;
```

```
-- Supabase Dashboard → SQL Editor
SELECT COUNT(*) FROM "InformacionGeneral_Cierres";
```

---

## Monitoreo

### Bitácora de ejecución (PowerShell)

Los logs se generan automáticamente en `C:\Concretec\logs\SyncLog_YYYY-MM-DD.txt`.

### Consultas de monitoreo (SQL Server)

```sql
-- Últimas ejecuciones
SELECT TOP 10 * FROM dbo.vw_Sync_Resumen ORDER BY FechaInicio DESC;

-- Ejecuciones con error
SELECT * FROM dbo.Sync_Ejecucion WHERE Estatus = 'ERROR'
ORDER BY FechaInicio DESC;

-- Detalle de una ejecución
SELECT * FROM dbo.Sync_Detalle WHERE IDEjecucion = 1;
```

---

## Requisitos del Servidor

|                 |                                           |
| --------------- | ----------------------------------------- |
| OS              | Windows Server 2022                       |
| Motor BD        | SQL Server Standard 2018 o superior       |
| PowerShell      | **5.1** (incluido en Windows Server 2022) |
| Puerto saliente | 443 HTTPS hacia `*.supabase.co`           |

> **Nota**: El script es 100% compatible con PowerShell 5.1. No usar operadores de PS 7+ como `??`.
