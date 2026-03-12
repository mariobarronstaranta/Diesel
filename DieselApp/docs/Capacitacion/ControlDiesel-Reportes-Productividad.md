# Reporte de Productividad y Rentabilidad

Versión: 1.1  
Fecha: 2026-03-11  
Sistema: Control de Diésel  
Clasificación: Documento de Producto, Capacitación y Control Interno (Orientado a Product Owner / Usuarios Finales)

---

## 1. Visión del Producto y Objetivo de Negocio (Valor Añadido)

**Objetivo Estratégico:**  
Dotar a la Gerencia de una visión 360° que cruza la operación logística (volumen de concreto entregado en $m^3$ y viajes realizados) con el gasto energético (diésel consumido, kilómetros y horas). Esto permite responder a la pregunta de negocio crucial: _"¿Cuánto combustible nos está costando entregar cada metro cúbico de concreto?"_

**Valor para el Negocio (ROI):**

- **Optimización de Rentabilidad:** Identifica instantáneamente qué unidades de transporte (camiones revolvedores) están siendo rentables y cuáles representan un gasto excesivo de combustible por viaje.
- **Detección de "Viajes Fantasma" o Fugas:** Al cruzar las cargas registradas en la báscula (Sistema de Producción) contra las salidas de combustible de la bomba (Sistema de Diésel), alerta sobre unidades que consumen diésel pero no registran viajes logísticos.
- **Toma de Decisiones Visual:** Mediante semaforización automática del costo energético ($L/m^3$), permite a la dirección sancionar, premiar o auditar operadores de un vistazo rápido.

## 2. Alcance e Impacto Operativo

El módulo es el punto culminante de la aplicación, uniendo dos mundos (Operación y Mantenimiento), e impacta en:

- **Productividad Logística:** Evaluación del cumplimiento de viajes ($m^3$/Viaje).
- **Rendimiento Mecánico:** Diagnóstico del estado del motor ($Km/L$ y $Hrs/L$).
- **Costo Energético:** Indicador financiero de litros por metro cúbico.

## 3. Perfiles de Usuario y Segregación de Funciones

- **Consumo Directivo (Gerentes, Directores y Product Owners):** Utilizan el dashboard consolidado para analizar la rentabilidad global de una ciudad o planta.
- **Auditoría Logística (Jefes de Transporte y Taller):** Analizan el detalle minucioso a nivel "Viaje" para detectar ineficiencias de ruteo o desgaste mecánico.

## 4. Descripción Funcional General

El sistema cruza de manera automatizada dos fuentes de datos independientes:

1. **El Historial de Surtimientos de Diésel:** Lo que salió de la bomba hacia la unidad.
2. **Los Cierres de Producción (Información General):** Los viajes de concreto (SP) que la revolvedora llevó a la obra.

El reporte presenta un conglomerado totalizado en el rango de fechas seleccionado. Para lograr una experiencia fluida, el sistema invisibiliza ceros inútiles ($0.00$ se muestra como `-`) e identifica claramente las unidades foráneas o "No Registradas" (Unidades que cargaron concreto en planta pero no pertenecen al catálogo de DieselApp).

## 5. Elementos de la Interfaz, Semáforos y Criterios de Aceptación (UX/UI)

| Componente                     | Tipo          | Criterio de Aceptación / Lógica de Negocio                          | Riesgo de Negocio que Mitiga                                                     |
| :----------------------------- | :------------ | :------------------------------------------------------------------ | :------------------------------------------------------------------------------- |
| **Piltros Principales**        | Controles     | Fecha de inicio, fin, Ciudad y Tanque.                              | Acotar consultas masivas y generar rentabilidad por centro de costo.             |
| **Alerta "No Registrado"**     | Badge UX      | Unidades de otras plazas operando localmente se marcan visualmente. | Previene la confusión corporativa al ver camiones fantasmas en el listado local. |
| **Costo Energético ($L/m^3$)** | KPI Divisorio | Total de Litros $\div$ Carga Total ($m^3$).                         | Es el KPI "Reina" para medir la rentabilidad operativa.                          |
| **KPI Verde (Excelente)**      | Semáforo      | $L/m^3 < 3.5$                                                       | Recompensa visual a operaciones altamente eficientes.                            |
| **KPI Amarillo (Atención)**    | Semáforo      | $L/m^3$ está entre $3.5$ y $5.0$                                    | Zona de advertencia temprana para ajustar rutas o mantenimientos.                |
| **KPI Rojo (Crítico)**         | Semáforo      | $L/m^3 > 5.0$ o Exceso en Consumo.                                  | Foco de auditoría urgente: Posible ordeña o motor dañado.                        |

