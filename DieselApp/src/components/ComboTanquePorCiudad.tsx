import { Form, Spinner } from "react-bootstrap";
import { supabase } from "../supabase/client";
import type { UseFormRegister } from "react-hook-form";
import { useComboLoader } from "../shared/hooks/useComboLoader";

type Tanque = {
  IDTanque: number;
  Nombre: string;
};

interface ComboTanquePorCiudadProps {
  cveCiudad: string | null;
  register: UseFormRegister<any>;
  error?: {
    message?: string;
  };
  optional?: boolean;
}

export default function ComboTanquePorCiudad({
  cveCiudad,
  register,
  error,
  optional = false,
}: ComboTanquePorCiudadProps) {
  const {
    data: tanques,
    loading,
    error: loadError,
  } = useComboLoader<Tanque>(
    () =>
      supabase
        .from("Tanque")
        .select("IDTanque, Nombre")
        .eq("CveCiudad", cveCiudad ?? "")
        .order("Nombre", { ascending: true }),
    [cveCiudad],
  );

  const isDisabled = !optional && (!cveCiudad || loading);

  return (
    <Form.Group className="mb-3">
      <Form.Label>Tanque</Form.Label>
      <Form.Select
        {...register(
          "IDTanque",
          optional ? {} : { required: "Seleccione un tanque" },
        )}
        isInvalid={!!error || !!loadError}
        disabled={isDisabled}
      >
        <option value="">
          {!cveCiudad && !optional
            ? "Seleccione una ciudad"
            : loading
              ? "Cargando..."
              : optional
                ? "(Todos)"
                : "Seleccione"}
        </option>
        {tanques.map((t) => (
          <option key={t.IDTanque} value={t.IDTanque}>
            {t.Nombre}
          </option>
        ))}
      </Form.Select>
      {loading && <Spinner animation="border" size="sm" className="mt-1" />}
      <Form.Control.Feedback type="invalid">
        {loadError ?? error?.message}
      </Form.Control.Feedback>
    </Form.Group>
  );
}
