import { useEffect, useState } from "react";
import { Form, Spinner } from "react-bootstrap";
import { supabase } from "../supabase/client";
import type { UseFormRegister } from "react-hook-form";

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
interface ComboCiudadProps {
  register: UseFormRegister<any>;
  error?: {
    message?: string;
  };
}

export default function ComboCiudad({ register, error }: ComboCiudadProps) {
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const cargarCiudades = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("Ciudad")
        .select("IDCiudad, CveCiudad, Descripcion")
        .order("Descripcion", { ascending: true });

      if (!error && data) {
        setCiudades(data);
      }

      setLoading(false);
    };

    cargarCiudades();
  }, []);

  return (
    <Form.Group className="mb-3">
      <Form.Label>Ciudad</Form.Label>

      <Form.Select
        {...register("IDCiudad", {
          required: "Seleccione",
        })}
        isInvalid={!!error}
        disabled={loading}
      >
        <option value="">
          {loading ? "Cargando ciudades..." : "Seleccione"}
        </option>

        {ciudades.map((ciudad) => (
          <option key={ciudad.IDCiudad} value={ciudad.IDCiudad}>
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
        {error?.message}
      </Form.Control.Feedback>
    </Form.Group>
  );
}
