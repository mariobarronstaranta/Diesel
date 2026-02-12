import { Form } from "react-bootstrap";
import type { UseFormRegister, FieldError } from "react-hook-form";
import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";

interface ComboUnidadesProps {
    register: UseFormRegister<any>;
    error?: FieldError;
    cveCiudad?: string;
}

interface Unidad {
    IDUnidad: number;
    IDClaveUnidad: string;
    ClaveAlterna: string;
}

export default function ComboUnidades({ register, error, cveCiudad }: ComboUnidadesProps) {
    const [unidades, setUnidades] = useState<Unidad[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUnidades = async () => {
            if (!cveCiudad) {
                setUnidades([]);
                return;
            }

            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("Unidades")
                    .select("IDUnidad, IDClaveUnidad, ClaveAlterna")
                    .eq("CveCiudad", cveCiudad)
                    .eq("Activo", "1")
                    .order("IDClaveUnidad", { ascending: true });

                if (error) throw error;
                setUnidades(data || []);
            } catch (err) {
                console.error("Error fetching unidades:", err);
                setUnidades([]);
            } finally {
                setLoading(false);
            }
        };

        fetchUnidades();
    }, [cveCiudad]);

    return (
        <Form.Group>
            <Form.Label>Unidad</Form.Label>
            <Form.Select
                isInvalid={!!error}
                disabled={!cveCiudad || loading}
                {...register("IDUnidad", {
                    required: "La unidad es obligatoria",
                })}
            >
                <option value="">
                    {loading ? "Cargando..." : cveCiudad ? "Seleccione una unidad" : "Primero seleccione una ciudad"}
                </option>
                {unidades.map((unidad) => (
                    <option key={unidad.IDUnidad} value={unidad.IDUnidad}>
                        {unidad.IDClaveUnidad}({unidad.ClaveAlterna})
                    </option>
                ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">
                {error?.message as string}
            </Form.Control.Feedback>
        </Form.Group>
    );
}
