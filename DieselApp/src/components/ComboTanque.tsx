import type { UseFormRegister } from "react-hook-form";
import { supabase } from "../supabase/client";
import { Spinner } from "react-bootstrap";
import { useComboLoader } from "../shared/hooks/useComboLoader";

interface Tanque {
  IDTanque: number;
  Nombre: string;
}

interface ComboTanqueProps {
  idPlanta: number | null;
  register: UseFormRegister<any>;
}

export default function ComboTanque({ idPlanta, register }: ComboTanqueProps) {
  const {
    data: tanques,
    loading,
    error,
  } = useComboLoader<Tanque>(
    async () =>
      supabase
        .from("Tanque")
        .select("IDTanque, Nombre")
        .eq("IDPlanta", Number(idPlanta))
        .order("Nombre"),
    [idPlanta],
    !!idPlanta, // no disparar query si no hay planta seleccionada
  );

  if (!idPlanta) {
    return (
      <div className="mb-3">
        <label className="form-label">Tanque</label>
        <select
          className="form-select"
          disabled
          {...register("IDTanque", { required: true })}
        >
          <option value="">Seleccione una planta</option>
        </select>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <label className="form-label d-flex align-items-center gap-2">
        Tanque
        {loading && <Spinner animation="border" size="sm" />}
      </label>
      <select
        className={`form-select${error ? " is-invalid" : ""}`}
        disabled={loading}
        {...register("IDTanque", { required: true })}
      >
        <option value="">
          {loading ? "Cargando tanques..." : "Seleccione un tanque"}
        </option>
        {tanques.map((tanque) => (
          <option key={tanque.IDTanque} value={tanque.IDTanque}>
            {tanque.Nombre}
          </option>
        ))}
      </select>
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  );
}
