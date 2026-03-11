# Reporte de Rendimientos Vehiculares

Versión: 1.2  
Fecha: 2026-03-11  
Sistema: Control de Diésel  
Clasificación: Documento de Producto, Capacitación y Control Interno (Orientado a Product Owner / Stakeholders)

---

## 1. Visión del Producto y Objetivo de Negocio (Valor Añadido)

**Objetivo Estratégico:**  
Brindar a la Gerencia y Dirección una herramienta infalible para auditar la inversión en combustible, identificando inequívocamente la ineficiencia mecánica de las unidades operativas y visibilizar mermas o fugas en ruta por ordeñas ilícitas.

**Valor para el Negocio (ROI):**

- **Reducción de Costos:** Disminución drástica de mermas y "robo hormiga" de combustible.
- **Mantenimiento Oportuno:** Identificación temprana de motores disfuncionales o fuera de rango (Kms/Lts o Hrs/Lts por debajo del umbral óptimo).
- **Transparencia Financiera:** Cálculos matemáticos automáticos inalterables que cruzan litros asimilados de combustible frente al desplazamiento avalado (Kms. y Hrs.).

## 2. Alcance e Impacto Operativo

Impacta directamente los procesos críticos de la empresa:

- **Evaluación de Rendimiento por Unidad:** Generación de KPIs de eficiencia energética (Kms/L y Hrs/L) para aplicar procesos de mejora o acciones correctivas.
- **Mantenimiento y Logística Preventiva:** Detección automática de motores que requieren ajuste urgente.
- **Auditoría y Control de Operadores:** Seguimiento estricto al comportamiento de consumo por chofer y ruta.

## 3. Perfiles de Usuario y Segregación de Funciones

- **Consulta (Lectura de Dashboards/Reportes):** Gerencia de Flota, Jefe de Taller, Analistas de Transporte y Auditoría de Eficiencia. Estos roles consumen la información para la toma de decisiones.
- **Autorización de Edición Inline (Corrección de Excepciones):** Administradores Maestros o Coordinadores que deban justificar y purificar equivocaciones del apuntador primitivo de patio, protegiendo siempre la trazabilidad del dato.

## 4. Descripción Funcional General

El sistema prioriza una experiencia de usuario que evita la "fatiga de datos":

- Elabora un conglomerado condensado sin necesidad de desglosar transacciones diarias individuales, limitándose a mostrar los **Totales Acumulados** estructurados por "Tanque" y "Unidad".
- Procesa automáticamente el cálculo tomando el cuentakilómetros/cronómetro más lejano y cercano dentro del rango de fechas seleccionado.
- Aísla exclusivamente despachos operativos reales (Salidas tipo "S").
- Incorpora protección algorítmica contra la "división entre cero" para garantizar la estabilidad del dashboard.

## 5. Elementos de la Interfaz y Criterios de Aceptación (UX/UI)

| Componente                    | Tipo            | Obligatorio | Criterio de Aceptación / Validación                                                                                   | Riesgo de Negocio que Mitiga                                                                              |
| :---------------------------- | :-------------- | :---------- | :-------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| **Fecha Inicial / Final**     | Rango Date      | Sí          | Rango restrictivo y obligatorio. El formulario bloquea el envío si alguna fecha está vacía.                           | Evita consultas masivas no delimitadas que saturen la BD o den acumulados erróneos.                       |
| **Ciudad**                    | Selector        | **Sí**      | Campo obligatorio. Habilita los filtros Tanque y Unidad. Al cambiar, ambos filtros dependientes se resetean.          | Garantiza que los combos dependientes siempre muestren datos de la sucursal correcta.                     |
| **Tanque**                    | Selector        | No          | Filtro opcional. Valor por defecto: *(Todos)*. Solo se habilita tras seleccionar Ciudad.                              | Permite aislar un tanque específico con sospecha de desviación o asociado a una unidad en investigación.  |
| **Unidad**                    | Selector        | No          | Filtro opcional en cascada. Con Tanque=(Todos) muestra todas las unidades con movimientos en la ciudad. Al seleccionar un tanque específico, recarga automáticamente mostrando solo las unidades asociadas a ese tanque. | Permite rastrear el historial de consumo de una unidad individual para auditoría de operador.             |
| **Kms / Hrs Recorridos**      | Campo Calculado | N/A         | Diferencia exacta (Lectura Mayor - Lectura Menor del periodo).                                                        | Mitiga el riesgo de cargar costos a unidades que en realidad estuvieron inoperativas (cero avance).       |
| **Kms/Lts y Hrs/Lts (KPI)**   | Campo Divisorio | N/A         | Implementación matemática `NULLIF` como divisor algebraico.                                                           | Garantiza la estabilidad del dashboard (evita quiebres por errores técnicos de `Divide by Zero`).         |
| **Modal Detalle Interactivo** | Vista Data-Grid | N/A         | Edición limitada a rubros clave (`Litros`, `CuentaLitros`, `Horometro`, `Odometro`).                                 | Impide justificar manipulaciones de aforo excediendo la capacidad documentada de los tanques vehiculares. |

