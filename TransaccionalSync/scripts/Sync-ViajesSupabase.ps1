<#
.SYNOPSIS
    Sync-ViajesSupabase.ps1 — Sincronización diaria de viajes hacia Supabase.

.DESCRIPTION
    Proceso ETL que:
      1. Lee la configuración de conexión desde sync.config.json
      2. Registra el inicio del proceso en SQL Server (Sync_Ejecucion)
      3. Ejecuta sp_SincronizarViajesCierres para obtener los viajes del día anterior
      4. Si hay datos: envía un DELETE + INSERT bulk a la API REST de Supabase
      5. Registra el detalle de los viajes enviados (Sync_Detalle)
      6. Cierra el registro del proceso con el estatus final

    Stack: 100% Microsoft.
      - System.Data.SqlClient  (.NET Framework incluido en Windows Server)
      - Invoke-RestMethod       (PowerShell 5.1+ nativo en Windows Server 2022)

.PARAMETER FechaProceso
    Fecha de los viajes a sincronizar (formato YYYY-MM-DD).
    Por defecto: día anterior a la ejecución.

.PARAMETER ConfigPath
    Ruta al archivo sync.config.json.
    Por defecto: mismo directorio que el script.

.EXAMPLE
    # Ejecución normal (toma el día anterior automáticamente)
    .\Sync-ViajesSupabase.ps1

    # Sincronizar una fecha específica (re-proceso o backfill)
    .\Sync-ViajesSupabase.ps1 -FechaProceso "2026-02-22"

.NOTES
    Autor   : [Tu Nombre]
    Versión : 1.0.0
    Fecha   : 2026-02-23

    BITÁCORA DE CAMBIOS
    -------------------
    v1.0.0 | 2026-02-23 | [Tu Nombre] | Creación inicial
#>

