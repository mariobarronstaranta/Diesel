----- INICIO ARCHIVO: docs/ControlDiesel-ManualMaestro.md -----
# Manual Maestro del Sistema Control de Diésel

Versión: 1.0  
Fecha: 2026-03-04  
Tipo: Documento Consolidado para Capacitación, Auditoría y Contexto IA  

---

# 1. Visión General del Sistema

- **Objetivo estratégico:** Asegurar la trazabilidad, el control exhaustivo y la correcta asignación de costos del inventario y consumo de combustible dentro de la organización.
- **Problemas que resuelve:** Evita el robo u ordeñas (robo hormiga), las capturas extemporáneas o erráticas de inventarios, pagos por litros no inyectados por proveedores (facturas fantasma), las fugas mecánicas y cuadraturas financieras sin fundamento operativo real.
- **Alcance operativo:** Cubre desde la inyección inicial de combustible por proveedores externos al tanque físico, la medición periódica en patio, las emisiones hacia los vehículos utilitarios, y concluye en la generación de inteligencia de reportes métricos directivos para identificar la rentabilidad (Kms/Lts) de cada unidad y operador.

# 2. Arquitectura Funcional (No Técnica)

- **Módulos:**
  - **Operación (Suministro/Salidas):** Registro del diésel despachado a la flotilla vehicular.
  - **Recepción (Entradas):** Control de llegadas por pipas de proveedores contra facturas y vales físicos.
  - **Inventario Físico (Lecturas):** Tomas de aforo (Corte) con regla/cinta y cuenta litros estático de forma fotográfica.
  - **Reportes (Consumos y Rendimientos):** Consolidación analítica y métrica de la rentabilidad del suministro.
- **Relación entre módulos:** "Recepción" aumenta el inventario y "Operación" lo disminuye, registrándose en el mismo histórico atómico. Paralelamente, "Inventario Físico" permite cotejar el volumen con la realidad. Finalmente, "Reportes" aglutina ambos universos y provee inteligencia directiva y ajustes finales justificados.
- **Flujo general operativo:** El diésel es recepcionado en tanque físico por un despachador ingresando captura de entrada; posteriormente, el despachador surte diariamente litros a operadores/vehículos capturando kilometraje y el tanque se reduce; a intervalos determinados de turno, se capta la "fotografía" con el "Inventario" de la regla métrica. Gerencia o Control Interno extrae reportes consolidados cada semana o mes para evaluar eficiencias o auditar el flujo.

# 3. Matriz de Pantallas

| Módulo     | Pantalla                         | Objetivo                                                                                      | Perfil Principal              | Riesgo Mitigado                                                                                  |
| ---------- | -------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------ |
| Operación  | Registro de Carga (Salidas)      | Vincular litros erogados con vehículos y conductores.                                         | Despachador de combustible    | Desviación de combustible; Evasión de responsabilidades.                                         |
| Operación  | Registro de Recepción (Entradas) | Cargar inventario conectando un proveedor legal y un remito físico al tanque.                 | Administrador / Recepcionista | Pago a proveedores o pipas fantasma, o mermas simuladas.                                         |
| Inventario | Captura de Lecturas Diarias      | Crear un corte de caja físico del tanque con su regla metrológica y cuenta litros.            | Supervisor de Patio           | Faltantes indocumentados (fugas o robo nocturno) cubiertos a toro pasado por atraso.             |
| Reportes   | Reporte de Consumos              | Sumar e inspeccionar Entradas y Salidas cruzadas por fechas consolidando.                     | Auditoría / Control Interno   | Cuadraturas falsas hechas en Excel aislando los registros duros en BD.                           |
| Reportes   | Reporte de Rendimientos          | Medir ineficiencia o fugas vehiculares exponiendo la métrica de kilómetros u horas por litro. | Gerencia de Flota / Taller    | Vehículos "ordeñados" silenciosamente que figuran devorando cantidades irreales por kilometraje. |

# 4. Reglas de Negocio Consolidadas

- **Inventario:**
  - Las capturas de _Lectura Diaria_ no pueden retroceder más de 48 horas hacia el pasado respecto al día en curso.
  - Las entradas suman y las salidas restan sobre el volumen, atado inquebrantablemente por Ciudad y Tanque (Cascada).
  - La Altura (Cms) capturada en Lecturas debe ser siempre positiva. En las _Salidas_, la altura física se registra ciegamente como 0.
