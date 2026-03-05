# Registro de Recepción de Diésel (Entradas)

Versión: 1.0  
Fecha: 2026-03-04  
Sistema: Control de Diésel  
Clasificación: Documento de Capacitación y Control Interno

---

## 1. Objetivo de Control

Asegurar que toda inyección de combustible comprado a proveedores sea respaldada por documentos físicos (Remisión), verificando que el volumen que se inyecta y paga concuerde mediante pruebas en el lugar ("Altura del Tanque", "Temperatura"). Mitiga facturas fantasma.

## 2. Alcance

Impacta los procesos de:

- Inventario (Aumento lógico de activos físicos).
- Reportes gerenciales (Sumatoria de Entradas y rentabilidad).
- Conciliación administrativa (Cuentas por pagar a proveedores).

## 3. Perfiles Autorizados y Segregación de Funciones

- **Consulta:** Auditaría Externa e Interna, Compras.
- **Captura:** Recepcionista de Patio o Administrador de Estación.
- **Edición:** Restringida para registros históricos.
  Se separa al pagador (Área Contable) de quien valida visualmente la inyección de líquido (Capturista).

## 4. Descripción Funcional General

Registra la compra o ingreso de diésel por pipas externas hacia los tanques internos de resguardo. Elimina los medidores de desgaste ("Odómetros") centrándose exclusivamente en variables de almacenamiento (Proveedor, Documento, Altura y Temperatura).

## 5. Elementos de la Interfaz

| Elemento      | Tipo        | Obligatorio | Validación                                           | Riesgo que Mitiga                                                                                |
| ------------- | ----------- | ----------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Ciudad        | Selección   | Sí          | Existente en catálogo base.                          | Incongruencia del lugar de abasto real contra el facturado.                                      |
| Tanque        | Selección   | Sí          | Vinculado exclusivamente a la Ciudad elegida.        | Descargar el líquido en un recipiente ficticio y ocultar fugas.                                  |
| Fecha         | Date        | Sí          | Actual o retroactivo inmediato por límite de cierre. | Desfasar intencionalmente una entrada de la fecha de la remisión.                                |
| Hora          | Time        | Sí          | Hora local de la operación.                          | Modificación y manipulación de tiempos de tránsito para la pipa proveedora.                      |
| Temperatura   | Numérico    | Sí          | Validando decimales (`any` step).                    | Enmascaramiento de faltante justificado erróneamente con la expansión o contracción volumétrica. |
| Litros Carga  | Numérico    | Sí          | Valor estricto superior a cero.                      | Aporte de inventario ficticio o falso para ocultar otra fuga anterior.                           |
| Altura        | Numérico    | Sí          | Uso forzado de cinta métrica decimal.                | Asegurar que el tanque físico tuvo una elevación real.                                           |
| Cuenta Litros | Numérico    | Sí          | Concordancia con medidores fijos.                    | Variaciones en registros mecánicos auditables a vista desnuda.                                   |
| Proveedor     | Selección   | Sí          | Catálogo validado.                                   | Pago a empresas apócrifas y/o sin contrato.                                                      |
| Remisión      | Texto       | Sí          | Coincidencia de papel legal (Documento contable).    | Lavado de inventario a favor de coludidos sin costo respaldado contablemente.                    |
| Observaciones | Texto Largo | No          | Sin validación formal.                               | Carecer de notas de anomalías por llegadas tardías, mangueras dañadas, etc.                      |

## 6. Flujo Operativo Controlado

1. **Punto de entrada:** Desplazamiento y preparación de la pipa abastecedora con Remisión en mano.
2. **Registro:** Captura de lugar (Ciudad y Tanque de descarga directa).
3. **Validaciones físicas:** Capturista toma "Altura" con regla física y extrae los "Litros Carga", anotando también "Temperatura".
4. **Vínculo Documental:** Imputación oficial cruzando con "Proveedor" exacto y su "Remisión" impresa.
5. **Confirmación:** Conversión numérica en tiempo real para evitar cadenas vacías; se guardan en BD con Tipo Movimiento "E" (Entrada).
6. **Generación de evidencia:** Creación del timestamp ineditable `FechaHoraMovimiento`.

## 7. Reglas de Negocio Críticas

- No involucra "Planta" u otras estructuras intermedias que sí existen en CapturaLecturas; la relación de Ciudad a Tanque es directa.
- Omisión obligatoria de todos los metadatos propios de Salidas (IdUnidad = null, IdPersonal = null, Horimetro = null, FolioVale = nulo).
- Exige obligatoriamente documentar `Remision` y `Proveedor` si es una 'E' (Entrada).

## 8. Evidencia Generada

- Timestamp generado manualmente concatenando el tiempo local duro impidiendo desfases temporales con la Base de datos centralizada nube.
- Genera traza de "Cuenta Litros" que puede ser auditada posteriormente si la factura real fue distinta.
- Impacto global incrementando el disponible del inventario.

## 9. Riesgos Operativos si No se Utiliza Correctamente

- Imposibilidad de conciliar volumen físico contra facturas presentadas, propiciando posibles doble-pagos al proveedor o recibimientos incompletos.
- Fallar en registrar la Altura y Temperatura puede invalidar garantías o reclamos sobre diésel con mal peso específico / dilución excesiva.

## 10. Escenarios de Auditoría

- **Conciliación de inventario físico vs sistema:** El aumento de altura en cm capturado ("Altura") debe empalmar mediante las tablas de aforo del tanque con los "Litros Carga".
- **Comprobación Cruzada Contable:** Auditoría obtiene "Remisiones" semanales del ERP contable y coteja directamente si toda factura pagada existe como una remisión con estatus capturado en esta pantalla.

## 11. Consideraciones para Capacitación

- Enseñar las correctas pautas de metrología física de tanques (Aforo, regla o cinta con plomada para extraer Altura y Termómetro de probeta).
- Insistir a los usuarios en revisar dos veces el consecutivo alfanumérico exacto del folio de Remisión para no estropear al área de finanzas.
