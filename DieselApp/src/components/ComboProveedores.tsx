import { useEffect, useState } from "react";
import { Form, Spinner } from "react-bootstrap";
import { supabase } from "../supabase/client";
import type { UseFormRegister } from "react-hook-form";

// Asumimos la estructura basada en la convención del proyecto: IDTabla + Nombre/Descripcion
type Proveedor = {
    IdProveedor: number;
    NombreProveedor: string;
};

interface ComboProveedoresProps {
    register: UseFormRegister<any>;
    error?: {
        message?: string;
    };
}

export default function ComboProveedores({ register, error }: ComboProveedoresProps) {
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const cargarProveedores = async () => {
            setLoading(true);

            // Intentamos obtener IDProveedor y Nombre. 
            // Si la tabla usa otros nombres, esto fallará y lo corregiremos en la verificación.
            const { data, error } = await supabase
                .from("Proveedores")
                .select("IdProveedor, NombreProveedor")
                .order("NombreProveedor", { ascending: true });

            if (error) {
                console.error("Error cargando proveedores:", error);
            } else if (data) {
                setProveedores(data);
            }

            setLoading(false);
        };

        cargarProveedores();
    }, []);

    return (
        <Form.Group className="mb-3">
            <Form.Label>Proveedor</Form.Label>
            <Form.Select
                {...register("IdProveedor", {
                    required: "Seleccione un proveedor",
                })}
                isInvalid={!!error}
                disabled={loading}
            >
                <option value="">
                    {loading ? "Cargando..." : "Seleccione"}
                </option>
                {proveedores.map((p) => (
                    <option key={p.IdProveedor} value={p.IdProveedor}>
                        {p.NombreProveedor}
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
