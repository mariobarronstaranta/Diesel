# 🚀 Guía de Optimización de Tokens y Productividad en Antigravity

Esta guía contiene las mejores prácticas para maximizar el rendimiento de la IA, reducir el consumo de tokens y acelerar el desarrollo en tus proyectos.

---

## 1. Gestión del Contexto (Menos es Más)
Antigravity lee automáticamente los archivos que tienes abiertos. Cada archivo extra suma miles de tokens al "input" de cada mensaje.

*   **Poda tus pestañas:** Cierra todos los archivos que no sean estrictamente necesarios para la tarea actual. Si estamos en el Login, cierra el Reporte de Ventas.
*   **Aísla tus problemas:** Cuando termines un "épico" (ej. terminar el módulo de Inventarios) y pases a otro (ej. Facturación), **inicia una conversación nueva**. Esto evita que la IA arrastre historial irrelevante.

## 2. Comunicación Estructurada
La IA trabaja mejor cuando tiene un mapa claro.

*   **Flujo Plan → Ejecución:** Siempre pide o acepta un `implementation_plan.md`. Corregir lógica en un plan de texto es mucho más barato que corregir 500 líneas de código generado erróneamente.
*   **Rutas Explícitas:** En lugar de decir *"busca el archivo de configuración"*, di *"revisa `src/config/api.ts`"*. Esto ahorra ciclos de búsqueda y lectura de directorios.
*   **Proporciona Esquemas:** Si vas a trabajar con bases de datos, pega el DDL de la tabla o el fragmento del modelo. Evita que la IA tenga que "adivinar" o explorar la base de datos por su cuenta.

## 3. Peticiones de Código Eficientes
*   **Modificaciones Atómicas:** Trata de resolver una funcionalidad a la vez. Las peticiones masivas suelen generar alucinaciones o errores que consumen más mensajes (y tokens) para corregir.
*   **Batching de Estética:** Agrupa cambios visuales menores. *"Cambia el color a azul, pon negrita al título y agranda el botón"* es más eficiente que 3 mensajes por separado.
*   **Usa el Playground:** Para preguntas teóricas, conceptos nuevos o redacción de correos, usa la sección de **Playground**. No consume el contexto de tu proyecto y es más rápido.

## 4. Evitar Retrabajos
*   **Reglas de Proyecto:** Si notas que la IA repite un error (ej. usar `parseInt` en lugar de `parseFloat`), dile: *"En este proyecto, para campos numéricos de base de datos siempre usamos `parseFloat`"*. Una instrucción clara ahorra múltiples fallos futuros.
*   **Revisión de Errores:** Antes de pedir un cambio, asegúrate de que el código actual compile o corre `npm run dev` para ver el error exacto. Mensajes de error claros (`StackTraces`) ayudan a la IA a solucionar el problema en un solo intento.

---

## 5. Estructura Óptima de un Requerimiento (The Gold Standard)
Para que yo (la IA) trabaje con precisión quirúrgica y use el mínimo de tokens posible, trata de documentar tus peticiones en un archivo `.md` siguiendo este formato:

### A. El Objetivo (¿Qué queremos lograr?)
Una frase corta y clara.
*   **Ejemplo:** *"Agregar reporte de mermas por camión."*

### B. Alcance Funcional (¿Qué debe hacer?)
Lista de puntos con la funcionalidad esperada.
*   **Checklist:** Pestaña nueva, botón de exportación, validación de campos.

### C. El Modelo de Datos (¿De dónde viene la info?)
**Esto es lo que más ahorra tokens.** En lugar de que yo busque en toda la DB, dime exactamente los campos.
*   **Formato:** `Tabla: NombreTabla (Campo1, Campo2, Campo3)`.

### D. Reglas de Negocio y Casos de Borde
Dime cómo calcular las cosas y qué pasa si no hay datos.
*   **Ejemplo:** *"Si el valor es nulo, mostrar 0.00. El cálculo es (A - B) / C."*

### E. Restricciones Técnicas
*   **Ejemplo:** *"Usar solo componentes de React-Bootstrap. No usar librerías externas de gráficas."*

---

## checklist para cada nueva sesión:
- [ ] ¿He cerrado archivos irrelevantes?
- [ ] ¿He iniciado un nuevo chat si cambié de tema?
- [ ] ¿Tengo a la mano las rutas de los archivos involucrados?
- [ ] ¿He definido el alcance de lo que quiero lograr hoy?

> [!TIP]
> **Dato Curioso:** Un chat con 30 mensajes y 10 archivos abiertos puede llegar a consumir 50 veces más tokens por turno que un chat nuevo con 1 solo archivo. ¡Optimizar vale la pena!
