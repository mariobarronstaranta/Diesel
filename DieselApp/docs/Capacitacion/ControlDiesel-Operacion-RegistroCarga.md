# Registro de Carga (Salidas)

Versión: 1.0  
Fecha: 2026-03-04  
Sistema: Control de Diésel  
Clasificación: Documento de Capacitación y Control Interno

---

## 1. Objetivo de Control

Mitiga el riesgo de desviación de combustible, captura incorrecta de litros despachados y asegura la correcta asignación del costo de diésel a cada unidad vehicular y operador de la empresa.

## 2. Alcance

Impacta los procesos de:

- Inventario de diésel (reducción de existencias en tanque físico).
- Rendimiento por unidad (al registrar odómetro/horómetro).
- Control de operadores.
- Reportes gerenciales (totales de salidas diarias).
- Conciliación administrativa.

## 3. Perfiles Autorizados y Segregación de Funciones

- **Consulta:** Jefes de patio, Auditoría Interna.
- **Captura:** Despachador de combustible.
- **Edición:** No permitido (requiere perfil superior desde el reporte).
- **Autorización:** N/A para registro inicial.
  La segregación asegura que quien carga físicamente sea responsable ineludible del registro del folio de vale firmado, sin capacidad de alterarlo posteriormente sin dejar rastro de auditoría.

## 4. Descripción Funcional General

Pantalla para registrar cada evento de suministro (salida) de diésel de un tanque físico hacia un vehículo. Vincula la cantidad entregada con los kilometrajes u horas del motor y el responsable directo, descontando el volumen del tanque origen.

## 5. Elementos de la Interfaz

| Elemento      | Tipo                          | Obligatorio | Validación                                    | Riesgo que Mitiga                                                       |
| ------------- | ----------------------------- | ----------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| Ciudad        | Selección                     | Sí          | Lista predefinida sincronizada.               | Registro contable o físico en ubicación errónea.                        |
| Tanque        | Selección                     | Sí          | Filtrado por Ciudad (Cascada).                | Suplantación de orígenes e inventario fantasma.                         |
| Fecha         | Date                          | Sí          | Formato YYYY-MM-DD.                           | Desfase del consumo en tiempos no operativos.                           |
| Hora          | Time                          | Sí          | Formato HH:MM.                                | Ocultamiento de cargas en horarios restrictivos.                        |
| Temperatura   | Numérico                      | Sí          | Ingreso exacto.                               | Discrepancias físicas por evaporación/dilatación.                       |
| Unidad        | Selección Búsqueda predictiva | Sí          | Filtrado de unidades activas por Ciudad.      | Carga de combustible a vehículos dados de baja o ficticios.             |
| Operador      | Selección Búsqueda predictiva | Sí          | Filtrado de colaboradores activas por Ciudad. | Evasión de responsabilidad sobre el uso o destino del equipo cargado.   |
| Horómetro     | Numérico                      | Sí          | Valor numérico mayor/igual a 0.               | Falta de control preventivo de mantenimiento y rendimiento irreal.      |
| Odómetro      | Numérico                      | Sí          | Valor numérico mayor/igual a 0.               | Falta de seguimiento al rendimiento kilométrico.                        |
| Litros Carga  | Numérico                      | Sí          | Valor numérico exacto despachado (No cero).   | Discrepancia directa de inventario o facturas de venta fantasma.        |
| Cuenta Litros | Numérico                      | Sí          | Tomado del reloj medidor.                     | Modificación malintencionada del surtidor analógico saltándose cargas.  |
| Folio Vale    | Texto                         | Sí          | Libre alfanumérico.                           | Carecer de evidencia documental física o rúbrica que respalde el gasto. |
| Observaciones | Texto Largo                   | No          | Libre.                                        | Falta de contexto en situaciones atípicas permitidas.                   |

## 6. Flujo Operativo Controlado

1. **Punto de entrada:** El vehículo se presenta para carga con su Vale físico.
2. **Registro de Ubicación:** Se selecciona progresivamente Ciudad y Tanque de origen.
3. **Registro de Responsables:** Se escogen individualmente la Unidad receptora y el Operador.
4. **Captura Operativa:** Se rellenan contadores pre-carga (Horómetro, Odómetro, Tipo de Movimiento S). En este punto "Altura del Tanque" queda descartada para simplificar captura.
5. **Validaciones en tiempo real:** El sistema evita guardar datos nulos o fuera de rango geográfico.
6. **Confirmación:** Guardado y generación del id de movimiento en tabla `TanqueMovimiento`.
7. **Generación de evidencia:** Cierre local del timestamp exacto `FechaHoraMovimiento` congelado sin intervención.

## 7. Reglas de Negocio Críticas

- La selección de Unidad y Operador borra su contenido al cambiar de Ciudad base para prevenir cruces espurios de ubicación.
- Los campos Remisión e IdProveedor se establecen como forzosamente `null` internamente, protegiendo contra cruces de Entradas sobre Salidas.
- La Altura del Tanque se fija en "0".

## 8. Evidencia Generada

- Registro inmutable final en BD de tipo tabla (`TanqueMovimiento`).
- Identificador de usuario interno con Timestamp automático duro `YYYY-MM-DD HH:MM:SS`.
- Impacto negativo (disminución de volumen) calculable en reportes de consumos en tiempo real.
- Bitácora cruzable contra vales de papel firmados.

## 9. Riesgos Operativos si No se Utiliza Correctamente

- Imposibilidad gerencial para determinar rendimientos en litros/kilómetros y localizar unidades "ordeñadas" en ruta.
- Cuadratura mensual incongruente por desconocer a qué área/operador cobrar el Diésel.

## 10. Escenarios de Auditoría

- **Validación de rendimiento por unidad:** Analizar picos donde los "Litros Carga" suban exabruptamente sin correspondencia en el Odómetro.
- **Conciliación de inventario físico vs sistema:** Suma de "Litros Carga" del sistema vs lecturas físicas de la sonda de despacho.
- **Revisión de registros fuera de horario:** Movimientos con la "Hora" en la madrugada en patios cerrados.
- **Detección de capturas atípicas:** Búsqueda cruzando la secuencia del "Cuenta Litros" para hallar vacíos indicativos de una recarga saltada ex-profeso.

## 11. Consideraciones para Capacitación

- Enfatizar leer y asentar certeramente los odómetros del clúster vehicular de modo inmediato, penalizando lecturas estimadas o "al tanteo".
- Reforzar la noción de que el Folio de Vale debe ser idéntico al papel físico.
