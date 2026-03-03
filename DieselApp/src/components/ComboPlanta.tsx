import type { UseFormRegister } from "react-hook-form";
import { supabase } from "../supabase/client";
import { Spinner } from "react-bootstrap";
import { useComboLoader } from "../shared/hooks/useComboLoader";

interface Planta {
  IDPlanta: number;
  Nombre: string;
}

interface ComboPlantaProps {
  idCiudad: number | null;
  register: UseFormRegister<any>;
}

export default function ComboPlanta({ idCiudad, register }: ComboPlantaProps) {
  const {
    data: plantas,
    loading,
    error,
  } = useComboLoader<Planta>(
    async () =>
      supabase
        .from("Planta")
        .select("IDPlanta, Nombre")
        .eq("IDCiudad", Number(idCiudad))
        .order("Nombre"),
    [idCiudad],
    !!idCiudad, // no disparar query si no hay ciudad seleccionada
  );

  if (!idCiudad) {
    return (
      <div className="mb-3">
        <label className="form-label">Planta</label>
        <select
          className="form-select"
          disabled
          {...register("IDPlanta", { required: true })}
        >
          <option value="">Seleccione una ciudad</option>
        </select>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <label className="form-label d-flex align-items-center gap-2">
        Planta
        {loading && <Spinner animation="border" size="sm" />}
      </label>
      <select
        className={`form-select${error ? " is-invalid" : ""}`}
        disabled={loading}
        {...register("IDPlanta", { required: true })}
      >
        <option value="">
          {loading ? "Cargando plantas..." : "Seleccione una planta"}
        </option>
        {plantas.map((planta) => (
          <option key={planta.IDPlanta} value={planta.IDPlanta}>
            {planta.Nombre}
          </option>
        ))}
      </select>
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  );
}
