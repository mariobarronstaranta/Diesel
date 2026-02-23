# Bitácora de Despliegue

## Módulo TransaccionalSync — Primer Despliegue

**Fecha**: 2026-02-23  
**Servidores**: DesarrolloVS (SQL Server) → Supabase (Cloud)  
**Ejecutado por**: Mario Barron

---

## Resumen Ejecutivo

Se completó exitosamente el primer despliegue del proceso ETL que sincroniza viajes de camiones revolvedores desde SQL Server hacia Supabase. Se sincronizaron **2,248 registros** correspondientes a **17 días hábiles de febrero 2026**, con un throughput de ~1 segundo por día.

---

## Cronología de Actividades

### 14:00 — Creación del módulo completo

Se generaron todos los archivos del módulo `TransaccionalSync`:

- 5 Stored Procedures en SQL Server (base `Pedidos`)
- 2 tablas de control (`Sync_Ejecucion`, `Sync_Detalle`) + 1 vista
- 1 script PowerShell orquestador (`Sync-ViajesSupabase.ps1`)
- 1 archivo de configuración (`sync.config.json`)
- 1 SQL Server Agent Job (`DieselSync_ViajesSupabase`)
- Documentación: README, requerimiento de negocio, especificación técnica

### 14:48 — Primera prueba de ejecución

Se intentó ejecutar el script para la fecha 2026-02-16 desde PowerShell en el servidor.

---

## Problemas Encontrados y Soluciones

### Problema 1: Operador `??` no soportado en PowerShell 5.1

**Error**:

```
Unexpected token '??' in expression or statement.
At Sync-ViajesSupabase.ps1:226 char:25
```

**Causa raíz**: El operador null-coalescing `??` fue introducido en PowerShell 7. El servidor ejecuta PowerShell 5.1 (incluido en Windows Server 2022).

**Solución**: Reemplazar `($variable ?? [DBNull]::Value)` con sintaxis compatible:

```powershell
# Antes (PS 7 only)
($r.IDUnidad ?? [DBNull]::Value)

# Después (PS 5.1 compatible)
$tvpIDUnidad = if ($null -eq $r.IDUnidad) { [DBNull]::Value } else { $r.IDUnidad }
```

**Prevención**: Todo el código PowerShell debe ser compatible con PS 5.1. No usar: `??`, `?.`, `??=`, `ternary ? :`.

---

### Problema 2: Variable interpolation con `?` en strings

**Error**:

```
The variable '$tablaDestino?Id_Viaje' cannot be retrieved because it has not been set.
```

**Causa raíz**: PowerShell 5.1 interpreta `"$tablaDestino?Id_Viaje"` como una sola variable porque el `?` es válido en nombres de variable.

**Solución**: Construir URLs con concatenación `+` en vez de interpolación:

```powershell
# Antes (ambiguo en PS 5.1)
$url = "$supabaseUrl/rest/v1/$tablaDestino?Id_Viaje=in.($ids)"

# Después (explícito)
$url = $supabaseUrl + "/rest/v1/" + $tablaDestino + "?Id_Viaje=in.(" + $ids + ")"
```

**Prevención**: En URLs con query strings, siempre usar concatenación `+` para evitar ambigüedad.

---

### Problema 3: Escaped quotes `\"` en strings dentro de PowerShell 5.1

**Error**:

```
Unexpected token 'Id_Viaje\"=in.($idsParam)' in expression or statement.
```

**Causa raíz**: Las comillas escapadas `\"` dentro de strings double-quoted no se parsean correctamente en PS 5.1 en ciertos contextos.

**Solución**: Usar concatenación `+` para construir la URL completa sin necesidad de escapar caracteres.

**Prevención**: Evitar `\"` dentro de strings interpolados. Usar `+` o variables intermedias.

---

### Problema 4: JWT inválido — `"rose"` en lugar de `"role"`

**Error**:

```
HTTP 401 — {"message":"Invalid API key","hint":"Double check your Supabase anon or service_role API key."}
```

**Causa raíz**: El archivo `.env` del proyecto DieselApp contenía un JWT con un typo en el payload:

- ❌ `.env`: `"rose":"anon"` (una letra transpuesta)
- ✅ `supabaseClient.ts`: `"role":"anon"` (correcto, hardcodeado)

El JWT del `.env` generaba una firma diferente que Supabase rechazaba.

**Solución**: Se tomó el JWT correcto directamente del archivo `supabaseClient.ts` que estaba hardcodeado y funcionando en producción.

**Prevención**:

1. Los `.env` deben validarse contra el dashboard de Supabase
2. Agregar una prueba de conexión al inicio del script (GET con `limit=1`) antes de intentar escribir
3. No copiar keys manualmente — sacarlas siempre del dashboard de Supabase

---

### Problema 5: Key `sb_secret_*` no compatible con REST API

**Error**:

```
HTTP 401 — Invalid API key
```

**Causa raíz**: Se intentó usar la key en formato `sb_secret_xxxx...` como service_role. Este formato nuevo de Supabase es para su SDK, no para la REST API de PostgREST que requiere un JWT (`eyJhbGci...`).

**Solución**: Regresar a la anon key en formato JWT, que PostgREST sí acepta.

