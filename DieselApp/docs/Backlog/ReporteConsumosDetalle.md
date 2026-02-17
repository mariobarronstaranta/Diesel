# 📋 Reporte de Detalle de Consumos (Modal)

**Estado:** 🟡 En Desarrollo (Fase Visual)  
**Prioridad:** Alta  
**Ubicación:** Llamado desde `ReporteConsumos` (Botón "Ver Detalle")

---

## 📋 Descripción General

Este componente es un modal que muestra el desglose detallado de los movimientos de combustible (entradas y salidas) para un tanque y fecha específicos seleccionados en el reporte principal de consumos.

---

## 🔧 Requerimientos Funcionales

1.  **Activación:** Debe abrirse al hacer clic en el botón "Ver Detalle" de una fila en el reporte de consumos.
2.  **Organización:** Los movimientos deben estar separados por tipo (Entradas y Salidas).
3.  **Visualización:** Uso de tablas claras con encabezados descriptivos.
4.  **Exportación:** La tabla de Salidas debe contar con una opción de exportación a CSV específica.

---

## 📊 Estructura de Tablas

### 1. Movimientos de Entradas
| Columna | Descripción |
| :--- | :--- |
| **Fecha** | Fecha del movimiento |
| **Litros** | Cantidad de combustible ingresada |
| **Planta** | Nombre de la planta |
| **Tanque** | Nombre del tanque |
| **CuentaLitros** | Lectura del medidor |

### 2. Movimientos de Salidas
| Columna | Descripción |
| :--- | :--- |
| **Fecha** | Fecha del movimiento |
| **Hora** | Hora exacta |
| **Temperatura** | Temperatura registrada |
| **Litros** | Cantidad de combustible despachada |
| **Tanque** | Nombre del tanque |
| **Unidad** | Vehículo/Unidad que recibió el combustible |
| **CuentaLitros** | Lectura del medidor |

---

## 💻 Notas de Implementación (Fase Visual)

- Se utilizará `react-bootstrap/Modal` y `react-bootstrap/Tabs`.
- Los datos mostrados serán estáticos (mock data) para validación del cliente.
- El diseño debe ser responsivo y consistente con los colores institucionales.