- **Rendimiento:**
  - El sistema extrae el Odómetro/Horómetro mayor restándole el menor en un periodo para deducir consumos cruzando _sólo despachos (Salidas 'S')_.
  - Las operaciones de división para métricas están protegidas contra divisiones entre ceros (NULLIF).
- **Unidades:**
  - En la salida, las Unidades mostradas están filtradas y atadas férreamente a la Ciudad seleccionada. Cambiar la ciudad borra la unidad para evitar "teletransportaciones".
  - Nunca se capturarán _Unidades_ dentro del formato de _Entradas_ (Recepción).
- **Operadores:**
  - Similar a las unidades, el operador se ciñe a su _Ciudad_. Se omite por completo en el módulo de _Entradas_ u _Inventario_.
- **Seguridad:**
  - La edición "In-Line" transaccional de un registro errático y profundo (Drill-Down) es de potestad exclusiva de rangos administrativos maestros en las pantallas de _Reportes_, no en piso.
  - Ninguna inserción (Entrada o Salida) cuenta con botón de edición directa para despachadores.
- **Auditoría:**
  - Cero manipulaciones con fechas locales vacías; todas las inserciones asientan un Timestamp de generación inmutable que acompaña al ID del creador.
  - El sistema rechaza o inutiliza la posibilidad de insertar números nulos en campos sensibles (Litros, Lecturas, Operador).

# 5. Flujo Operativo Integral

- **Alta de catálogos:** Se establecen inicialmente Catálogos inamovibles (Ciudades, Plantas, Unidades, Tanques y Personal) desde la Base de Datos central.
- **Registro de carga (Recepción):** Llega una Pipa; el capturista asienta físicamente el surtimiento conectando la Remisión, Proveedor y el incremento de aforo (_Altura_ y _Temperatura_).
- **Registro de despacho (Salidas):** Vehículo operativo llega a la bomba. El operador del patio asienta el _Vale físico_, pide lectura de Odómetro, carga el tanque utilitario y registra el volumen gastado conectándolo al Chofer.
- **Impacto en inventario:** El movimiento consolida una merma y el odómetro sube; el jefe de piso, al turno perimetral, clava la "Captura Diaria" con su propia comprobación visual con la regla.
- **Generación de reportes:** A final de semana, Finanzas extrae "Consumos" visualizando el cuadre del gasto de Entradas vs Salidas; simultáneamente Taller extrae "Rendimientos" para auditar Kms/Lts.
- **Cierre y conciliación:** Con los informes descargables (CSV de la plataforma), Finanzas aprueba facturas correctas que matchen con los CSV de Entrada; y Taller cita a correctivos disciplinarios o mecánicos a vehículos rezagados según el CSV de "Rendimientos".

# 6. Controles Internos y Segregación de Funciones

El sistema traza una línea divisoria donde los puestos en piso con medidores físicos (Despachadores y Supevisores de Patio) ingresan exclusivamente las capturas primarias atómicas en su respectivo momento y sin capacidad de retractación posterior. La función revisora y liquidadora (Auditores/Coordinadores Administrativos, Gerentes) sólo posee visibilidad panorámica desde su entorno (Reportes) para descubrir sesgos y varianzas, y son ellos quienes albergan la responsabilidad controlada de usar sus perfiles superiores en Casos de Excepción (Edición Inline) corrigiendo eventuales equivocaciones de tipeo en piso para que el cierre numérico subsane satisfactoriamente.

# 7. Evidencias y Trazabilidad

Globalmente el sistema deja el rastreo indiscutible asimilado a Base de Datos de transacciones irreversibles:

- Cada ingreso graba duramente la Fecha y Hora en la que insertaron el documento (Timestamp impidiéndose engaños en temporalidades de zona local).
- Identificadores atómicos de qué usuario creó cada línea de entrada, de salida o de inventario físico y un marcador imborrable si sufrió mutación autorizada.
- Las tablas generadoras de datos métricos (Kms/Lts) se alimentan directamente sin recálculos en Frontend para inhibir discrepancias o cuadres maquillados aislados.

# 8. Riesgos Operativos Controlados por el Sistema

