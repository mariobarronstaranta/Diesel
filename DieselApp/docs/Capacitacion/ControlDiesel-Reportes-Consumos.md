# Reporte de Consumos Diarios y Movimientos

Versión: 1.0  
Fecha: 2026-03-04  
Sistema: Control de Diésel  
Clasificación: Documento de Capacitación y Control Interno

---

## 1. Objetivo de Control

Permitir el cotejo analítico superior de saldos mensuales o de periodos prolongados sin depender de manipulaciones de celdas erráticas en Excel mediante personal oficinista. Mitiga la invención de "cuadraturas forzadas" entre entradas y salidas.

## 2. Alcance

Impacta los procesos de:

- Reportes gerenciales (Balances Mensuales, Totales Anuales).
- Inventarios (Auditorías Retroactivas).
- Conciliación y Liquidación Contable (Comparación macro de Facturado vs Gastado en flotillas).

## 3. Perfiles Autorizados y Segregación de Funciones

- **Consulta y Ejecución:** Gerencia General, Control Interno Contable, Revisores externos y Jefatura de Flotilla.
- **Captura (Restringida en Modal Detalle):** Exclusivo Administradores o Coordinadores autorizados.
  Se provee una vista sin poder destructivo para revisores y la herramienta concentrada (Drill-down editable) para perfil de correcciones mayores.

## 4. Descripción Funcional General

Este informe compila en un visor consolidado las sumatorias en litros del total introducido (Entradas) frente al total dispensado a vehículos (Salidas), agrupado por día y tanque. Brinda botones para descender al nivel transaccional y revisar o corregir anomalías, además de generar exportables CSV con calidad estándar UTF-8.

## 5. Elementos de la Interfaz

| Elemento                       | Tipo                  | Obligatorio | Validación                                          | Riesgo que Mitiga                                                                          |
| ------------------------------ | --------------------- | ----------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Fecha Inicial / Final          | Fecha Paramétrica     | Sí          | Rango válido para limitar procesamiento             | Evita peticiones de años sin sentido, reduciendo colapsos de memoria y bases de datos      |
| Ciudad                         | Selección Filtro      | No          | Vacío significa total corporativo                   | Análisis ineficiente u omitir mermas de entidades enteras accidentalmente                  |
| Tanque                         | Selección Filtro      | No          | Se ata jerárquicamente a la Ciudad de antemano      | Buscar movimientos que mezclen recintos irrealmente                                        |
| Botón Exportar CSV             | Botón Export          | N/A         | Exige resultados listos primero                     | Muestra de archivos vacíos engañosos en cierres de auditoría                               |
| Botón "Detalle" en filas       | Botón de Acción       | N/A         | Levanta componente aislado Modal                    | Encubrimiento; Forzar a ver el nivel transaccional de un tanque particular bajo escrutinio |
| Total Entradas / Total Salidas | Casilla de Resultados | N/A         | Sumativas nativas de Stored Procedure RPC Supabase. | Impide que el visualizador local introduzca recálculos de front-end erróneos               |

## 6. Flujo Operativo Controlado

1. **Punto de Entrada Exploratoria:** El gerente o contador marca el inicio del mes a conciliar limitando fechas y/o ciudades.
2. **Registro y Búsqueda Remota:** Invoca procedimiento `get_reporte_consumos` con indicadores de spinner inhabilitadores para impedir interrupción o clic doble corruptor.
3. **Inspección Macroscópica:** El auditor revisa fila por fila comparando "Día X: Entradas 0, pero Salidas 300".
4. **Análisis Microscópico y Corrección:** El revisor pulsa "Detalle". Un modal emergente llama de nuevo a la nube y trae el cruce atómico (Cada Recibo de Remisión y cada Vale de Operador). Puede optar por ajustar un litro o valor con el modo "Edición Inline" en base a poder de perfil y salvar en BD directamente.
5. **Generación Documental:** Presiona con descargas blindadas en un "reporte_consumos_YYYY-MM-DD.csv" adjuntando evidencia externa.

## 7. Reglas de Negocio Críticas

- Todas las fechas pasadas entre interfaces deben hacerse en puros literales ISO sin zonas horarias artificiales para rehuir colapsos "out_of_range" del servidor SQL post-gres.
- Permite la total omisión del "Tanque" y la "Ciudad" por defecto para abarcar todo el ecosistema.
- Proyecta los números formateados inquebrantemente al estándar idiomático separador numérico formal a base de locales.

## 8. Evidencia Generada

- Consiste en archivos CSV en crudo extraídos bajo directrices codificadoras globales asombrosamente compatibles con cruces de bases en auditores con MS Excel.
- Permite descubrir varianzas donde, sumando Salidas a una Ciudad superan diametralmente el tope inicial más Entradas consolidadas.

## 9. Riesgos Operativos si No se Utiliza Correctamente

- Parchar déficits presupuestales mensuales con la creencia de que las cuentas "iban bien" en papeles aislados omitiendo los totales duros registrados e irrevocables de la memoria transaccional.

## 10. Escenarios de Auditoría

- **Conciliación cruzada de Fin de Mes:** Extraer de este reporte "Total Entradas", multiplicarlas por Precio Promedio Ponderado, y medir similitud al asiento de egresos de la corporación para ese tanque. Retornar por modal al Detalle en búsquedas de varianza.
- **Validación transversal del inventario de cierres:** Medir consistencia en días donde a pesar de figurar una Entrada Genuina con Remisión por 3500 lts, aparecen Salidas con fechas extemporáneas.

## 11. Consideraciones para Capacitación

- Hacer particular hincapié en el manejo de filtrado, pues omitir uno no genera errores para el reporte, pero esparce las sumatorias diluyendo la métrica cuando se audite una locación especial.
- Advertir enérgicamente usar la herramienta de Descarga de CSV, ya que capturas de pantalla evaden el sello completo de revisiones posteriores.
