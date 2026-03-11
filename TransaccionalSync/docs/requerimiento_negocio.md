# Requerimiento de Negocio

**Proyecto**: DieselApp  
**Módulo**: TransaccionalSync (Integración Operación-Diésel)  
**Fecha**: 2026-03-09  
**Versión**: 1.1  
**Estatus**: En desarrollo  
**Clasificación**: Documento de Producto (Orientado a Product Owner / Stakeholders y Soporte Técnico)

---

## 1. Visión del Producto y Objetivo de Negocio (Valor Añadido)

**Objetivo Estratégico:**  
Dotar a la Gerencia de Operaciones de una única fuente de la verdad que fusione el gasto de combustible con el output logístico. Este módulo (TransaccionalSync) es el "motor invisible" que alimenta el Reporte de Productividad, extrayendo de forma silenciosa y segura la producción de viajes de la base de datos central (SQL Server) para inyectarla en el ecosistema DieselApp (Supabase).

**Valor para el Negocio (ROI):**

- **Fin del Silo de Datos:** Elimina la necesidad de cruzar "Exceles" manualmente entre el Departamento de Transporte y el de Despacho Logístico.
- **Detección Ágil de Fugas:** Permite al Reporte de Productividad calcular métricas vitales como el Costo Energético ($L/m^3$) de manera automatizada.
- **Operación Desatendida:** Ahorra decenas de horas-hombre al mes al automatizar la consolidación de datos durante la madrugada (06:00 AM).

---

## 2. Contexto del Negocio y Problema a Resolver

La empresa opera una flota de **camiones revolvedores** cuyo core de negocio es el **transporte y entrega de concreto** a obras. La operación diaria genera dos flujos de información históricamente aislados:

| Sistema Fuente                     | Plataforma Técnica              | Tipo de Información que Resguarda                                                              |
| :--------------------------------- | :------------------------------ | :--------------------------------------------------------------------------------------------- |
| **DieselApp (Destino)**            | Supabase (PostgreSQL Cloud)     | Registro de entradas y salidas de diésel por unidad, tanque, operador y horómetros/odómetros.  |
| **Sistema de Producción (Origen)** | SQL Server 2018 (VM On-Premise) | Viajes realizados, números de remisión, metros cúbicos ($m^3$) cargados, y clientes atendidos. |

**El dolor del negocio:**  
Sin este puente automatizado, es imposible para la Gerencia responder preguntas clave del día a día, como:

- _¿Están cargando diésel unidades que ayer no hicieron ni un solo viaje de concreto?_
- _¿Cuántos viajes de concreto le sacamos de provecho a esa unidad por los 200 litros que se le inyectaron ayer?_

---

## 3. Requerimientos Funcionales y Criterios de Aceptación (User Stories)

| ID        | User Story / Descripción                                                                                                             | Criterio de Aceptación                                                                                              |
| :-------- | :----------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| **RF-01** | _Como Gerente, quiero que los viajes confirmados del día anterior aparezcan en DieselApp para auditar el rendimiento._               | Sincronización diaria exitosa de la jornada previa hacia Supabase.                                                  |
| **RF-02** | _Como Analista de Datos, necesito tener garantizado que los datos del sistema de Producción mandan sobre cualquier copia local._     | (Upsert) Si un viaje existente se resincroniza, el dato de SQL Server prevalece siempre sobrescribiendo a Supabase. |
| **RF-03** | _Como Soporte TI, quiero poder consultar si la sincronización nocturna falló sin tener que entrar a la base de datos de producción._ | Creación de Bitácora de Ejecución detallando estatus, conteo y mensajes de error exactos en SQL Server.             |
| **RF-04** | _Como Administrador de Sistema, requiero correr el proceso a demanda para fechas pasadas si hubo un apagón._                         | El script/proceso debe permitir ejecución manual parametrizada (Backfill de fechas).                                |

---

## 4. Requerimientos No Funcionales (Lineamientos Técnicos Core)

| ID         | Regla Arquitectónica                                                                                                                | Justificación de Negocio / Riesgo Mitigado                                                                      |
| :--------- | :---------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| **RNF-01** | **Ecosistema Nativo:** Uso exclusivo de T-SQL y herramientas de Windows (Powershell/SQL Agent). No dependencias como Python/NodeJS. | Facilita la certificación y aprobación rápida por parte del corporativo de TI del cliente en sus VM On-Premise. |
| **RNF-02** | **Seguridad Estricta:** Credenciales inyectadas vía variables de entorno o almacén seguro, cero claves expuestas en código duro.    | Evita brechas de seguridad y robo de accesos a la Nube (Supabase) desde el código fuente local.                 |
| **RNF-03** | **Carga Ligera:** Ejecución inferior a 5 minutos (150-200 registros promedio).                                                      | No impacta, ni compite por recursos con el Facturador del sistema transaccional durante horarios hábiles.       |
| **RNF-04** | **Retención de Logs:** Conservación histórica de bitácoras por 90 días.                                                             | Suficiente ventana temporal para auditorías de sistemas sin inflar la base de datos de producción.              |

---

## 5. User Journey y Flujo de Operación (Cómo se vive el proceso)

1. **La Noche Anterior:** Los camiones terminan su jornada entregando remisiones de concreto. El despachador consolida los registros en el Sistema Transaccional.
2. **Madrugada (06:00 AM):** Mientras el personal duerme, el SQL Server Agent despierta e invoca a **TransaccionalSync**.
3. **El Puente de Datos:** El proceso empaqueta exclusivamente los despachos válidos de la jornada de ayer y los viaja mediante API segura hacia la nube de DieselApp.
4. **La Mañana Temprano (07:00 AM):** La sincronización concluye. Deja un ticket en verde (`EXITOSO`) en la tabla de bitácoras del servidor.
5. **Consumo por Negocio (08:00 AM):** El Product Owner y los Auditores abren el _Reporte de Productividad_ en su navegador y mágicamente ven el cruce semaforizado de Diésel vs Concreto ($L/m^3$) listo para tomar decisiones.

---

## 6. Alcance del Proyecto

**Qué SÍ Construimos:**

- Proceso ETL nativo de SQL Server (Procedimientos Almacenados).
- Invocación HTTPS nativa desde T-SQL hacia la API REST de Supabase.
- Estructuras de Bitácora y Control de Errores integradas al servidor local.
- Job automatizado en SQL Server Agent.

**Qué NO Hacemos (Fuera de Alcance):**

- Prohibido modificar estructuras, tablas o lógica nativa del sistema transaccional (Solo lectura).
- Sincronización en Tiempo Real (Streaming/Webhooks). La operación maneja cortes diarios.
- Migración histórica masiva automática (Backfill de años anteriores es manual a demanda).

---

## 7. Responsabilidades y Stakeholders

| Rol / Perfil                         | Interés Principal                                       | Métrica de Éxito                                                                           |
| :----------------------------------- | :------------------------------------------------------ | :----------------------------------------------------------------------------------------- |
| **Product Owner / Dirección**        | Rentabilizar el modelo de negocio.                      | Reducción del Costo Energético Operativo usando el Reporte final.                          |
| **Jefe de Flota / Taller**           | Hallar unidades defectuosas o con ordeña comprobada.    | Discrepancias evidentes (Mucho Diésel inyectado vs Cero Viajes trasladados).               |
| **TI Corporativo (Infraestructura)** | No romper su servidor de producción y asegurar puertos. | Aprobación de firewall saliente hacia Supabase y cero caídas de CPU provocadas por el Job. |
