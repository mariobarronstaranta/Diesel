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

- **Modal de Detalle (`ReporteProductividadDetalleModal`)**:
  - Pestañas separadas para detallar movimientos de `TanqueMovimiento` (Mov. Diesel) e `InformacionGeneral_Cierres` (Mov. SP) a nivel de viaje individual.
  - **Cálculo de Consumo de Viaje**: A falta de captura de origen de la unidad que no registró Diésel, se permite ver los movimientos y remisiones asociadas de forma cruda con su carga asociada en $m^3$.
  - **Cálculo de Dinámica de Odómetro/Horómetro**: Resta automática del último evento al primero del periodo seleccionado para identificar el avance puro.
  - **Prevención de Errores Vía Nulls**: Filtros adaptados para no chocar con las _Unidades No Registradas_ y conversión en memoria de las fechas de `InformacionGeneral_Cierres` dadas por formato incompatible con PostgREST (`M/D/YYYY`).

## ✅ Estado: Completado

---

_Documentación generada automáticamente como parte del seguimiento de desarrollo con IA._
