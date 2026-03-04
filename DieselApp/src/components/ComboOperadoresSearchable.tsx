import Select from "react-select";
import { Form, Spinner } from "react-bootstrap";
import type { Control, FieldError } from "react-hook-form";
import { Controller } from "react-hook-form";
import { useComboLoader } from "../shared/hooks/useComboLoader";
import { supabase } from "../supabase/client";

interface Operador {
  IDPersonal: number;
  Nombre: string;
  APaterno: string;
  AMaterno: string;
}

interface ComboOperadoresSearchableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  name: string;
  error?: FieldError;
  cveCiudad?: string;
}

export default function ComboOperadoresSearchable({
  control,
  name,
  error,
  cveCiudad,
}: ComboOperadoresSearchableProps) {
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
    !!cveCiudad,
  );

  const options = operadores.map((o) => ({
    value: String(o.IDPersonal),
    label: `${o.Nombre} ${o.APaterno} ${o.AMaterno}`.trim(),
  }));

  const isInvalid = !!error || !!loadError;

  return (
    <Form.Group className="mb-3">
      <Form.Label>Operador</Form.Label>

      {loading && (
        <div className="d-flex align-items-center gap-2 mb-1">
          <Spinner animation="border" size="sm" />
          <small className="text-muted">Cargando operadores...</small>
        </div>
      )}

      <Controller
        name={name}
        control={control}
        rules={{ required: "El operador es obligatorio" }}
        render={({ field }) => (
          <Select
            {...field}
            options={options}
            isDisabled={!cveCiudad || loading}
            isLoading={loading}
            isClearable
            placeholder={
              !cveCiudad
                ? "Primero seleccione una ciudad"
                : "Buscar operador..."
            }
            noOptionsMessage={() => "No se encontraron operadores"}
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
