# ReporteLecturas

## Propósito
Consultar, visualizar y exportar lecturas diarias; además permite detallar, editar y desactivar registros de lecturas.

## Dependencias
- `react`, `react-bootstrap`, `react-hook-form`
- Componente interno: `ComboCveCiudad`
- `supabase` client local

## Entradas del formulario
- `CveCiudad`
- `FechaInicial`
- `FechaFinal`

## Estado interno
- Consulta principal: `isLoading`, `alertMessage`, `lecturas`
- Modal detalle: `showModal`, `detalleLecturas`, `isModalLoading`, `modalError`, `infoFilaSeleccionada`
- Edición: `editingId`, `editForm`
- Reconsulta: `lastQueryParams`

## Integración de datos
1. **Consulta agregada**
   - RPC: `sp_obtener_lecturas_diarias(p_ciudad, p_fecha_inicial, p_fecha_final)`
2. **Detalle por tanque/fecha**
   - RPC: `fn_obtener_lecturas_por_fecha(p_fecha, p_tanque)`
3. **Edición**
   - Tabla: `TanqueLecturas` (`update` por `IDTanqueLecturas`)
4. **Eliminación lógica**
   - Tabla: `TanqueLecturas` (`Activo = 0`)

## Funcionalidad destacada
- Ordena resultados por fecha y nombre de tanque.
- Tabla con encabezado multinivel (altura y cuenta litros inicial/final).
- Exportación a CSV con BOM UTF-8 para compatibilidad en Excel.
- Modal con edición inline y acciones de eliminar/actualizar.

## Validaciones
- Fechas obligatorias.
- `FechaFinal` no puede ser menor que `FechaInicial`.
- En edición modal, exige campos no vacíos antes de actualizar.
