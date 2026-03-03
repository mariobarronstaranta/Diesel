import { Form, Spinner } from "react-bootstrap";
import { supabase } from "../supabase/client";
import type { UseFormRegister } from "react-hook-form";
import { useComboLoader } from "../shared/hooks/useComboLoader";

type Proveedor = {
  IdProveedor: number;
  NombreProveedor: string;
};

interface ComboProveedoresProps {
  register: UseFormRegister<any>;
  error?: {
    message?: string;
  };
}

export default function ComboProveedores({
  register,
  error,
}: ComboProveedoresProps) {
  const {
    data: proveedores,
    loading,
    error: loadError,
  } = useComboLoader<Proveedor>(() =>
    supabase
      .from("Proveedores")
      .select("IdProveedor, NombreProveedor")
      .order("NombreProveedor", { ascending: true }),
  );

  return (
    <Form.Group className="mb-3">
      <Form.Label>Proveedor</Form.Label>
      <Form.Select
        {...register("IdProveedor", { required: "Seleccione un proveedor" })}
        isInvalid={!!error || !!loadError}
        disabled={loading}
      >
        <option value="">{loading ? "Cargando..." : "Seleccione"}</option>
        {proveedores.map((p) => (
          <option key={p.IdProveedor} value={p.IdProveedor}>
            {p.NombreProveedor}
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