**Prevención**: La REST API de Supabase (`/rest/v1/`) siempre requiere un JWT. Si se quiere una key de acceso completo (service*role), debe ser el JWT que aparece en el dashboard, no el formato `sb_secret*\*`.

---

### Problema 6: HTTP 400 Bad Request en INSERT

**Error**:

```
INSERT fallido HTTP 400 -
```

**Causa raíz**: PowerShell 5.1 por defecto envía el body del POST con encoding que Supabase no acepta correctamente. `ConvertTo-Json` puede producir problemas con caracteres especiales del español (acentos en nombres de operadores, obras, etc.).

**Solución**:

1. Agregar `-Compress` a `ConvertTo-Json` para eliminar whitespace innecesario
2. Forzar encoding UTF-8 sin BOM:

```powershell
$utf8Body = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
Invoke-WebRequest ... -Body $utf8Body ...
```

**Prevención**: Siempre enviar body como byte array UTF-8, nunca como string directo en PS 5.1.

---

### Problema 7: Registros duplicados al re-ejecutar

**Situación**: Al ejecutar el script dos veces para la misma fecha, se intentaban insertar registros que ya existían, causando conflicto de PK.

**Solución**: Agregar `on_conflict` y `resolution=ignore-duplicates` al INSERT:

```powershell
$insertUrl = $supabaseUrl + "/rest/v1/" + $tablaDestino + "?on_conflict=Id_Viaje,Remision"
$insertHeaders["Prefer"] = "return=minimal,resolution=ignore-duplicates"
```

**Resultado**: El script se puede ejecutar múltiples veces sin error. Los duplicados se ignoran silenciosamente.

---

## Cambio de Estrategia: DELETE+INSERT → INSERT con Ignore Duplicates

| Aspecto     | Diseño Original                                  | Implementación Final      |
| ----------- | ------------------------------------------------ | ------------------------- |
| Operación   | DELETE por Id_Viaje + INSERT                     | Solo INSERT               |
| Duplicados  | Eliminados antes de insertar                     | Ignorados (`on_conflict`) |
| Complejidad | 2 requests HTTP                                  | 1 request HTTP            |
| Riesgo      | Ventana de datos faltantes entre DELETE e INSERT | Ninguno                   |
| Idempotente | Sí                                               | Sí                        |

> **Nota**: La estrategia DELETE+INSERT se mantendrá documentada como opción futura cuando se requiera actualizar registros ya enviados. La implementación actual es solo INSERT.

---

## Resultados del Primer Backfill (Febrero 2026)

### Ejecuciones exitosas — 17 días con datos

| Fecha  | Registros | IDEjecucion | Duración |
| ------ | --------- | ----------- | -------- |
| Feb 03 | 174       | 14          | ~1s      |
| Feb 04 | 157       | 16          | ~2s      |
| Feb 05 | 153       | 18          | ~1s      |
| Feb 06 | 166       | 19          | ~1s      |
| Feb 07 | 89        | 20          | ~1s      |
| Feb 09 | 96        | 22          | ~1s      |
| Feb 10 | 131       | 23          | ~1s      |
| Feb 11 | 136       | 24          | ~1s      |
| Feb 12 | 110       | 25          | ~1s      |
| Feb 13 | 170       | 26          | ~1s      |
| Feb 14 | 71        | 27          | ~1s      |
| Feb 16 | 95        | 29          | ~1s      |
| Feb 17 | 144       | 30          | ~1s      |
| Feb 18 | 158       | 31          | ~1s      |
| Feb 19 | 148       | 32          | ~1s      |
| Feb 20 | 163       | 33          | ~1s      |
| Feb 21 | 91        | 34          | ~1s      |

### Días sin datos (SIN_DATOS) — 4 días

- **Feb 02** (domingo), **Feb 08** (sábado), **Feb 15** (sábado), **Feb 22** (sábado)

### Totales

| Métrica                     | Valor              |
| --------------------------- | ------------------ |
| Total registros en Supabase | **2,248**          |
| Días con datos              | 17                 |
| Días sin datos              | 4                  |
| Errores en producción       | **0**              |
| Throughput promedio         | ~1 segundo por día |

---

## Lecciones Aprendidas

1. **PowerShell 5.1 es el estándar en Windows Server 2022** — no asumir PS 7+
2. **JWT vs sb*secret*** — La REST API de Supabase solo acepta JWT
3. **UTF-8 sin BOM** — siempre convertir a bytes antes de enviar por HTTP
4. **Bitácora en archivo** — implementar logging a archivo desde el inicio facilita el debugging remoto
5. **Probar la key antes de usarla** — un GET simple antes del INSERT habría detectado los problemas de auth de inmediato
6. **Validar .env contra el dashboard** — no copiar keys de archivos intermedios

---

## Estado Actual

| Componente           | Estado                                   |
| -------------------- | ---------------------------------------- |
| SQL Server SPs       | ✅ Desplegados en `Pedidos@DesarrolloVS` |
| Tablas de control    | ✅ Creadas y con datos                   |
| PowerShell script    | ✅ En `C:\Concretec\scripts\`            |
| Config               | ✅ En `C:\Concretec\config\`             |
| SQL Server Agent Job | ✅ Creado, ejecuta 06:00 AM diario       |
| Datos en Supabase    | ✅ 2,248 registros (Feb 3-21)            |
| Logs                 | ✅ En `C:\Concretec\logs\`               |
