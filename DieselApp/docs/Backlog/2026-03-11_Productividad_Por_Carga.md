# Requerimiento: Productividad por Carga
Fecha: 11 de Marzo de 2026

## 1. El Requerimiento Original
El usuario solicitó:
> *"en el reporte de productividad , podemos ver los movimientos por un periodo de tiempo , y cuando entramos a las ventanas modal , mostramos las cargas que se realizaron y en la otra pestana los viajes que hizo el camion , hasta ahi todo esta bien , pero necesitamos hacer ya sea como una pestania mas con lo siguiente , el usuario desea ver por ejemplo , si yo el 10 marzo hice una carga de 100 lts , saber que con esos litros cuantos viajes realice , y cuantos kilometros y horas movi el camion respectivo a esa carga de combustible , y asi para cada carga , esto para saber que tan productivo para la empresa es cada camion con una carga de combustible"*

Adicionalmente, se aclaró:
> *"En la tabla InformacionGeneral_Cierres en el campo FechaInicio tomamos solo la fecha , en el campo Horainicio es la hora en que se realizo el viaje , esto es importante ya que las cargas de diesel tienen tambien una hora asociada , entonces los viajes que realizo tienen que considerar la fehca y hora"*

Y también se acordó que:
> *Para la última carga del periodo (cuando no hay una "siguiente recarga"), se toma el último viaje reportado como referencia final.*

---

## 2. Plan de Implementación (Aprobado)

El objetivo es relacionar las recargas de Diésel con los viajes (Movimientos SP) que se realizan a partir de dicha recarga, y calcular los kilómetros y horas trabajadas correspondientes.

Para lograr esto, se propuso el siguiente enfoque algorítmico y visual dentro del `ReporteProductividadDetalleModal`:

### 2.1. Nueva Pestaña en el Modal
Añadida una tercera pestaña llamada **"📊 Productividad por Carga"**. Esta pestaña se encarga de cruzar la información que ya tenemos en "🛢️ Mov. Diesel" (Cargas) y "🚛 Mov. SP" (Viajes).

### 2.2. Ajuste en Consultas a Base de Datos
- **Movimientos Diésel (`TanqueMovimiento`)**: Se agregó el campo `HoraCarga` a la consulta de `supabase.from("TanqueMovimiento")`.
- **Viajes SP (`InformacionGeneral_Cierres`)**: Se agregó el campo `HoraInicio` a la consulta de `supabase.from("InformacionGeneral_Cierres")`.
- Se actualizaron los tipos en `src/types/reportes.types.ts` (`ProductividadMovDiesel` y `ProductividadMovSP`) para reflejar estos nuevos campos.

### 2.3. Algoritmo de Correlación
Los movimientos Diésel (`movDiesel`) y los viajes (`movSP`) se relacionan combinando Fecha y Hora:

Por cada recarga de Diésel (llamémosle **Carga A** en el tiempo $T_A$, compuesto por `FechaCarga` + `HoraCarga`):
1. **Identificar el Periodo Carga-a-Carga**: Buscamos la siguiente recarga de ese mismo camión (llamémosle **Carga B** en $T_B$, compuesto por `FechaCarga` + `HoraCarga`).
   - Si existe Carga B, el *"periodo de consumo"* de la Carga A abarca desde $T_A$ hasta $T_B$.
   - Si no existe una Carga B (por ser la última en el reporte), su periodo finaliza en el momento del último viaje reportado.

2. **Cálculo de Kilómetros y Horas Trabajadas**:
   - **Kms Recorridos**: Restamos el *Odómetro* de la Carga B menos el *Odómetro* de la Carga A.
   - **Hrs Trabajadas**: Restamos el *Horómetro* de la Carga B menos el *Horómetro* de la Carga A.

3. **Inferencia de Viajes (Mov. SP)**:
   - Filtramos todos los viajes registrados en `movSP` cuya marca de tiempo (combinando `FechaInicio` y `HoraInicio`) caiga dentro del intervalo de tiempo $[T_A, T_B)$.
   - De estos viajes sumamos **Cantidad de viajes realizados** y los **m3 movidos** que fueron propiciados por los litros de la Carga A.

### 2.4. Interfaz Implementada

La nueva pestaña muestra una tabla con las columnas:
- `#` (Número consecutivo de carga)
- `Fecha/Hora Carga`
- `Lt Carga`
- `Viajes` (Cantidad de viajes hechos hasta la próxima recarga)
- `m3 Movidos` 
- `Kms Recorridos` (Diferencia de odómetros)
- `Kms/Lt` (Rendimiento por carga: $Kms / Litros$)
- `Hrs Trabajadas` (Diferencia de horómetros)
- `Hrs/Lt` (Rendimiento por carga: $Hrs / Litros$)

---

## 3. Walkthrough ("Resumen de Ejecución")

He completado el requerimiento para visualizar la productividad desglosada por cada recarga de combustible dentro de un periodo dado en el `ReporteProductividadDetalleModal`.

### 3.1. Cambios Realizados en Código
- **Supabase / Tipos**: Se actualizó la interfaz de tipos (`src/types/reportes.types.ts`) añadiendo las propiedades opcionales `HoraCarga` para los movimientos de Diésel y `HoraInicio` para los viajes SP.
- **Consultas a Base de Datos (`ReporteProductividadDetalleModal.tsx`)**: Se modificaron los `select()` para obtener `HoraCarga` e `HoraInicio` del backend, proporcionando una precisión horaria al calcular los intervalos.
- **Lógica de Correlación**:
  - Implementé el cálculo de *timestamps* combinando fecha y hora (`getTimestamp`).
  - El algoritmo agrupa todos los *Movimientos SP* que ocurren *después* de una recarga de Diésel y *antes* de la próxima recarga.
  - Para la última recarga del periodo, se evalúan todos los viajes restantes reportados y suma sus recorridos.
  - Se calcularon totales de Rendimiento de Kilometraje (Kms/Lts) y Horómetro (Hrs/Lts) por cada ciclo de recarga.
- **Interfaz (UI/UX)**:
  - Se añadió la pestaña **"📊 Productividad por Carga"**.
  - Muestra una tabla enriquecida, incluyendo Kms recurridos, m3 Movidos, y horas trabajadas por cada ticket de carga.

### 3.2. Pruebas y Validación Realizada
- **Compilación TypeScript**: Se corrió estrictamente la compilación `npx tsc --noEmit`, pasando sin errores, lo cual garantiza que los tipos y componentes en React están congruentes.
- **Verificación Lógica**: Re-ordenamiento asegurando que los timestamps se comparan de forma absoluta y sin desfases de husos horarios no deseados.
