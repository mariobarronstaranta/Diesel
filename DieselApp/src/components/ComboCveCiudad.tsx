import { Form, Spinner } from "react-bootstrap";
import { supabase } from "../supabase/client";
import type { UseFormRegister } from "react-hook-form";
import { useComboLoader } from "../shared/hooks/useComboLoader";

/**
 * Estructura de la tabla Ciudad
 */
type Ciudad = {
  IDCiudad: number;
  CveCiudad: string;
  Descripcion: string;
};

/**
 * Props que recibe el componente desde react-hook-form
 */
interface ComboCveCiudadProps {
  register: UseFormRegister<any>;
  error?: {
    message?: string;
  };
  optional?: boolean;
}

export default function ComboCveCiudad({
  register,
  error,
  optional = false,
}: ComboCveCiudadProps) {
  const {
    data: ciudades,
    loading,
    error: loadError,
  } = useComboLoader<Ciudad>(() =>
    supabase
      .from("Ciudad")
      .select("IDCiudad, CveCiudad, Descripcion")
      .order("Descripcion", { ascending: true }),
  );

  return (
    <Form.Group>
      <Form.Label>Ciudad</Form.Label>

      <Form.Select
        {...register("CveCiudad", optional ? {} : { required: "Seleccione" })}
        isInvalid={!!error || !!loadError}
        disabled={loading}
      >
        <option value="">
          {loading
            ? "Cargando ciudades..."
            : optional
              ? "(Todas)"
              : "Seleccione"}
        </option>

        {ciudades.map((ciudad) => (
          <option key={ciudad.CveCiudad} value={ciudad.CveCiudad}>
            {ciudad.Descripcion} ({ciudad.CveCiudad})
          </option>
        ))}
      </Form.Select>

      {loading && (
        <div className="mt-2">
          <Spinner animation="border" size="sm" />
        </div>
      )}

      <Form.Control.Feedback type="invalid">
        {loadError ?? error?.message}
      </Form.Control.Feedback>
    </Form.Group>
  );
}
