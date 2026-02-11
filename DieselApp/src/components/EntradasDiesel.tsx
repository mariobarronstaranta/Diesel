import { useState, useEffect } from "react";
import { Container, Card, Form, Button, Row, Col, Alert, Spinner } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { supabase } from "../supabase/client";
import ComboCveCiudad from "./ComboCveCiudad";
import ComboTanquePorCiudad from "./ComboTanquePorCiudad";
import ComboProveedores from "./ComboProveedores";

interface EntradasForm {
    CveCiudad: string;
    IDTanque: string; // value from select is usually string
    Fecha: string;
    Hora: string;
    Temperatura: string;
    LitrosCarga: string;
    Altura: string; // "Altura del Tanque"
    CuentaLitros: string; // "Cuenta Litros Actual"
    IdProveedor: string; // Fixed: Changed from IDProveedor to IdProveedor to match ComboProveedores
    Remision: string;
    Observaciones: string;
}

export default function EntradasDiesel() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'danger', text: string } | null>(null);

    const { register, handleSubmit, watch, formState: { errors }, setValue, reset } = useForm<EntradasForm>();

    const cveCiudad = watch("CveCiudad");

    // Helper to set default date/time
    const setDefaults = () => {
        const now = new Date();
        setValue("Fecha", now.toISOString().split('T')[0]);

        // Format Current Time HH:MM
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        setValue("Hora", `${hours}:${minutes}`);
    };

    // Default Date and Time on mount
    useEffect(() => {
        setDefaults();
    }, [setValue]);

    // Cleanup Tank when City changes
    useEffect(() => {
        setValue("IDTanque", "");
    }, [cveCiudad, setValue]);

    const handleClean = () => {
        reset({
            CveCiudad: "",
            IDTanque: "",
            IdProveedor: "",
            Remision: "",
            Observaciones: "",
            Temperatura: "",
            LitrosCarga: "",
            Altura: "",
            CuentaLitros: "",
        });
        setDefaults();
    };

    const onSubmit = async (data: EntradasForm) => {
        setLoading(true);
        setMessage(null);

        try {
            // Get current local date and time
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const localDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

            // Insert into TanqueMovimiento table
            const { error } = await supabase
                .from("TanqueMovimiento")
                .insert([
                    {
                        CveCiudad: data.CveCiudad,
                        IdTanque: Number(data.IDTanque),
                        FechaCarga: data.Fecha,
                        HoraCarga: data.Hora,
                        TemperaturaCarga: Number(data.Temperatura),
                        LitrosCarga: Number(data.LitrosCarga),
                        AlturaTanque: Number(data.Altura),
                        CuentaLitros: Number(data.CuentaLitros),
                        Remision: data.Remision,
                        IdProveedor: Number(data.IdProveedor),
                        Observaciones: data.Observaciones,
                        TipoMovimiento: "E",
                        FechaHoraMovimiento: localDateTime
                    }
                ]);

            if (error) {
                throw error;
            }

            setMessage({ type: 'success', text: 'Entrada registrada correctamente' });

            handleClean();

        } catch (err: any) {
            console.error("Error saving entry:", err);
            setMessage({ type: 'danger', text: `Error al guardar: ${err.message}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container fluid className="p-4">
            <h2 className="mb-4 text-center">Registro de Entradas de Diesel</h2>

            {message && (
                <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>
                    {message.text}
                </Alert>
            )}

            <Form onSubmit={handleSubmit(onSubmit)}>
                <Card className="mb-4">
                    <Card.Header className="bg-secondary text-white text-center fw-bold">DATOS DEL TANQUE</Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={6}>
                                <ComboCveCiudad register={register} error={errors.CveCiudad} />
                            </Col>
                            <Col md={6}>
                                <ComboTanquePorCiudad
                                    cveCiudad={cveCiudad}
                                    register={register}
                                    error={errors.IDTanque}
                                />
                            </Col>
                        </Row>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Fecha</Form.Label>
                                    <Form.Control
                                        type="date"
                                        {...register("Fecha", { required: "Fecha requerida" })}
                                        isInvalid={!!errors.Fecha}
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.Fecha?.message}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Hora</Form.Label>
                                    <Form.Control
                                        type="time"
                                        {...register("Hora", { required: "Hora requerida" })}
                                        isInvalid={!!errors.Hora}
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.Hora?.message}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Temperatura Actual</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="any"
                                        {...register("Temperatura", {
                                            required: "Temperatura requerida",
                                            valueAsNumber: false // We handle conversion on submit to support empty strings during editing if needed, but 'required' catches it.
                                        })}
                                        isInvalid={!!errors.Temperatura}
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.Temperatura?.message}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <Card className="mb-4">
                    <Card.Header className="bg-secondary text-white text-center fw-bold">DATOS DE CARGA</Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Litros Carga</Form.Label>
                                    <Form.Control
                                        type="number"
                                        {...register("LitrosCarga", { required: "Litros requeridos" })}
                                        isInvalid={!!errors.LitrosCarga}
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.LitrosCarga?.message}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Altura del Tanque (cms)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        {...register("Altura", { required: "Altura requerida" })}
                                        isInvalid={!!errors.Altura}
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.Altura?.message}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Cuenta Litros Actual</Form.Label>
                                    <Form.Control
                                        type="number"
                                        {...register("CuentaLitros", { required: "Cuenta litros requerido" })}
                                        isInvalid={!!errors.CuentaLitros}
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.CuentaLitros?.message}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <ComboProveedores register={register} error={errors.IdProveedor} />
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Remisión</Form.Label>
                                    <Form.Control
                                        type="text"
                                        {...register("Remision", { required: "Remisión requerida" })}
                                        isInvalid={!!errors.Remision}
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.Remision?.message}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Observaciones</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        {...register("Observaciones")}
                                    // No required validation
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <div className="d-flex gap-2 justify-content-end">
                    <Button
                        variant="info"
                        size="lg"
                        type="button"
                        onClick={() => {
                            handleClean();
                            setMessage(null);
                        }}
                        disabled={loading}
                    >
                        Limpiar Formulario
                    </Button>
                    <Button variant="warning" size="lg" type="submit" disabled={loading}>
                        {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : "Guardar"}
                    </Button>
                </div>
            </Form>
        </Container>
    );
}
