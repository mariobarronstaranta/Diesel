import { useEffect, useState } from "react";
import type { UseFormRegister } from "react-hook-form";
import { supabase } from "../supabase/client";
import { Spinner } from "react-bootstrap";

interface Planta {
  IDPlanta: number;
  Nombre: string;
}

interface ComboPlantaProps {
  idCiudad: number | null;
  register: UseFormRegister<any>;
}

export default function ComboPlanta({ idCiudad, register }: ComboPlantaProps) {
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!idCiudad) {
      setPlantas([]);
      return;
    }

    const fetchPlantas = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("Planta")
        .select("IDPlanta, Nombre")
        .eq("IDCiudad", Number(idCiudad))
        .order("Nombre");

      if (error) {
        console.error("Error cargando plantas:", error);
        setPlantas([]);
      } else {
        setPlantas(data ?? []);
      }

      setLoading(false);
    };

    fetchPlantas();
  }, [idCiudad]);

  return (
    <div className="mb-3">
      <label className="form-label d-flex align-items-center gap-2">
        Planta
        {loading && <Spinner animation="border" size="sm" />}
      </label>

      <select
        className="form-select"
        disabled={!idCiudad || loading}
        {...register("IDPlanta", { required: true })}
      >
        <option value="">
          {!idCiudad
            ? "Seleccione una ciudad"
            : loading
              ? "Cargando plantas..."
              : "Seleccione una planta"}
        </option>

        {plantas.map((planta) => (
          <option key={planta.IDPlanta} value={planta.IDPlanta}>
            {planta.Nombre}
          </option>
        ))}
      </select>
    </div>
  );
}
