import Select from "react-select";
import { Form, Spinner } from "react-bootstrap";
import type { Control, FieldError } from "react-hook-form";
import { Controller } from "react-hook-form";
import { useComboLoader } from "../shared/hooks/useComboLoader";
import { supabase } from "../supabase/client";

interface Unidad {
  IDUnidad: number;
  IDClaveUnidad: string;
  ClaveAlterna: string;
}

interface ComboUnidadesSearchableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  name: string;
  error?: FieldError;
  cveCiudad?: string;
}

export default function ComboUnidadesSearchable({
  control,
  name,
  error,
  cveCiudad,
}: ComboUnidadesSearchableProps) {
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
    !!cveCiudad,
  );

  const options = unidades.map((u) => ({
    value: String(u.IDUnidad),
    label: `${u.IDClaveUnidad} (${u.ClaveAlterna})`,
  }));

  const isInvalid = !!error || !!loadError;

  return (
    <Form.Group className="mb-3">
      <Form.Label>Unidad</Form.Label>

      {loading && (
        <div className="d-flex align-items-center gap-2 mb-1">
          <Spinner animation="border" size="sm" />
          <small className="text-muted">Cargando unidades...</small>
        </div>
      )}

      <Controller
        name={name}
        control={control}
        rules={{ required: "La unidad es obligatoria" }}
        render={({ field }) => (
          <Select
            {...field}
            options={options}
            isDisabled={!cveCiudad || loading}
            isLoading={loading}
            isClearable
            placeholder={
              !cveCiudad ? "Primero seleccione una ciudad" : "Buscar unidad..."
            }
            noOptionsMessage={() => "No se encontraron unidades"}
            loadingMessage={() => "Cargando..."}
            value={options.find((o) => o.value === field.value) ?? null}
            onChange={(selected) => field.onChange(selected?.value ?? "")}
            styles={{
              control: (base) => ({
                ...base,
                borderColor: isInvalid ? "#dc3545" : base.borderColor,
                "&:hover": {
                  borderColor: isInvalid ? "#dc3545" : base.borderColor,
                },
              }),
            }}
          />
        )}
      />

      {isInvalid && (
        <div className="invalid-feedback d-block">
          {loadError ?? error?.message}
        </div>
      )}
    </Form.Group>
  );
}
