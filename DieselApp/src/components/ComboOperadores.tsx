import { Form } from "react-bootstrap";
import type { UseFormRegister, FieldError } from "react-hook-form";
import { supabase } from "../supabase/client";
import { useComboLoader } from "../shared/hooks/useComboLoader";

interface ComboOperadoresProps {
  register: UseFormRegister<any>;
  error?: FieldError;
  cveCiudad?: string;
}

interface Operador {
  IDPersonal: number;
  Nombre: string;
  APaterno: string;
  AMaterno: string;
}

export default function ComboOperadores({
  register,
  error,
  cveCiudad,
}: ComboOperadoresProps) {
  const {
    data: operadores,
    loading,
    error: loadError,
  } = useComboLoader<Operador>(
    () =>
      supabase
        .from("Operadores")
        .select("IDPersonal, Nombre, APaterno, AMaterno")
        .eq("TipoPersonal", "OP")
        .eq("CveCiudad", cveCiudad ?? "")
        .order("Nombre", { ascending: true }),
    [cveCiudad],
  );

  return (
    <Form.Group>
      <Form.Label>Operador</Form.Label>
      <Form.Select
        isInvalid={!!error || !!loadError}
        disabled={!cveCiudad || loading}
        {...register("IdOperador", { required: "El operador es obligatorio" })}
      >
        <option value="">
          {loading
            ? "Cargando..."
            : cveCiudad
              ? "Seleccione un operador"
              : "Primero seleccione una ciudad"}
        </option>
        {operadores.map((operador) => (
          <option key={operador.IDPersonal} value={operador.IDPersonal}>
            {operador.Nombre} {operador.APaterno} {operador.AMaterno}
          </option>
        ))}
      </Form.Select>
      <Form.Control.Feedback type="invalid">
        {loadError ?? (error?.message as string)}
      </Form.Control.Feedback>
    </Form.Group>
  );
}
