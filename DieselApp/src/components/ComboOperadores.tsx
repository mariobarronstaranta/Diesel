import { Form } from "react-bootstrap";
import type { UseFormRegister, FieldError } from "react-hook-form";
import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";

interface ComboOperadoresProps {
    register: UseFormRegister<any>;
    error?: FieldError;
    cveCiudad?: string;
}

interface Operador {
    IDPersonal: number;
    Nombre: string;
    APaterno: string;
    AMaterno: string;
}

export default function ComboOperadores({ register, error, cveCiudad }: ComboOperadoresProps) {
    const [operadores, setOperadores] = useState<Operador[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchOperadores = async () => {
            if (!cveCiudad) {
                setOperadores([]);
                return;
            }

            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("Operadores")
                    .select("IDPersonal, Nombre, APaterno, AMaterno")
                    .eq("TipoPersonal", "OP")
                    .eq("CveCiudad", cveCiudad)
                    .order("Nombre", { ascending: true });

                if (error) throw error;
                setOperadores(data || []);
            } catch (err) {
                setOperadores([]);
            } finally {
                setLoading(false);
            }
        };

        fetchOperadores();
    }, [cveCiudad]);

    return (
        <Form.Group>
            <Form.Label>Operador</Form.Label>
            <Form.Select
                isInvalid={!!error}
                disabled={!cveCiudad || loading}
                {...register("IdOperador", {
                    required: "El operador es obligatorio",
                })}
            >
                <option value="">
                    {loading ? "Cargando..." : cveCiudad ? "Seleccione un operador" : "Primero seleccione una ciudad"}
                </option>
                {operadores.map((operador) => (
                    <option key={operador.IDPersonal} value={operador.IDPersonal}>
                        {operador.Nombre} {operador.APaterno} {operador.AMaterno}
                    </option>
                ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">
                {error?.message as string}
            </Form.Control.Feedback>
        </Form.Group>
    );
}