## 6. Flujo Operativo y de Toma de Decisión (User Journey)

1. **Visión Macro:** El Product Owner o Gerente selecciona un mes o una semana crítica y la Ciudad a revisar.
2. **Escaneo de Rentabilidad:** La vista se enfoca directamente en la columna semaforizada de $L/m^3$. Los registros en Rojo captan la atención de inmediato.
3. **Identificación del Problema:** Al ver un camión en "Rojo", se revisan sus columnas adyacentes: ¿Consumió demasiado diésel (Lts) o acaso hizo muy pocos viajes de concreto ($m^3$)?
4. **Análisis de Profundidad (Drill-Down):** Para no quedarse con la duda, el usuario hace clic en el registro y despliega la **Ventana Modal de Detalle**.

## 7. Modal de Detalle Interactivo (Auditoría Microscópica)

La ventana modal divide analíticamente los dos mundos involucrados en la rentabilidad de la unidad, permitiendo una "auditoría de escritorio" sin pedir un solo papel:

### Pestaña A: Movimientos Diésel

Muestra cada gota de diésel cargada entre la fecha de inicio y fin, detallando la ciudad, tanque, fecha exacta y los odómetros de la carga.

- **Valor Agregado:** Calcula dinámicamente y muestra el "Agregado Total" de Kilómetros y Horas en la parte inferior, tomando la resta entre la lectura del evento final menos la del primer evento del periodo. Esto certifica el desgaste mecánico real en ruta.

### Pestaña B: Movimientos Sistema de Producción (Viajes)

Muestra cada viaje o remisión que la unidad le entregó a un cliente. Contiene el número de remisión, el estatus de la entrega y el volumen ($m^3$) de concreto transportado en ese momento.

- **Valor Agregado:** Permite al auditor validar si un alto consumo de diésel está correlacionado con una agenda saturada de viajes largos de concreto, o si por el contrario, la revolvedora gastó 300 litros de diésel pero solo realizó un solo viaje de $3m^3$ en toda la semana (indicativo de ordeña o fuga mecánica grave).

### Pestaña C: Productividad por Carga (Correlación Automática)

Muestra el cruce analítico entre las recargas de Diésel registradas en la *Pestaña A* y los viajes realizados en la *Pestaña B*. Esta funcionalidad toma cada recarga de combustible como un "punto de inicio" y evalúa la productividad generada hasta la siguiente recarga.

- **Métricas Analizadas:**
  - Cantidad de Viajes realizados con esos litros específicos.
  - Sumatoria del Volumen ($m^3$) de concreto transportado gracias a esa carga.
  - Resta de Odómetros (Kms recorridos) y Horómetros (Hrs trabajadas) entre una recarga y la siguiente.
  - Indicadores de Rendimiento Puros: **Kms/Lts** y **Hrs/Lts** por cada carga individual.
- **Valor Agregado:** Transforma el análisis cualitativo en un KPI cuantitativo por ticket de carga. Permite determinar exactamente con qué recarga de combustible el camión fue rentable y en qué momento preciso ocurrió una baja repentina de rendimiento de $Kms$ por Litro (posible falla mecánica u ordeña focalizada), calculado mediante las marcas de fecha y hora exacta de cada evento.

## 8. Riesgos Operativos de Negocio si no se Utiliza Correctamente

- **Subsidio de Fugas:** Mantener operaciones donde cuesta más el diésel invertido que el margen de ganancia que deja el flete del concreto.
- **Ceguera Logística:** No detectar cuando unidades foráneas o subcontratadas están consumiendo los recursos energéticos del centro de costo local sin registrar productividad suficiente.

## 9. Notas de Adopción y Capacitación para Product Owners / Gerencia

- **La Historia detrás del Número:** Se debe capacitar a los usuarios para no tomar el semáforo rojo como una sanción automática, sino como un detonador de investigación hacia la Modal de Detalle. Un semáforo rojo por bajo volumen ($m^3$) suele ser culpa de Logística por no asignarle viajes al chofer, mientras que un rojo por excesivos "Litros" sin kilómetros, suele ser un problema de Taller o Control de Confianza.
- **Adaptación Cultural:** Hacer entender al usuario que los valores en ceros totales ($0.00$) se limpian visualmente a guiones (`-`) para facilitar la lectura y enfocarse en los números que sí aportan peso estadístico a la empresa.
