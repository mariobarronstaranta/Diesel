import { useEffect, useState } from "react";
import { Form, Spinner } from "react-bootstrap";
import { supabase } from "../supabase/client";
import type { UseFormRegister } from "react-hook-form";

type Tanque = {
    IDTanque: number;
    Nombre: string;
};

interface ComboTanquePorCiudadProps {
    cveCiudad: string | null;
    register: UseFormRegister<any>;
    error?: {
        message?: string;
    };
}

export default function ComboTanquePorCiudad({ cveCiudad, register, error }: ComboTanquePorCiudadProps) {
    const [tanques, setTanques] = useState<Tanque[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!cveCiudad) {
            setTanques([]);
            return;
        }

        const cargarTanques = async () => {
            setLoading(true);
            setTanques([]);

            // Filtramos por CveCiudad en lugar de IDPlanta
            const { data, error } = await supabase
                .from("Tanque")
                .select("IDTanque, Nombre")
                .eq("CveCiudad", cveCiudad)
                .order("Nombre", { ascending: true });

            if (error) {
                console.error("Error cargando tanques por ciudad:", error);
            } else if (data) {
                setTanques(data);
            }

            setLoading(false);
        };

        cargarTanques();
    }, [cveCiudad]);

    return (
        <Form.Group className="mb-3">
            <Form.Label>Tanque</Form.Label>
            <Form.Select
                {...register("IDTanque", {
                    required: "Seleccione un tanque",
                })}
                isInvalid={!!error}
                disabled={!cveCiudad || loading}
            >
                <option value="">
                    {!cveCiudad
                        ? "Seleccione una ciudad"
                        : loading
                            ? "Cargando..."
                            : "Seleccione"}
                </option>
                {tanques.map((t) => (
                    <option key={t.IDTanque} value={t.IDTanque}>
                        {t.Nombre}
                    </option>
                ))}
            </Form.Select>
            {loading && <Spinner animation="border" size="sm" className="mt-1" />}
            <Form.Control.Feedback type="invalid">
                {error?.message}
            </Form.Control.Feedback>
        </Form.Group>
    );
}
