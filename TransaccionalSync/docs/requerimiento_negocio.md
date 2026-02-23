# Requerimiento de Negocio

## Análisis de Rendimiento de Diésel vs. Producción

**Proyecto**: DieselApp  
**Módulo**: TransaccionalSync  
**Fecha**: 2026-02-23  
**Versión**: 1.0  
**Estatus**: En desarrollo

---

## 1. Contexto del Negocio

La empresa opera una flota de **camiones revolvedores** cuyo core de negocio es el **transporte y entrega de cemento** a obras y clientes. La operación diaria genera dos flujos de información en sistemas distintos:

| Sistema                   | Plataforma                            | Información                                                   |
| ------------------------- | ------------------------------------- | ------------------------------------------------------------- |
| **DieselApp**             | Supabase (PostgreSQL en la nube)      | Registro de entradas y salidas de diésel por unidad y tanque  |
| **Sistema Transaccional** | SQL Server 2018 (VM AWS Windows 2022) | Viajes realizados, pedidos de cemento, remisiones, operadores |

Hoy en día, **ambos sistemas operan de forma aislada**, lo que impide responder preguntas clave para la operación:

- ¿Cuántos m³ de cemento entregó cada camión por litro de diésel consumido?
- ¿Cuántos viajes realizó cada unidad en el período evaluado?
- ¿Cuál camión tiene el mejor rendimiento productivo?
- ¿Hay unidades con consumo anómalo de diésel en relación a su producción?

---

## 2. Objetivo del Requerimiento

> Integrar la información de viajes del sistema transaccional con los registros de consumo de diésel de DieselApp, para generar un **Reporte de Rendimiento** que permita evaluar la eficiencia productiva de cada unidad (camión revolvedor).

---

## 3. Requerimientos Funcionales

| ID    | Descripción                                                                                                                                    | Prioridad |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| RF-01 | Sincronizar diariamente los viajes cerrados con remisión confirmada hacia Supabase                                                             | Alta      |
| RF-02 | La información sincronizada debe ser de la jornada del día anterior                                                                            | Alta      |
| RF-03 | El reporte de rendimiento debe mostrar: litros consumidos, viajes realizados, m³ cargados, km recorridos, horas operadas, y métricas derivadas | Alta      |
| RF-04 | Si un viaje ya existe en Supabase y se vuelve a sincronizar, el registro del sistema transaccional siempre prevalece                           | Alta      |
| RF-05 | El proceso debe registrar una bitácora de ejecución con estatus, conteo de registros y errores                                                 | Media     |
| RF-06 | En caso de error, el sistema debe registrar el detalle del error para diagnóstico posterior                                                    | Media     |
| RF-07 | El proceso debe poder ejecutarse manualmente para una fecha específica (backfill)                                                              | Media     |

---

## 4. Requerimientos No Funcionales

| ID     | Descripción                                                                                                                         |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| RNF-01 | El proceso debe usar tecnología exclusivamente Microsoft (sin Python, sin software adicional) para facilitar aprobación del cliente |
| RNF-02 | Las credenciales de conexión no deben estar hardcodeadas en el código                                                               |
| RNF-03 | El proceso debe completarse en menos de 5 minutos para los ~150-200 registros diarios esperados                                     |
| RNF-04 | La información histórica de sincronizaciones debe conservarse en SQL Server por al menos 90 días                                    |
| RNF-05 | El proceso no debe afectar el rendimiento del sistema transaccional durante horas de operación                                      |

---

## 5. Alcance

### Incluido en este requerimiento

- Proceso ETL de sincronización diaria (SQL Server → Supabase)
- Tablas de control y bitácora en SQL Server
- Job automatizado con SQL Server Agent
- Reporte de Rendimiento en DieselApp con datos cruzados

### Fuera de alcance

- Modificación del sistema transaccional de SQL Server
- Sincronización en tiempo real (la operación no lo requiere)
- Sincronización de datos históricos anteriores a la fecha de instalación (puede hacerse como backfill manual)

---

## 6. Usuarios y Stakeholders

| Rol                     | Interés                                                     |
| ----------------------- | ----------------------------------------------------------- |
| Gerencia de Operaciones | Ver el rendimiento global de la flota                       |
| Jefe de Patio           | Identificar unidades con bajo rendimiento o consumo anómalo |
| Área de TI del cliente  | Aprobar e instalar el proceso en el servidor VM             |

---

## 7. Criterios de Aceptación

- [ ] El proceso corre automáticamente a las 06:00 AM todos los días sin intervención manual
- [ ] Los registros en Supabase reflejan los viajes del día anterior antes de las 07:00 AM
- [ ] La tabla `Sync_Ejecucion` muestra `Estatus = 'EXITOSO'` al día siguiente de la instalación
- [ ] El Reporte de Rendimientos en DieselApp muestra columnas de viajes y m³ cargados por unidad
- [ ] En caso de error, el registro de la falla queda en `Sync_Ejecucion.MensajeError`