param (
    [string] $FechaProceso = (Get-Date).AddDays(-1).ToString("yyyy-MM-dd"),
    [string] $ConfigPath   = (Join-Path $PSScriptRoot "..\config\sync.config.json"),
    [string] $LogDir       = "C:\Concretec\logs"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# =============================================================================
# CONFIGURACIÓN DE LOG EN ARCHIVO
# =============================================================================
# Nombre del archivo: SyncLog_2026-02-23.txt (uno por día de ejecución)
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
$global:LogFile = Join-Path $LogDir ("SyncLog_" + (Get-Date -Format "yyyy-MM-dd") + ".txt")

# =============================================================================
# FUNCIONES AUXILIARES
# =============================================================================

function Write-Log {
    param([string]$Mensaje, [string]$Nivel = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $linea     = "[$timestamp][$Nivel] $Mensaje"
    # Consola
    Write-Host $linea
    # Archivo de bitácora
    Add-Content -Path $global:LogFile -Value $linea -Encoding UTF8
}

function Get-SqlConnection {
    param([hashtable]$Config)
    # SQL Server Authentication (usuario y password desde sync.config.json)
    $connStr = "Server=$($Config.SqlServer);Database=$($Config.Database);" +
               "User Id=$($Config.SqlUser);Password=$($Config.SqlPassword);" +
               "Connect Timeout=30;"
    $conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
    $conn.Open()
    return $conn
}

# =============================================================================
# INICIO DEL SCRIPT
# =============================================================================
Write-Log "========================================================"
Write-Log "Iniciando sincronización de viajes para fecha: $FechaProceso"
Write-Log "========================================================"

# ─── 1. Leer configuración ───────────────────────────────────────────────────
Write-Log "Cargando configuración desde: $ConfigPath"
if (-not (Test-Path $ConfigPath)) {
    Write-Log "Archivo de configuración no encontrado: $ConfigPath" "ERROR"
    exit 1
}
$config = Get-Content $ConfigPath -Raw | ConvertFrom-Json

$supabaseUrl  = $config.SupabaseUrl
$supabaseKey  = $config.SupabaseKey
$tablaDestino = $config.TablaDestino

$headers = @{
    "apikey"        = $supabaseKey
    "Authorization" = "Bearer $supabaseKey"
    "Content-Type"  = "application/json"
    "Prefer"        = "return=minimal"
}

# Debug: mostrar prefijo del key para verificar cuál se está usando
$keyPreview = if ($supabaseKey.Length -gt 20) { $supabaseKey.Substring(0,20) + "..." } else { $supabaseKey }
Write-Log "Supabase URL : $supabaseUrl"
Write-Log "Supabase Key : $keyPreview"

# ─── 2. Abrir conexión SQL Server ────────────────────────────────────────────
Write-Log "Conectando a SQL Server: $($config.SqlServer) / $($config.Database)"
$htConfig = @{}
$config.PSObject.Properties | ForEach-Object { $htConfig[$_.Name] = $_.Value }
$sqlConn = Get-SqlConnection -Config $htConfig

$idEjecucion = 0

try {

    # ─── 3. Registrar inicio del proceso en SQL Server ───────────────────────
    Write-Log "Registrando inicio del proceso en Sync_Ejecucion..."
    $cmdInicio = $sqlConn.CreateCommand()
    $cmdInicio.CommandText = "EXEC dbo.sp_RegistrarInicioSync @FechaProceso, @IDEjecucion OUTPUT"
    $cmdInicio.Parameters.AddWithValue("@FechaProceso", $FechaProceso) | Out-Null
    $paramID = $cmdInicio.Parameters.Add("@IDEjecucion", [System.Data.SqlDbType]::Int)
    $paramID.Direction = [System.Data.ParameterDirection]::Output
    $cmdInicio.ExecuteNonQuery() | Out-Null
    $idEjecucion = $paramID.Value
    Write-Log "Ejecucion registrada con IDEjecucion: $idEjecucion"

    # ─── 4. Obtener viajes del SP de origen ──────────────────────────────────
    Write-Log "Ejecutando sp_SincronizarViajesCierres para $FechaProceso..."
    $cmdViajes = $sqlConn.CreateCommand()
    $cmdViajes.CommandText = "EXEC dbo.sp_SincronizarViajesCierres @FechaInicio"
    $cmdViajes.CommandTimeout = 120
    $cmdViajes.Parameters.AddWithValue("@FechaInicio", $FechaProceso) | Out-Null

    $adapter  = New-Object System.Data.SqlClient.SqlDataAdapter($cmdViajes)
    $dataTable = New-Object System.Data.DataTable
    $adapter.Fill($dataTable) | Out-Null

    $totalRegistros = $dataTable.Rows.Count
    Write-Log "Registros obtenidos del SP: $totalRegistros"

    # ─── 5. Verificar si hay datos ───────────────────────────────────────────
    if ($totalRegistros -eq 0) {
        Write-Log "No hay viajes para la fecha $FechaProceso. Finalizando sin envío."
        $cmdCierre = $sqlConn.CreateCommand()
        $cmdCierre.CommandText = "EXEC dbo.sp_CerrarSync @IDEjecucion, @TotalRegistros, @RegistrosEnviados, @Estatus"
        $cmdCierre.Parameters.AddWithValue("@IDEjecucion",      $idEjecucion)  | Out-Null
        $cmdCierre.Parameters.AddWithValue("@TotalRegistros",   0)             | Out-Null
        $cmdCierre.Parameters.AddWithValue("@RegistrosEnviados",0)             | Out-Null
        $cmdCierre.Parameters.AddWithValue("@Estatus",          "SIN_DATOS")   | Out-Null
        $cmdCierre.ExecuteNonQuery() | Out-Null
        exit 0
    }

    # ─── 6. Construir el array JSON para Supabase ────────────────────────────
    Write-Log "Construyendo payload JSON ($totalRegistros registros)..."
    $registros = @()
    $idsViaje  = @()

    foreach ($row in $dataTable.Rows) {
        $idsViaje += $row["Id_Viaje"].ToString()

        $obj = [ordered]@{
            Id_Viaje          = [long]$row["Id_Viaje"]
            IDPedido          = if ($row["IDPedido"]   -is [DBNull]) { $null } else { [long]$row["IDPedido"] }
            CargaViaje        = if ($row["CargaViaje"] -is [DBNull]) { $null } else { [double]$row["CargaViaje"] }
            IDPlanta          = if ($row["IDPlanta"]   -is [DBNull]) { $null } else { [long]$row["IDPlanta"] }
            NombrePlantaViaje = if ($row["NombrePlantaViaje"] -is [DBNull]) { $null } else { $row["NombrePlantaViaje"].ToString() }
            IDUnidad          = if ($row["IDUnidad"]   -is [DBNull]) { $null } else { [long]$row["IDUnidad"] }
            NombreUnidad      = if ($row["NombreUnidad"] -is [DBNull]) { $null } else { $row["NombreUnidad"].ToString() }
            IDOperador        = if ($row["IDOperador"] -is [DBNull]) { $null } else { [long]$row["IDOperador"] }
            NombreOperador    = if ($row["NombreOperador"] -is [DBNull]) { $null } else { $row["NombreOperador"].ToString() }
            IDEstatusViaje    = if ($row["IDEstatusViaje"] -is [DBNull]) { $null } else { [long]$row["IDEstatusViaje"] }
            NombreEstatus     = if ($row["NombreEstatus"] -is [DBNull]) { $null } else { $row["NombreEstatus"].ToString() }
            FechaInicio       = if ($row["FechaInicio"] -is [DBNull]) { $null } else { $row["FechaInicio"].ToString() }
            HoraInicio        = if ($row["HoraInicio"] -is [DBNull]) { $null } else { $row["HoraInicio"].ToString() }
            HoraFin           = if ($row["HoraFin"]   -is [DBNull]) { $null } else { $row["HoraFin"].ToString() }
            IDObra            = if ($row["IDObra"]    -is [DBNull]) { $null } else { [long]$row["IDObra"] }
            NombreObra        = if ($row["NombreObra"] -is [DBNull]) { $null } else { $row["NombreObra"].ToString() }
            IDClienteSAE      = if ($row["IDClienteSAE"] -is [DBNull]) { $null } else { [long]$row["IDClienteSAE"] }
            NombreCliente     = if ($row["NombreCliente"] -is [DBNull]) { $null } else { $row["NombreCliente"].ToString() }
            IDUso             = if ($row["IDUso"]     -is [DBNull]) { $null } else { [long]$row["IDUso"] }
            NombreUso         = if ($row["NombreUso"] -is [DBNull]) { $null } else { $row["NombreUso"].ToString() }
            IDProducto        = if ($row["IDProducto"] -is [DBNull]) { $null } else { [long]$row["IDProducto"] }
            NombreProducto    = if ($row["NombreProducto"] -is [DBNull]) { $null } else { $row["NombreProducto"].ToString() }
            Remision          = $row["Remision"].ToString()
            CveCiudad         = if ($row["CveCiudad"] -is [DBNull]) { $null } else { $row["CveCiudad"].ToString() }
            NombreVendedor    = if ($row["NombreVendedor"] -is [DBNull]) { $null } else { $row["NombreVendedor"].ToString() }
        }
        $registros += $obj
    }

    # ─── 7. INSERT: enviar el lote completo en un solo request a Supabase ────
    # Si un Id_Viaje ya existe en Supabase, se salta y continua con el siguiente
    Write-Log "Enviando $totalRegistros registros a Supabase (bulk INSERT, ignorando duplicados)..."
    $insertUrl     = $supabaseUrl + "/rest/v1/" + $tablaDestino + "?on_conflict=Id_Viaje,Remision"
    $insertHeaders = $headers.Clone()
    $insertHeaders["Prefer"] = "return=minimal,resolution=ignore-duplicates"
    $jsonBody      = $registros | ConvertTo-Json -Depth 5 -Compress
    Write-Log ("INSERT URL: " + $insertUrl)

    # Debug: guardar el JSON para diagnóstico
    $debugFile = Join-Path $LogDir ("debug_payload_" + (Get-Date -Format "yyyyMMdd_HHmmss") + ".json")
    [System.IO.File]::WriteAllText($debugFile, $jsonBody, (New-Object System.Text.UTF8Encoding($false)))
    Write-Log ("JSON guardado en: " + $debugFile)

    # Forzar encoding UTF-8 sin BOM (PowerShell 5.1 lo necesita)
    $utf8Body = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)

    try {
        $insertResp = Invoke-WebRequest -Uri $insertUrl -Method POST `
                          -Headers $insertHeaders -Body $utf8Body -UseBasicParsing -ErrorAction Stop
        $httpStatus = $insertResp.StatusCode
        Write-Log ("INSERT completado exitosamente. HTTP " + $httpStatus)
    } catch {
        $errBody = "(no se pudo leer el cuerpo del error)"
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $errBody = $reader.ReadToEnd()
            $reader.Close()
        } catch {}
        $httpStatus = 0
        if ($_.Exception.Response) { $httpStatus = [int]$_.Exception.Response.StatusCode }
        $errMsg = "INSERT fallido HTTP " + $httpStatus + " - " + $errBody
        Write-Log $errMsg "ERROR"
        throw $errMsg
    }

    # ─── 9. Registrar detalle en SQL Server ──────────────────────────────────
    Write-Log "Registrando detalle de viajes enviados en Sync_Detalle..."

    # Construir DataTable para el TVP
    $tvp = New-Object System.Data.DataTable
    $tvp.Columns.Add("IDViaje",      [long])     | Out-Null
    $tvp.Columns.Add("Remision",     [string])   | Out-Null
    $tvp.Columns.Add("IDUnidad",     [long])     | Out-Null
    $tvp.Columns.Add("NombreUnidad", [string])   | Out-Null
    $tvp.Columns.Add("FechaViaje",   [datetime]) | Out-Null
    $tvp.Columns.Add("Estatus",      [string])   | Out-Null
    $tvp.Columns.Add("MensajeError", [string])   | Out-Null

    foreach ($r in $registros) {
        # PowerShell 5.1: no soporta ??, usar if/else equivalente
        $tvpIDUnidad     = if ($null -eq $r.IDUnidad)     { [DBNull]::Value } else { $r.IDUnidad }
        $tvpNombreUnidad = if ($null -eq $r.NombreUnidad) { [DBNull]::Value } else { $r.NombreUnidad }
        $tvpFecha        = if ($null -eq $r.FechaInicio -or $r.FechaInicio -eq "") { [DBNull]::Value } else { [datetime]$r.FechaInicio }

        $tvp.Rows.Add(
            $r.Id_Viaje,
            $r.Remision,
            $tvpIDUnidad,
            $tvpNombreUnidad,
            $tvpFecha,
            "ENVIADO",
            [DBNull]::Value
        ) | Out-Null
    }

    $cmdDetalle = $sqlConn.CreateCommand()
    $cmdDetalle.CommandText = "EXEC dbo.sp_RegistrarDetalleSync @IDEjecucion, @Detalle"
    $cmdDetalle.Parameters.AddWithValue("@IDEjecucion", $idEjecucion) | Out-Null
    $pDetalle = $cmdDetalle.Parameters.Add("@Detalle", [System.Data.SqlDbType]::Structured)
    $pDetalle.TypeName = "dbo.TVP_Sync_Detalle"
    $pDetalle.Value = $tvp
    $cmdDetalle.ExecuteNonQuery() | Out-Null

    # ─── 10. Cerrar ejecución como EXITOSO ───────────────────────────────────
    $cmdCierre = $sqlConn.CreateCommand()
    $cmdCierre.CommandText = "EXEC dbo.sp_CerrarSync @IDEjecucion, @TotalRegistros, @RegistrosEnviados, @Estatus, @HttpStatusCode"
    $cmdCierre.Parameters.AddWithValue("@IDEjecucion",       $idEjecucion)   | Out-Null
    $cmdCierre.Parameters.AddWithValue("@TotalRegistros",    $totalRegistros) | Out-Null
    $cmdCierre.Parameters.AddWithValue("@RegistrosEnviados", $totalRegistros) | Out-Null
    $cmdCierre.Parameters.AddWithValue("@Estatus",           "EXITOSO")       | Out-Null
    $cmdCierre.Parameters.AddWithValue("@HttpStatusCode",    $httpStatus)     | Out-Null
    $cmdCierre.ExecuteNonQuery() | Out-Null

    Write-Log "========================================================"
    Write-Log "Sincronización completada exitosamente. $totalRegistros registros enviados."
    Write-Log "========================================================"

} catch {

    # ─── Manejo de error global ───────────────────────────────────────────────
    $mensajeError = $_.Exception.Message
    Write-Log "ERROR durante la sincronización: $mensajeError" "ERROR"

    if ($idEjecucion -gt 0) {
        try {
            $cmdError = $sqlConn.CreateCommand()
            $cmdError.CommandText = "EXEC dbo.sp_CerrarSync @IDEjecucion, @TotalRegistros, @RegistrosEnviados, @Estatus, @HttpStatusCode, @MensajeError"
            $cmdError.Parameters.AddWithValue("@IDEjecucion",       $idEjecucion)      | Out-Null
            $cmdError.Parameters.AddWithValue("@TotalRegistros",    $totalRegistros)   | Out-Null
            $cmdError.Parameters.AddWithValue("@RegistrosEnviados", 0)                 | Out-Null
            $cmdError.Parameters.AddWithValue("@Estatus",           "ERROR")           | Out-Null
            $cmdError.Parameters.AddWithValue("@HttpStatusCode",    [DBNull]::Value)   | Out-Null
            $cmdError.Parameters.AddWithValue("@MensajeError",      $mensajeError)     | Out-Null
            $cmdError.ExecuteNonQuery() | Out-Null
        } catch {
            Write-Log "No se pudo registrar el error en SQL Server: $($_.Exception.Message)" "ERROR"
        }
    }
    exit 1

} finally {
    if ($sqlConn -and $sqlConn.State -eq "Open") {
        $sqlConn.Close()
        Write-Log "Conexión SQL Server cerrada."
    }
}
