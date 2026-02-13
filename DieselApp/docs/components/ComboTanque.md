# ComboTanque

## Propósito
Selector de tanque filtrado por planta. Tercer nivel en la selección en cascada: Ciudad → Planta → Tanque.

## Firma del Componente
```typescript
function ComboTanque({ idPlanta, register }: ComboTanqueProps): JSX.Element
```

## TypeScript Types

### Tanque
```typescript
interface Tanque {
  IDTanque: number;
  Nombre: string;
}
```

### ComboTanqueProps
```typescript
interface ComboTanqueProps {
  idPlanta: number | null;
  register: UseFormRegister<any>;
}
```

## Props
- `idPlanta: number | null` - ID de la planta seleccionada; determina el filtrado
- `register: UseFormRegister<any>` - Función de registro de react-hook-form

## Dependencias
- `react` (`useEffect`, `useState`)
- `react-bootstrap` (`Spinner`)
- `react-hook-form` (`UseFormRegister`)
- `supabase` client local

## Estado interno
- `tanques: Tanque[]` - Array de tanques filtrados por planta
- `loading: boolean` - Indicador de carga

## React Hooks
- `useState<Tanque[]>([])` - Almacena tanques de la planta seleccionada
- `useState<boolean>(false)` - Estado de carga
- `useEffect(() => {...}, [idPlanta])` - Recarga tanques cuando cambia la planta

## Funciones Internas

### fetchTanques
```typescript
async function fetchTanques(): Promise<void>
```
Consulta tanques filtrados por `IDPlanta`. Maneja errores registrándolos en consola.

## Integración de datos
- **Tabla**: `Tanque`
- **Consulta**: `select("IDTanque, Nombre").eq("IDPlanta", idPlanta).order("Nombre")`
- **Campo del formulario**: `IDTanque`
- **Validación**: Campo obligatorio (`required: true`)

## Comportamiento en cascada

### Jerarquía de selección
```
Ciudad (IDCiudad)
  └─► Planta (IDPlanta)
       └─► Tanque (IDTanque) ◄── Este componente
```

### Lógica de dependencia
1. **Si `idPlanta` es `null`**: Limpia tanques y deshabilita selector
2. **Si `idPlanta` cambia**: Nueva consulta filtrada
3. **Durante carga**: Spinner visible y selector deshabilitado

## Estados del selector

| Condición | Texto de opción | Estado |
|-----------|----------------|--------|
| Sin planta seleccionada | "Seleccione una planta" | Deshabilitado |
| Cargando | "Cargando tanques..." | Deshabilitado |
| Listo | "Seleccione un tanque" | Habilitado |

## Ejemplo de uso
```tsx
import { useForm } from 'react-hook-form';
import ComboCiudad from './components/ComboCiudad';
import ComboPlanta from './components/ComboPlanta';
import ComboTanque from './components/ComboTanque';

type FormData = {
  IDCiudad: string;
  IDPlanta: string;
  IDTanque: string;
};

function CapturaForm() {
  const { register, watch } = useForm<FormData>();
  const idCiudad = watch('IDCiudad');
  const idPlanta = watch('IDPlanta');

  return (
    <form>
      <ComboCiudad register={register} />
      <ComboPlanta 
        idCiudad={idCiudad ? Number(idCiudad) : null} 
        register={register} 
      />
      <ComboTanque 
        idPlanta={idPlanta ? Number(idPlanta) : null} 
        register={register} 
      />
    </form>
  );
}
```

## Comportamiento reactivo

Cuando el usuario cambia la ciudad (nivel superior):
1. `ComboPlanta` se recarga con nuevas plantas
2. `ComboTanque` se limpia automáticamente (porque `idPlanta` cambiará a `null` o a un nuevo valor)
3. El usuario debe volver a seleccionar planta y tanque

## Notas técnicas
- El componente usa la misma estructura que `ComboPlanta` para mantener consistencia
- El spinner se muestra inline en el label
- La conversión explícita a `Number()` asegura tipos correctos en la consulta
- Errores se registran en consola pero no se muestran en UI
