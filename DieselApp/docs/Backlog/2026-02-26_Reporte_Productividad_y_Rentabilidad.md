# Backlog: Reporte de Productividad y Rentabilidad

## 📝 Descripción

Este requerimiento nace de la necesidad de cruzar la información de la operación de transporte (viajes y carga útil en $m^3$) con la información de consumo energético (diésel, kilómetros y horas). El objetivo es medir la rentabilidad operativa de cada camión revolvedor (CR).

## 📅 Fecha de Implementación

**2026-02-26**

## 💡 KPIs Implementados

1.  **Costo Energético ($L/m^3$)**: Litros consumidos entre metros cúbicos entregados.
2.  **Productividad Logística ($m^3/Viaje$)**: Metros cúbicos totales entre cantidad de viajes.
3.  **Rendimiento Mecánico ($Km/L$)**: Kilómetros recorridos entre litros consumidos.

## 🛠️ Componentes Técnicos

### Base de Datos

- **Función RPC**: `public.reporte_productividad`
  - **Input**:
    - `p_fecha_inicio` (date)
    - `p_fecha_fin` (date)
    - `p_cve_ciudad` (text, opcional)
    - `p_id_tanque` (bigint, opcional)
  - **Lógica**:
    - `LEFT JOIN` doble para particionar cálculos:
      - `Recorridos_CTE`: Obtiene Kilómetros y Horas Totales globalmente por unidad mediante `MAX - MIN`.
      - `Consumos_CTE`: Obtiene Litros consumidos por centro de costo/tanque.
    - Detección de `EstadoRegistro` (Registrada vs No Registrada).
    - Cálculos de eficiencia protegidos contra división por cero (`NULLIF`).

### Interfaz de Usuario (React)

- **Filtros**: Ciudad, Tanque (opcional), Rango de Fechas.
- **Tabla de Resultados**:
  - **Orden Lógico**: Columnas ordenadas priorizando lo operativo (Lts, Kms, Hrs) y después lo logístico (Carga, Eficiencias).
  - **Reducción de Carga Visual UX**: Valores en $0$ o $0.00$ se renderizan como guiones cortos (`-`).
  - **Semáforo Rojo**: $L/m^3 > 5.0$
  - **Semáforo Amarillo**: $L/m^3$ entre $3.5$ y $5.0$
  - **Semáforo Verde**: $L/m^3 < 3.5$
  - **Identificación de Unidades**: Badge rojo para unidades no registradas en DieselApp pero con actividad en báscula.

## ✅ Estado: Completado

---

_Documentación generada automáticamente como parte del seguimiento de desarrollo con IA._
