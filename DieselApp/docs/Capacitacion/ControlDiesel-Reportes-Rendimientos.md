# Reporte de Rendimientos Vehiculares

Versión: 1.0  
Fecha: 2026-03-04  
Sistema: Control de Diésel  
Clasificación: Documento de Capacitación y Control Interno

---

## 1. Objetivo de Control

Identificar inequívocamente la ineficiencia mecánica de las unidades operativas y visibilizar mermas o fugas en ruta por ordeñas ilícitas, aplicando cálculos matemáticos automáticos inalterables que cruzan litros asimilados de combustible frente al desplazamiento avalado (Kms. y Hrs.).

## 2. Alcance

Impacta los procesos de:

- Rendimiento por unidad (Evaluación de eficiencia energética y castigos).
- Taller O Logística Preventivo (Detección de motores disfuncionales o fuera de rango).
- Control de operadores estricto.

## 3. Perfiles Autorizados y Segregación de Funciones

- **Consulta:** Gerencia de Flota, Jefe de Taller, Analistas de Transporte y Auditoría de Eficiencia.
- **Autorización de Edición Inline:** Administradores Maestros o Coordinador Especial que deban justificar y purificar equivocaciones del apuntador primitivo de patio protegiendo la métrica macro.

## 4. Descripción Funcional General

Elabora un conglomerado condensado sin desglosar todos los días, limitándose a mostrar los Totales Acumulados engrapando "Tanque" con "Unidad", procesando matemáticamente el umbral más lejano y cercano del cuentakilómetros o cronómetros limitados al rango de fechas introducido, aislando puros despachos (Salidas tipo "S"). Protegido contra la temible "división entre cero" para obviar rupturas e imprecisiones.

## 5. Elementos de la Interfaz

| Elemento                     | Tipo                  | Obligatorio | Validación                                                                    | Riesgo que Mitiga                                                                           |
| ---------------------------- | --------------------- | ----------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Fecha Incial / Fecha Final   | Rango Date            | Sí          | Rango restrictivo                                                             | Peticiones al vacío que carezcan de fundamento volumétrico temporal exacto.                 |
| Ciudad / Tanque              | Selectores Opcionales | No          | Condicionados y encadenados                                                   | Restringir estudios solo a áreas preocupantes o anomalias conocidas por supervisores.       |
| Kms / Hrs Recorridos         | Campo Calculado       | N/A         | Resta (Dato Mayor - Dato Menor)                                               | Suplir lecturas inconsistentes ocultando rendimientos malos.                                |
| Kms/Lts y Hrs/Lts            | Campo Divisorio       | N/A         | Usa `NULLIF` del divisor                                                      | Inutilización de bases con caídas críticas de división matemática `Divide by Zero`.         |
| Modal de Detalle Interactivo | Vista Edición         | N/A         | Limitación a 4 parámetros (`Litros`, `CuentaLitros`, `Horometro`, `Odometro`) | Ocultar que un capturista alterado introdujo 400 lts a un vehículo con tanque para 200 lts. |

## 6. Flujo Operativo Controlado

1. **Punto de Entrada Focalizado:** El analista busca los resultados semanales requiriendo Rango Fijo para detectar unidades ociosas o robadas en la etapa productiva contigua.
2. **Generación Segura:** Consumo de RPC estricta (`reporte_rendimientos`).
3. **Exploración Selectiva:** Filtrar métricas paupérrimas donde el Indicador (Kms/Lts) se exhiba notablemente por debajo del umbral mínimo de diseño del motor del fabricante.
4. **Validación (Drill-Down Edición):** Si se avista una distorsión descomunal y la causa es probada documentalmente por vales físicos contraídos de error humano al tipear (v.g. Se digitó 40 kilómetros en vez de 4000), el Auditor autorizado utiliza el Modal Detalle.
5. **Corrección de Transacción Profunda:** Con botón "Editar", modifica transitoriamente sus campos permitiendo enderezar las métricas mediante inyección SQL paralela segura (Botón "Ok").

## 7. Reglas de Negocio Críticas

- Filtra contundentemente, absorbiendo pura materia enajenada de tipo "S", invalidando registros de inyecciones "E".
- Condensa la tabla al suprimir las separaciones nominales por días individuales de `Fecha`, agrupando directamente todo el rango cronometrado en un solo nodo Tanque-Unidad.
- La edición _Inline_ implementada es atómica; restringe forzosamente la mutación alterando permanentemente datos del histórico del resguardo original `TanqueMovimiento` sin duplicidad.

## 8. Evidencia Generada

- Un mapeo consolidado visible que rastrea el valor final del aprovechamiento por consumo.
- Rastro explícito incrustando las correcciones si la auditoría cruzada posterior reclama a los supervisores por enmascarar descensos sospechosos de kilometraje después de un análisis externo.

## 9. Riesgos Operativos si No se Utiliza Correctamente

- Desconocimiento absoluto y fatal de robo hormiga por parte de operadores vendiendo cuotas fraccionarias no medidas por cada 200 litros entregados.
- Negligencia extrema donde vehículos sin usar acaparan cuotas continuas asignadas fantásticamente en las bitácoras.

## 10. Escenarios de Auditoría

- **Validadores de Rendimiento Extremo:** Buscar activaciones repetitivas donde el cálculo de Recorrido arroje cero sobre cuantiosos suminstros del derivado, derivando en intercepción e interrogatorio al conductor y despachador del patio.
- **Cuadratura documental de "Editar Detalle":** Auditor contrata una mesa para forzar comprobación: Solicitud de vales físicos (Remisiones Originales) vs correcciones exactas efectuadas temporalmente bajo la pantalla analítica.

## 11. Consideraciones para Capacitación

- Demostrar el concepto analítico donde la cifra inferior de Horómetros sobre Volumen denota fugas o usos clandestinos estacionarios, requiriendo dominio imperativo del indicador.
- Hacer extrema claridad en el uso de la Edición de Detalles advirtiendo sobre las posibles responsabilidades civiles tras el levantamiento encubierto de faltas disciplinarias por parte del administrador de flotilla autorizante.
