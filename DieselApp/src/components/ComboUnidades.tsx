import { Form, Spinner } from "react-bootstrap";
import { useState, useEffect } from "react";
import type { UseFormRegister, FieldError } from "react-hook-form";
import { supabase } from "../supabase/client";

interface ComboUnidadesProps {
  register: UseFormRegister<any>;
  error?: FieldError;
  cveCiudad?: string;
  optional?: boolean;
  idTanque?: string | null; // Cuando se pasa, filtra unidades del tanque específico
}

interface Unidad {
  IDUnidad: number;
  IDClaveUnidad: string;
  ClaveAlterna: string;
}

export default function ComboUnidades({
  register,
  error,
  cveCiudad,
  optional = false,
  idTanque,
}: ComboUnidadesProps) {
  const tanqueSeleccionado = idTanque ? parseInt(idTanque) : null;
  const tieneCiudad = !!cveCiudad;

  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Sin ciudad: limpiar y no consultar
    if (!tieneCiudad) {
      setUnidades([]);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    const cargar = async () => {
      try {
        // ────────────────────────────────────────────────────────────────────
        // En ambos modos (tanque específico o "Todos") consultamos primero
        // TanqueMovimiento para obtener SOLO unidades con movimientos reales.
        // Diferencia:
        //   - Con tanque: filtra por IdTanque
        //   - Sin tanque (Todos): filtra por CveCiudad → misma fuente, sin FK
        // ────────────────────────────────────────────────────────────────────
        let query = supabase
          .from("TanqueMovimiento")
          .select("IdUnidad");

        if (tanqueSeleccionado) {
          query = query.eq("IdTanque", tanqueSeleccionado);
        } else {
          query = query.eq("CveCiudad", cveCiudad!);
        }

        const { data: movs, error: err1 } = await query;

        if (err1 || !movs || cancelled) {
          if (!cancelled) {
            setLoadError("Error al cargar unidades");
            setUnidades([]);
          }
          return;
        }

        // Deduplicar IDs y excluir nulls
        const ids = [...new Set(movs.map((m: any) => m.IdUnidad))]
          .filter((id): id is number => id !== null && id !== undefined);

        if (ids.length === 0) {
          if (!cancelled) setUnidades([]);
          return;
        }

        // Obtener detalle de unidades
        const { data: units, error: err2 } = await supabase
          .from("Unidades")
          .select("IDUnidad, IDClaveUnidad, ClaveAlterna")
          .in("IDUnidad", ids)
          .order("IDClaveUnidad", { ascending: true });

        if (!cancelled) {
          if (err2) {
            setLoadError("Error al cargar detalle de unidades");
            setUnidades([]);
          } else {
            setUnidades(units ?? []);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    cargar();
    return () => { cancelled = true; };
  }, [cveCiudad, tanqueSeleccionado]);

  const isDisabled = !optional && (!tieneCiudad || loading);

  const placeholder = !tieneCiudad && !optional
    ? "Seleccione una ciudad"
    : loading
      ? "Cargando..."
      : optional
        ? "(Todos)"
        : "Seleccione una unidad";

  return (
    <Form.Group className="mb-3">
      <Form.Label>Unidad</Form.Label>
      <Form.Select
        isInvalid={!!error || !!loadError}
        disabled={isDisabled}
        {...register(
          "IDUnidad",
          optional ? {} : { required: "La unidad es obligatoria" },
        )}
      >
        <option value="">{placeholder}</option>
        {unidades.map((unidad) => (
          <option key={unidad.IDUnidad} value={unidad.IDUnidad}>
            {unidad.IDClaveUnidad} ({unidad.ClaveAlterna})
          </option>
        ))}
      </Form.Select>
      {loading && <Spinner animation="border" size="sm" className="mt-1" />}
      <Form.Control.Feedback type="invalid">
        {loadError ?? (error?.message as string)}
      </Form.Control.Feedback>
    </Form.Group>
  );
}