La normalización consolida que el portal protege sobre todo el Inventario real mediante tres ejes: Controla los falsos ingresos inyectados facturando pipas invisibles; controla el surtimiento ilegal disfrazando combustible propio a flotillas fantasmas o cruzadas; y controla la pasividad del almacenaje forzando a establecer un cerco horario para medir pérdidas estáticas para reclamaciones de mantenimiento u ordenanzas de seguridad patrimonial de modo casi perentorio y constante (cada 48 horas como máximo de límite permisivo). Todo esto inhibiendo cruces geográficos absurdos.

# 9. Escenarios de Auditoría

1. **Facturas vs Sisyema:** Compulsa directa entre las facturación que subió al ERP de Compras con la sumatoria estricta del CSV desprendido del Reporte de Consumos (Módulo de Entradas).
2. **Surtimiento vs Vale:** El cruce minucioso "Al Vuelo" entre los cientos de vales de papel retenidos en cajas de despacho, cruzados contra el modal de Detalle en los Reportes para revisar que no se hayan inventado registros ficticios.
3. **Validaciones Mecánicas y Rendimiento:** Disparadores que detecten Kms/Lts por debajo de rangos normados lo que inicia peritaje de desgaste mecánico inusitado en Unidad Taller, o un interrogatorio oficial por robo de diesel ("ordeña") al Chofer responsable en ese Turno y la ciudad registrada.
4. **Cruce Temporal Tardío de Inventario:** Extraer "Lecturas" del sistema midiendo las distancias temporales del campo "FechaRegistro" que exponga en evidencia a los jefes de patio con tendencia a capturar retrasadamente al final del límite 48 hrs.

# 10. Consideraciones para Flujos de IA

- **Entidades clave:** Todas las relaciones son de clave dura: _CveCiudad_, _IDTanque_, _IDPlanta_, _IDUnidad_, _IDPersonal / IDOperador_, y _TipoMovimiento ("E" / "S")_.
- **Relaciones importantes:** La existencia indispensable del paradigma jerárquico cascada (Ej: _CveCiudad_ engloba Unidades/Operadores en "Salidas", _CveCiudad_ acoge a _Plantas_ en "Lecturas"). Cambiar el nodo abuelo borra fulminantemente toda validación y valor a los nietos.
- **Reglas críticas que NO deben violarse:** No inyectar a una base de "Entradas" con características propias y exigibles a "Salidas" (Odómetros o Vales nulos); no introducir "Salidas" con documentación exigible de un Remito Proveedor ("IdProveedor", "Remision" nulos); no suprimir el "Timestamp" absoluto (`FechaHoraMovimiento`), jamás omitir la métrica contable de protección "NULLIF" o divisor en cero.
- **Variables sensibles:**
  - `LitrosCarga`, `CuentaLitros`: Elementos primarios económicos que deben cruzar aritméticamente exacto con consumos.
  - `Odometro` y `Horimetro`: Sus valores rigen métricas sancionadoras, impidiendo tipeado irracional o retroactivo negativo.
  - `FechaRegistro / FechaHoraMovimiento`: Pilares absolutos contra robos temporales in-situ.
  - `IDUsuarioRegistro`: Ente inmutable atado al responsable legal de cada manipuleo de base.
- **Gotchas Técnicos y Detalles de Esquema:**
  - La tabla `TanqueMovimiento` **NO** posee una columna `Activo`. No intentar filtrarla por este campo vía PostgREST o RPCs, causará un error HTTP 400.
  - La vista `InformacionGeneral_Cierres` devuelve la columna `FechaInicio` como tipo String/Texto en formato `M/D/YYYY Hora` o `MM/DD/YYYY Hora` (ej. `3/6/2026 12:00:00 AM`). Las consultas PostgREST con `.gte()` o `.lte()` sobre esta columna fallarán por ordenamiento alfabético; el filtrado cronológico debe hacerse en memoria (JavaScript/Frontend) procesando la cadena adecuadamente.
  - Al relacionar datos operativos con `InformacionGeneral_Cierres` (ej. Reporte Productividad), las unidades que existen operativamente pero no en el catálogo de DieselApp devolverán un `IDUnidad` `null`. Componentes y RPCs deben manejar silenciosamente este caso para evitar colapsos.

---

**Observaciones de Normalización:**
_No se encontraron discrepancias sustanciales ni choques doctrinales u operativos en el material original. Los reportes complementan en simetría el ingreso pasivo y el inyectado. La diferenciación semántica entre "Registro de Transacciones" vs "Toma de Cortes diarios (Lecturas)" es clara y queda asimilada apropiadamente según perfiles de revisión en la segregación._
----- FIN ARCHIVO -----
