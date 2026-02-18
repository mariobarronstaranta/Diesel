# Documentación de Componentes

Este directorio contiene la documentación técnica completa de cada componente de la aplicación DieselApp.

## Estructura de Documentos

Cada archivo `.md` documenta un componente de React y sigue una estructura estandarizada:

1. **Propósito** - Descripción breve del componente
2. **Firma del Componente** - Tipo TypeScript de la función
3. **TypeScript Types** - Interfaces utilizadas
4. **Props** - Propiedades recibidas
5. **Dependencias** - Librerías y otros componentes
6. **Estado Interno** - Estados de React utilizados
7. **React Hooks** - Hooks empleados
8. **Funciones Internas** - Funciones auxiliares
9. **Integración de Datos** - Conexiones con Supabase
10. **Comportamiento** - Flujos de usuario
11. **Ejemplo de Uso** - Código de ejemplo
12. **Notas Técnicas** - Detalles de implementación

## Componentes Documentados

### Formularios de Captura
- `CapturaLecturas.md` - Captura de lecturas diarias de tanques
- `EntradasDiesel.md` - Registro de entradas de combustible
- `SalidasDiesel.md` - Registro de salidas de combustible a unidades

### Selectores (Combos)
- `ComboCiudad.md` - Selector de ciudades
- `ComboCveCiudad.md` - Selector de clave de ciudad
- `ComboOperadores.md` - Selector de operadores filtrado
- `ComboPlanta.md` - Selector de plantas
- `ComboProveedores.md` - Selector de proveedores
- `ComboTanque.md` - Selector de tanques
- `ComboTanquePorCiudad.md` - Selector de tanques por ciudad
- `ComboUnidades.md` - Selector de unidades vehiculares

### Reportes
- `ReporteLecturas.md` - Reporte de lecturas diarias con CRUD
- `ReporteConsumos.md` - Reporte de consumos (entradas/salidas)

### Navegación
- `Login.md` - Componente de autenticación
- `TopNav.md` - Barra de navegación superior

---

## 📝 Mantenimiento de Documentación

### ⚠️ IMPORTANTE: Actualización Obligatoria

**Esta documentación debe actualizarse cada vez que se realicen cambios técnicos en los componentes.**

### Cuándo Actualizar

Debes actualizar la documentación cuando:
- ✅ Se agreguen o modifiquen **props** del componente
- ✅ Se cambien **tipos TypeScript** (interfaces)
- ✅ Se añadan nuevos **estados** o **hooks**
- ✅ Se modifiquen **funciones de Supabase** (RPCs, queries)
- ✅ Se agreguen o eliminen **funciones internas**
- ✅ Cambien los **flujos de usuario** o comportamiento
- ✅ Se actualicen **dependencias** importantes
- ✅ Se modifiquen **validaciones** del formulario

### Cómo Actualizar

1. **Identifica el componente modificado**
   - Busca el archivo `.md` correspondiente en `docs/components/`

2. **Actualiza las secciones relevantes**
   - Mantén la estructura establecida
   - Sé específico y conciso
   - Incluye ejemplos de código cuando sea útil

3. **Verifica la consistencia**
   - Asegúrate de que los tipos TypeScript coincidan con el código
   - Confirma que los ejemplos de uso sean válidos
   - Revisa que las funciones de Supabase estén actualizadas

4. **Documenta el cambio en el Backlog**
   - Si el cambio es significativo, añade una entrada en `docs/Backlog/`

### Ejemplo de Actualización

**Antes** (componente modificado):
```tsx
// Se agregó nuevo prop 'showExportButton'
interface ReporteProps {
  showExportButton?: boolean;
}
```

**Después** (documentación actualizada):
```markdown
## Props
- `showExportButton?: boolean` - Muestra/oculta botón de exportar CSV (default: true)
```

### Responsabilidad del Desarrollador

> 💡 **Regla de Oro**: Si modificas el código de un componente, actualiza su documentación en la misma sesión de trabajo.

Esto asegura que:
- La documentación siempre refleje el estado actual del código
- Otros desarrolladores puedan entender rápidamente los cambios
- Se mantenga un registro histórico de la evolución del componente
- La integración entre componentes esté bien documentada

---

## Convenciones de Formato

- **Negrita** para nombres de propiedades, estados, funciones principales
- `Código` para tipos, valores, nombres de archivos
- Tablas para listar opciones, estados, o comparaciones
- Bloques de código con sintaxis TypeScript/TSX
- Diagramas de flujo simples usando texto ASCII cuando sea útil
