# Captura de Lecturas Diarias

Versión: 1.0  
Fecha: 2026-03-04  
Sistema: Control de Diésel  
Clasificación: Documento de Capacitación y Control Interno

---

## 1. Objetivo de Control

Establecer un corte fotográfico temporal confiable del estado volumétrico físico del inventario pasivo. Mitiga el riesgo de encubrir merma, robos nocturnos, fugas físicas de los tanques de contención o fallos críticos en cuenta-litros estáticos.

## 2. Alcance

Impacta los procesos de:

- Inventario Físico (Puro, no teórico).
- Detecciones y reclamos de seguros o mantenimiento (fugas/derrames de patio).
- Reportes gerenciales (Cortes diarios contables).
- Conciliación administrativa periódica (Cuadre Físico vs Teórico).

## 3. Perfiles Autorizados y Segregación de Funciones

- **Consulta:** Interventores y Operadores Gerenciales Administrativos.
- **Captura:** Gestor o Supervisor de Bodega / Patio al inicio y fin del turno laboral.
- **Edición:** Denegado o altamente restringido (involucra base inmutable de tabla paralela `TanqueLecturas`).
  Explicación: El registro fotográfico lo realiza el jefe físico, pero el sistema retiene el log ("IDUsuarioRegistro") permanentemente sin perdonar ediciones de "retractación".

## 4. Descripción Funcional General

Esta pantalla asienta la lectura observada directamente de los instrumentos al costado del tanque y del dispensador en un momento definido, independientemente de si ocurren despachos ni recepciones. Provee el ancla teórica de inicio (Corte/Aforo) con un lapso muy controlado y retroactividad mínima permitida de no más de 48 hrs.

## 5. Elementos de la Interfaz

| Elemento      | Tipo      | Obligatorio | Validación                                                                         | Riesgo que Mitiga                                                                                         |
| ------------- | --------- | ----------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Ciudad        | Selección | Sí          | Requerido con cascadas dependientes totales.                                       | Medición errónea enviada a otra entidad.                                                                  |
| Planta        | Selección | Sí          | Cuna organizacional intermedia dependiente de Ciudad.                              | Asentamiento en patio o sitio corporativo falso.                                                          |
| Tanque        | Selección | Sí          | Sometido estrictamente a la doble llave (Ciudad+Planta).                           | Cruce fatal de aforos de un tanque gigantesco a un tanque auxiliar pequeño.                               |
| Fecha         | Date      | Sí          | **Bloqueo a no más de 2 días hacia atrás respecto a HOY.**                         | Manipulación retardada del inventario ("Cuadrar los números a toro pasado").                              |
| Hora          | Time      | Sí          | Requerido explícitamente y convertido de 4 digitos a un formato "HH:MM:SS" fuerte. | Errar el inicio/fin de turno, ocultando que el faltante fue antes o después.                              |
| Temperatura   | Numérico  | Sí          | Requiere precisión de decimales estricta (step: 0.1).                              | Ignorar desviaciones volumétricas en zonas áridas cálidas afectando el conteo de aforo real térmicamente. |
| AlturaCms     | Numérico  | Sí          | Mayor absoluto a cero (Tanque nunca puede clavar medición falsa).                  | Ocultamiento de excedente ("vacío" para poder vaciarlo realmente después sin reflejarlo).                 |
| Cuenta Litros | Numérico  | Sí          | Mayor o igual a libre positivo absoluto.                                           | Manipulación indecorosa cruzando la medición global de surtidores analógicos.                             |

## 6. Flujo Operativo Controlado

1. **Punto de Entrada Sensible:** El jefe de piso se acerca físicamente antes de entregar llaves a primer turno.
2. **Definición de Escenario:** Selecciona la tríada estricta topológica: Ciudad -> Planta -> Tanque. Cualquier cambio arriba elimina obligatoriamente las elecciones debajo.
3. **Registro de Instrumental Perteneciente al Tanque:** La fecha asume hoy. Inyecta Hora exacta visualizada en su reloj, la Temperatura de varilla, Altura física en Cms y la carátula "Cuenta litros".
4. **Validaciones Subrepticias:** Bloqueo de subidas con fechas remotas para evitar falsificación (Max 48 hrs de atraso).
5. **Generación de Evidencia:** El guardado incrusta directamente el metadato del autor a la tabla específica "TanqueLecturas" con Timestamp intocable de red.

## 7. Reglas de Negocio Críticas

- **Límite temporal absoluto (2 días):** Forzamiento operacional para evitar "acumular el cierre de todo el mes" el último día e inventar datos de cortes diarios omitidos por pereza.
- Lógica de Tres Eslabones (Cascada): A diferencia del llenado normal, este debe asegurar en qué planta concreta ocurrió el encuadre para aislar los centros contables.

## 8. Evidencia Generada

- Acumulado progresivo en BD (`TanqueLecturas`) marcando a perpetuidad "FechaRegistro" del servidor contra "Fecha" capturada, evidenciando capturas extemporáneas pero justificadas.
- Somete de inmediato a cero (inicialización) campos como "VolActualTA" y "VolActual15C" a expensas de un procedimiento calculador futuro automático.
- Rastro absoluto de `IDUsuarioRegistro`.

## 9. Riesgos Operativos si No se Utiliza Correctamente

- Imposibilidad material de descubrir que todas las lecturas de salidas y entradas durante la semana se encuadran contra una regla física diferente (Tanque Agrietado, Filtro Roto, Contrabando Mayor por Escotilla).

## 10. Escenarios de Auditoría

- **Conciliación de inventario físico vs sistema:** Si la AlturaCms del día miércoles, menos la AlturaCms del día martes arroja "menos 500 litros" por aforo, el Auditor verificará sumatoria de "Salidas" del sistema entre martes y miércoles; el descuadre obligará a auditar turno.
- **Detección de capturas atípicas:** Validar que ninguna captura haya tardado los mismos exactos "dos días completos" habitualmente, presumiendo negligencia del capturista en piso.

## 11. Consideraciones para Capacitación

- Enseñar las reglas exactas para toma de lecturas, limpieza de varilla y espera de relajación del líquido al medir.
- Mostrar la advertencia dura sobre el límite inquebrantable de fechas y la imposibilidad de la Gerencia IT de resarcir omisiones de este reporte.
