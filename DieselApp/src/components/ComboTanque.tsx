import { useEffect, useState } from "react";
import type { UseFormRegister } from "react-hook-form";
import { supabase } from "../supabase/client";
import { Spinner } from "react-bootstrap";

interface Tanque {
  IDTanque: number;
  Nombre: string;
}

interface ComboTanqueProps {
  idPlanta: number | null;
  register: UseFormRegister<any>;
}

export default function ComboTanque({ idPlanta, register }: ComboTanqueProps) {
  const [tanques, setTanques] = useState<Tanque[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!idPlanta) {
      setTanques([]);
      return;
    }

    const fetchTanques = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("Tanque")
        .select("IDTanque, Nombre")
        .eq("IDPlanta", Number(idPlanta))
        .order("Nombre");

      if (error) {
        console.error("Error cargando tanques:", error);
        setTanques([]);
      } else {
        setTanques(data ?? []);
      }

      setLoading(false);
    };

    fetchTanques();
  }, [idPlanta]);

  return (
    <div className="mb-3">
      <label className="form-label d-flex align-items-center gap-2">
        Tanque
        {loading && <Spinner animation="border" size="sm" />}
      </label>

      <select
        className="form-select"
        disabled={!idPlanta || loading}
        {...register("IDTanque", { required: true })}
      >
        <option value="">
          {!idPlanta
            ? "Seleccione una planta"
            : loading
              ? "Cargando tanques..."
              : "Seleccione un tanque"}
        </option>

        {tanques.map((tanque) => (
          <option key={tanque.IDTanque} value={tanque.IDTanque}>
            {tanque.Nombre}
          </option>
        ))}
      </select>
    </div>
  );
}
