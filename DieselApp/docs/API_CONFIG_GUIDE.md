# Guía de Configuración de API - DieselApp

## 📝 Variables de Entorno

### Archivo `.env`
Este es el archivo principal que contiene las variables de configuración. **No se sube a GitHub** (está en `.gitignore`).

### Archivos de ambiente
- **`.env.development`** - Configuración para desarrollo
- **`.env.production`** - Configuración para producción
- **`.env.example`** - Plantilla (SÍ se sube a GitHub)

Vite carga automáticamente el `.env` correcto según el comando:
- `npm run dev` → usa `.env.development`
- `npm run build` → usa `.env.production`
- Si no existen esos archivos, usa `.env`

---

## 🔧 Cómo Usar

### 1. Agregar nuevo endpoint

Edita `src/config/api.config.ts`:

```typescript
export const API_ENDPOINTS = {
  lecturas: {
    crear: `${API_BASE_URL}/api/lecturas/crear`,
    listar: `${API_BASE_URL}/api/lecturas`,
  },
  
  // Agregar nuevo grupo de endpoints
  usuarios: {
    login: `${API_BASE_URL}/api/usuarios/login`,
    perfil: (id: number) => `${API_BASE_URL}/api/usuarios/${id}`,
  },
} as const;
```

### 2. Usar en componentes

```tsx
import { API_ENDPOINTS, apiRequest } from "../config/api.config";

// GET simple
const data = await apiRequest(API_ENDPOINTS.lecturas.listar);

// POST con body
const result = await apiRequest(API_ENDPOINTS.lecturas.crear, {
  method: "POST",
  body: JSON.stringify({ nombre: "valor" }),
});

// DELETE
await apiRequest(API_ENDPOINTS.lecturas.eliminar(123), {
  method: "DELETE",
});

// Con parámetros dinámicos
const perfil = await apiRequest(API_ENDPOINTS.usuarios.perfil(userId));
```

### 3. Manejo de errores

```tsx
try {
  const result = await apiRequest(API_ENDPOINTS.lecturas.crear, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  
  if (result.success) {
    // Éxito
  } else {
    // Error en respuesta del servidor
  }
} catch (error) {
  // Error de red o parsing
  console.error("Error:", error);
}
```

---

## 🌍 Cambiar de Ambiente

### Opción 1: Editar `.env` manualmente
```bash
# Desarrollo
VITE_API_BASE_URL=http://localhost:5000

# Pruebas
VITE_API_BASE_URL=http://18.207.42.217/apitest

# Producción
VITE_API_BASE_URL=https://api.produccion.com
```

### Opción 2: Usar archivos específicos
1. Edita `.env.production` con la URL de producción
2. Ejecuta `npm run build` (usará automáticamente `.env.production`)

**IMPORTANTE:** Después de cambiar variables, **debes reiniciar** el servidor de desarrollo o recompilar.

---

## 🔒 Seguridad

### Variables públicas
Solo usa variables con prefijo `VITE_` - estas se compilan en el bundle y son públicas.

✅ **Seguro:**
```bash
VITE_API_BASE_URL=http://api.ejemplo.com
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=... # La "anon key" es pública
```

❌ **NO seguro (secretos del servidor):**
```bash
# Estas NO deben ir aquí porque se expondrían al público
DATABASE_PASSWORD=secreto123
PRIVATE_API_KEY=xyz789
```

---

## 📋 Checklist de Despliegue

Cuando despliegues a producción:

- [ ] Actualizar `.env.production` con URL de producción
- [ ] Ejecutar `npm run build`
- [ ] Verificar en `dist/assets/index-*.js` que la URL sea correcta
- [ ] Copiar archivos a IIS
- [ ] Verificar que funcione

---

## 💡 Ejemplo Completo

**Componente nuevo que use múltiples endpoints:**

```tsx
import { API_ENDPOINTS, apiRequest } from "../config/api.config";

function MiComponente() {
  const handleCargarLecturas = async () => {
    try {
      const lecturas = await apiRequest(API_ENDPOINTS.lecturas.listar);
      console.log(lecturas);
    } catch (error) {
      console.error("Error al cargar:", error);
    }
  };

  const handleCrearLectura = async (datos) => {
    const result = await apiRequest(API_ENDPOINTS.lecturas.crear, {
      method: "POST",
      body: JSON.stringify(datos),
    });
    return result;
  };

  return <div>...</div>;
}
```

---

## 🔍 Debugging

Ver las variables de entorno cargadas:
```typescript
console.log(import.meta.env);
```

Esto mostrará todas las variables `VITE_*` disponibles.
