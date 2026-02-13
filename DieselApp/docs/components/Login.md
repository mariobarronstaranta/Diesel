# Login

## Propósito
Componente de autenticación que valida credenciales de usuario contra la tabla `Usuarios` de Supabase y redirige a la aplicación principal.

## Firma del Componente
```typescript
function Login(): JSX.Element
```

No recibe props - es una página completa de autenticación.

## TypeScript Types

No define interfaces explícitas, pero usa los siguientes tipos:
- `usuario: string` - Nombre de usuario
- `password: string` - Contraseña
- `error: string` - Mensaje de error de autenticación

## Dependencias
- `react` (`useState`)
- `react-bootstrap` (`Container`, `Card`, `Form`, `Button`, `Alert`)
- `react-router-dom` (`useNavigate`)
- `supabase` client local

## Estado interno
- `usuario: string` - Campo de usuario (estado controlado)
- `password: string` - Campo de contraseña (estado controlado)
- `error: string` - Mensaje de error (vacío si no hay error)

## React Hooks

### useState
- `useState<string>("")` - `usuario` (campo de texto para usuario)
- `useState<string>("")` - `password` (campo de contraseña)
- `useState<string>("")` - `error` (mensaje de error)

### useNavigate
```typescript
const navigate = useNavigate();
```
Hook de `react-router-dom` para navegación programática tras login exitoso.

## Funciones Internas

### onLogin
```typescript
async function onLogin(e: React.FormEvent): Promise<void>
```
**Lógica de autenticación:**
1. Previene comportamiento por defecto del formulario (`e.preventDefault()`)
2. Limpia errores previos
3. Consulta tabla `Usuarios` filtrando por `CveUsuario` y `Password`
4. Si no encuentra coincidencias → Muestra error
5. Si encuentra usuario → Navega a `/captura`

**Importante:** 
- ⚠️ **Sin encriptación** - La contraseña se compara en texto plano
- ⚠️ **Sin gestión de sesión** - No usa tokens ni cookies
- ⚠️ **Sin almacenamiento de usuario** - No guarda información del usuario autenticado

## Integración de datos

### Tabla: `Usuarios`

Query de autenticación:
```typescript
await supabase
  .from("Usuarios")
  .select("CveUsuario")
  .eq("CveUsuario", usuario)
  .eq("Password", password)
  .limit(1);
```

**Campos consultados:**
- `CveUsuario` (string) - Clave de usuario
- `Password` (string) - Contraseña en texto plano

**Validación:**
- Si `error` existe → Credenciales incorrectas
- Si `data` es null o vacío → Credenciales incorrectas
- Si `data.length > 0` → Login exitoso

## Validaciones HTML

| Campo | Validación |
|-------|------------|
| Usuario | `required` (nativo HTML5) |
| Contraseña | `required` (nativo HTML5), `type="password"` |

No usa `react-hook-form` - validación nativa del navegador.

## Estructura Visual

```
┌────────────────────────────────────────────┐
│  [Gradiente azul de fondo pantalla completa]│
│                                            │
│    ┌──────────────────────────┐           │
│    │  🏢 Admon. Combustibles   │           │
│    │     Bienvenido            │           │
│    │                           │           │
│    │  [Alert error si falla]   │           │
│    │                           │           │
│    │  USUARIO                  │           │
│    │  [________________]       │           │
│    │                           │           │
│    │  CONTRASEÑA               │           │
│    │  [****************]       │           │
│    │                           │           │
│    │    [  INGRESAR  ]         │           │
│    │                           │           │
│    │  © 2026 Diesel App System │           │
│    └──────────────────────────┘           │
│                                            │
└────────────────────────────────────────────┘
```

## Estilos personalizados

### Fondo de pantalla completa
```css
background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
position: fixed;
top: 0; left: 0;
width: 100%; height: 100%;
```

### Card centrado
```css
maxWidth: "500px"
className: "shadow-lg border-0 rounded-4"
padding: p-5 (en Card.Body)
```

### Botón de login
```css
background: #f0ad4e (color warning personalizado)
border: none
color: white
fw-bold (font-weight: bold)
```

## Flujo de autenticación

```
Usuario ingresa credenciales
  └─► Hace clic en "INGRESAR"
       └─► onLogin()
            ├─► Query a Supabase
            ├─► ¿Usuario existe?
            │    ├─► SÍ → navigate("/captura")
            │    └─► NO → setError("Usuario o contraseña incorrectos")
            └─► Muestra Alert de error si falla
```

## Navegación tras login exitoso

```typescript
navigate("/captura");
```

Redirige a la página de **Captura de Lecturas** (`/captura`).

## UX Características
- **AutoFocus** en campo usuario para UX inmediata
- **Alert dismissible** para errores de login
- **Gradiente azul** profesional en fondo (#1e3c72 → #2a5298)
- **Card elevado** con sombra (`shadow-lg`) y bordes redondeados (`rounded-4`)
- **Botón full-width** (`d-grid gap-2`) para mejor accesibilidad móvil
- **Footer con copyright** dentro del card

## Ejemplo de uso en router
```tsx
import Login from './auth/Login';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/captura" element={<CapturaLecturas />} />
        {/* Más rutas... */}
      </Routes>
    </BrowserRouter>
  );
}
```

## Notas técnicas

### ⚠️ Consideraciones de seguridad

> [!WARNING]
> **Este componente tiene limitaciones de seguridad importantes:**
> 1. **Contraseñas en texto plano** - No usa hashing (bcrypt, argon2, etc.)
> 2. **Sin protección CSRF** - No implementa tokens anti-CSRF
> 3. **Sin gestión de sesión** - No almacena usuario autenticado (localStorage, cookies, JWT)
> 4. **Sin rate limiting** - Vulnerable a ataques de fuerza bruta
> 5. **Sin protección contra inyección SQL** - Aunque Supabase mitiga esto, el patrón es básico

### Mejoras sugeridas (futuras)

1. **Usar Supabase Auth** en lugar de query manual:
   ```typescript
   const { data, error } = await supabase.auth.signInWithPassword({
     email: usuario,
     password: password
   });
   ```

2. **Almacenar sesión**:
   ```typescript
   localStorage.setItem('user', JSON.stringify(data.user));
   ```

3. **Proteger rutas** con guards de autenticación

4. **Añadir "Recordarme"** y "Olvidé mi contraseña"

### Diferencias con otros componentes

| Aspecto | Login | Otros formularios |
|---------|-------|-------------------|
| Hook de formulario | useState nativo | react-hook-form |
| Validación | HTML5 nativa | react-hook-form con reglas |
| Layout | Pantalla completa centrada | Container fluid con Cards |
| Navegación | useNavigate() | N/A |
| Objetivo | Autenticación | CRUD de datos |

### Ubicación del archivo
```
DieselApp/
  └─ src/
      └─ auth/
          └─ Login.tsx  ← Este componente
```

A diferencia de otros componentes que están en `src/components/`, este está en `src/auth/` por su naturaleza de autenticación.
