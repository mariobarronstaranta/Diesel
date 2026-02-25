# Bitácora: Dashboard en Reportes + Edición en Detalle de Rendimientos

**Fecha**: 2026-02-24

---

## Actividad 1: Mover Dashboard al menú de Reportes

### Objetivo

Reorganizar la navegación para que el **Dashboard** no sea un link directo en la barra principal, sino que esté dentro del dropdown de **Reportes** como primera opción.

### Cambios Realizados

#### Archivo: `src/components/TopNav.tsx`

- Se eliminó el `<NavLink>` directo de Dashboard (📊 Dashboard).
- Se agregó como primer `<Dropdown.Item>` dentro del dropdown de Reportes.
- Se agregó un `<Dropdown.Divider />` para separar Dashboard de los demás reportes.

### Resultado

El menú de Reportes ahora contiene:

1. 📊 Dashboard
2. ─── (separador)
3. Lecturas
4. Consumos
5. Rendimiento

---

## Actividad 2: Edición inline en modal de detalle de Rendimientos

### Objetivo

Permitir la edición de los campos **Litros**, **Cuenta Litros**, **Horómetro** y **Odómetro** en la tabla del modal de detalle del Reporte de Rendimientos, replicando el patrón ya implementado en el modal de Consumos.

### Análisis Previo

- El modal de Consumos (`ReporteConsumosDetalleModal.tsx`) ya tenía esta funcionalidad.
- La tabla `TanqueMovimiento` en Supabase ya tiene permisos de UPDATE configurados.
- El detalle de Rendimientos ya retorna `id_tanque_movimiento` (PK necesaria para el UPDATE).
- **No se requirieron cambios en Supabase (backend).**

### Cambios Realizados

#### Archivo: `src/components/ReporteRendimientosDetalleModal.tsx`

1. **Import**: Se agregó `Form` de react-bootstrap.
2. **Estados de edición**:
   - `editingId`: ID del movimiento en edición (`null` = ninguno).
   - `editForm`: Objeto con los 4 campos editables.
   - `isUpdating`: Flag para deshabilitar botones durante el guardado.
3. **`handleEditStart(m)`**: Valida que exista `id_tanque_movimiento`, pobla el formulario con valores actuales.
4. **`handleUpdate(id)`**: Ejecuta `supabase.from("TanqueMovimiento").update({...}).eq("IdTanqueMovimiento", id)`, luego recarga datos.
5. **Columna "Acción"**: Botones Editar / Ok / X por fila.
6. **Celdas condicionales**: Los 4 campos muestran `<Form.Control type="number">` cuando la fila está en edición, texto formateado cuando no.
7. **Alerta "Actualizando..."**: Se muestra durante el guardado.

### Mapeo de columnas

| Campo UI      | Columna en `TanqueMovimiento` |
| :------------ | :---------------------------- |
| Litros        | `LitrosCarga`                 |
| Cuenta Litros | `CuentaLitros`                |
| Horómetro     | `Horimetro`                   |
| Odómetro      | `Odometro`                    |

### Verificación

- ✅ TypeScript compila sin errores
- ✅ Columna Acción visible con botón Editar
- ✅ Inputs numéricos aparecen al hacer clic en Editar
- ✅ Ok guarda y recarga datos
- ✅ X cancela sin guardar
- ✅ Solo una fila editable a la vez

---

## Documentación Actualizada

- `docs/components/ReporteRendimientos.md` — Sección de Modal de Detalle con campos editables
- `docs/components/TopNav.md` — Rutas y estructura visual actualizadas
- `CHANGELOG.md` — Entradas en sección [Unreleased]
