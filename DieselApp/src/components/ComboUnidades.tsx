import { Form } from "react-bootstrap";
import type { UseFormRegister, FieldError } from "react-hook-form";
import { supabase } from "../supabase/client";
import { useComboLoader } from "../shared/hooks/useComboLoader";

interface ComboUnidadesProps {
  register: UseFormRegister<any>;
  error?: FieldError;
  cveCiudad?: string;
}

interface Unidad {
  IDUnidad: number;
  IDClaveUnidad: string;
  ClaveAlterna: string;
}

export default function ComboUnidades({
  register,
  error,
  cveCiudad,
}: ComboUnidadesProps) {
  const {
    data: unidades,
    loading,
    error: loadError,
  } = useComboLoader<Unidad>(
    () =>
      supabase
        .from("Unidades")
        .select("IDUnidad, IDClaveUnidad, ClaveAlterna")
        .eq("CveCiudad", cveCiudad ?? "")
        .eq("Activo", "1")
        .order("IDClaveUnidad", { ascending: true }),
    [cveCiudad],
  );

  return (
    <Form.Group>
      <Form.Label>Unidad</Form.Label>
      <Form.Select
        isInvalid={!!error || !!loadError}
        disabled={!cveCiudad || loading}
        {...register("IDUnidad", { required: "La unidad es obligatoria" })}
      >
        <option value="">
          {loading
            ? "Cargando..."
            : cveCiudad
              ? "Seleccione una unidad"
              : "Primero seleccione una ciudad"}
        </option>
        {unidades.map((unidad) => (
          <option key={unidad.IDUnidad} value={unidad.IDUnidad}>
            {unidad.IDClaveUnidad} ({unidad.ClaveAlterna})
          </option>
        ))}
      </Form.Select>
      <Form.Control.Feedback type="invalid">
        {loadError ?? (error?.message as string)}
      </Form.Control.Feedback>
    </Form.Group>
  );
}