## 6. Flujo Operativo y de Toma de Decisión (User Journey)

1. **Punto de Entrada Focalizado:** El Product Owner o Gerente consulta el reporte semanal delimitando un rango temporal, con el fin de detectar unidades con alto consumo injustificado.
2. **Carga Ágil y Consolidada:** El frontend consume el procedimiento central (`reporte_rendimientos`) de forma optimizada.
3. **Exploración de la Métrica (KPI):** Se detectan proactivamente las unidades con métricas deficientes, donde el rendimiento (Kms/Lts) se ubica bajo el umbral mínimo del fabricante.
4. **Validación (Drill-Down / Modal de Edición):** Al percibir distorsiones atípicas, el Auditor se remite a los vales físicos. Si la causa raíz es "error de dedo" del capturista en patio (ej. introdujo 40 kms en vez de 4000), el perfil autorizado detona el Modal de Detalle.
5. **Corrección Trazable y Profunda:** Mediante inyección directa, audita y corrige los valores, enderezando las métricas globales instantáneamente de manera atómica, controlada y sin redundancias de registros.

## 7. Reglas de Negocio Críticas (Para Desarrollo y QA)

- **Filtro Estricto de Movimientos:** Deben absorberse puramente salidas/enajenación de combustible (tipo "S"). Se invalidan totalmente inyecciones "E" para cálculos de consumo de unidad.
- **Agrupación Temporal Condensada:** Los registros nominales por días individuales desaparecen en esta visualización matriz; se consolida todo el historial temporal cronometrado a una sola fila por nodo "Tanque-Unidad".
- **Atomicidad de la Corrección:** La edición _Inline_ debe mutar irreversible pero transparentemente el histórico subyacente (`TanqueMovimiento`), actualizando las relaciones operativas sin multiplicar renglones u omitir rastro.
- **Criterio unificado de Unidades:** El combo de Unidad extrae su catálogo exclusivamente de `TanqueMovimiento`, no del catálogo general de `Unidades`. Esto garantiza que solo aparezcan unidades con movimientos reales registrados, manteniendo coherencia entre el filtro por tanque individual y el modo "Todos".

## 8. Evidencias y Valor Entregable

- Visualización integral de auditoría que rastrea el valor real de aprovechamiento del derivado energético.
- Rastro analítico irrefutable: si un gerente aplica correcciones al alza o baja, sus intervenciones quedan plasmadas y listas para revisiones corporativas subsecuentes ante caídas sospechosas post-análisis.

## 9. Riesgos Operativos de Negocio si no se Utiliza Correctamente

- **Pérdida Económica Oculta:** Ignorancia y normalización corporativa de fraudes o ventas ilícitas y fraccionarias por parte de operadores desde los propios tanques en ruta.
- **Presupuestos Ficticios:** Negligencia al sostener dotaciones de combustible irreales sobre vehículos acaparadores que operativamente no salieron de base.

## 10. Escenarios de Auditoría (Casos de Uso Corporativos)

- **Investigación de Rendimiento Cero:** Localización de surtimientos volumétricos recurrentes cuyo odómetro arroje cero kilómetros finales; lo cual detona automáticamente investigaciones cruzadas con operadores y el área de recursos humanos.
- **Comprobatoria Documental del "Modal de Edición":** Verificaciones selectivas donde las altas directivas solicitan los comprobantes (vales o tickets originales de patio) para validar que la corrección inyectada por el Jefe de Flota vía el Modal coincida a perfección.

## 11. Notas de Adopción y Capacitación para Product Owners / Gerencia

- **Saber leer las fugas indirectas:** Entrenar el ojo sobre los "Horómetros". Una métrica demasiado inferior combinada con alto volumen puede denotar el uso ilícito de encendido en aparcamientos sin trayecto o "tomas de fuerza" no justificadas.
- **Implicación Administrativa:** Concientización a nivel dirección, el usar la capacidad del Modal de Edición no es trivial; altera los estados de resultados que Finanzas aprueba, por lo cual tiene impacto contable y potencial legal sobre el empleado autorizante.
