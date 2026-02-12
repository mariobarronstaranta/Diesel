import { Container, Card, Form, Button, Row, Col, Alert, Spinner } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import ComboCveCiudad from "./ComboCveCiudad";
import ComboTanquePorCiudad from "./ComboTanquePorCiudad";
import ComboUnidades from "./ComboUnidades";
import ComboOperadores from "./ComboOperadores";
import { supabase } from "../supabase/client";

interface SalidasForm {
    CveCiudad: string;
    IDTanque: string;
    Fecha: string;
    Hora: string;
    Temperatura: string;
    IDUnidad: string;
    IdOperador: string;
    Horimetro: string;
    Odometro: string;
    LitrosCarga: string;
    CuentaLitros: string;
    FolioVale: string;
    Observaciones: string;
}

export default function SalidasDiesel() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
    const [cveCiudad, setCveCiudad] = useState<string>("");

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        reset,
        setValue,
    } = useForm<SalidasForm>({
        mode: "onSubmit",
        reValidateMode: "onChange",
    });

    const watchCveCiudad = watch("CveCiudad");

    useEffect(() => {
        setCveCiudad(watchCveCiudad || "");
        if (watchCveCiudad) {
            setValue("IDTanque", "");
            setValue("IDUnidad", "");
        }
    }, [watchCveCiudad, setValue]);

    const setDefaults = () => {
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];
        const currentTime = `${String(today.getHours()).padStart(2, "0")}:${String(today.getMinutes()).padStart(2, "0")}`;

        setValue("Fecha", todayStr);
        setValue("Hora", currentTime);
    };

    useEffect(() => {
        setDefaults();
    }, []);

    const handleClean = () => {
        reset({
            CveCiudad: "",
            IDTanque: "",
            Fecha: "",
            Hora: "",
            Temperatura: "",
            IDUnidad: "",
            IdOperador: "",
            Horimetro: "",
            Odometro: "",
            LitrosCarga: "",
            CuentaLitros: "",
            FolioVale: "",
            Observaciones: "",
        });
        setDefaults();
    };

    const onSubmit = async (data: SalidasForm) => {
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
                        AlturaTanque: 0, // Not captured in this form
                        CuentaLitros: Number(data.CuentaLitros),
                        Remision: data.FolioVale,
                        IdProveedor: null, // Not applicable for salidas
                        Observaciones: data.Observaciones,
                        TipoMovimiento: "S",
                        FechaHoraMovimiento: localDateTime,
                        IDUnidad: Number(data.IDUnidad),
                        IdOperador: Number(data.IdOperador),
                        Horimetro: Number(data.Horimetro),
                        Odometro: Number(data.Odometro),
                    }
                ]);

            if (error) {
                throw error;
            }

            setMessage({ type: 'success', text: 'Salida registrada correctamente' });

            handleClean();

        } catch (err: any) {
            console.error("Error saving salida:", err);
            setMessage({ type: 'danger', text: `Error al guardar: ${err.message}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container fluid className="p-4">
            <h2 className="mb-4 text-center">Registro de Salidas de Diesel</h2>

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
                                    register={register}
                                    error={errors.IDTanque}
                                    cveCiudad={cveCiudad}
                                />
                            </Col>
                        </Row>
                        <Row className="mt-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Fecha</Form.Label>
                                    <Form.Control
                                        type="date"
                                        isInvalid={!!errors.Fecha}
                                        {...register("Fecha", {
                                            required: "La fecha es obligatoria",
                                        })}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.Fecha?.message as string}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Hora</Form.Label>
                                    <Form.Control
                                        type="time"
                                        isInvalid={!!errors.Hora}
                                        {...register("Hora", {
                                            required: "La hora es obligatoria",
                                        })}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.Hora?.message as string}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Temperatura Actual</Form.Label>
                                    <Form.Control
                                        type="number"
                                        isInvalid={!!errors.Temperatura}
                                        {...register("Temperatura", {
                                            required: "La temperatura es obligatoria",
                                        })}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.Temperatura?.message as string}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <Card className="mb-4">
                    <Card.Header className="bg-secondary text-white text-center fw-bold">DATOS DE UNIDAD</Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={6}>
                                <ComboUnidades
                                    register={register}
                                    error={errors.IDUnidad}
                                    cveCiudad={cveCiudad}
                                />
                            </Col>
                            <Col md={6}>
                                <ComboOperadores
                                    register={register}
                                    error={errors.IdOperador}
                                    cveCiudad={cveCiudad}
                                />
                            </Col>
                        </Row>
                        <Row className="mt-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Horímetro</Form.Label>
                                    <Form.Control
                                        type="number"
                                        isInvalid={!!errors.Horimetro}
                                        {...register("Horimetro", {
                                            required: "El horímetro es obligatorio",
                                        })}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.Horimetro?.message as string}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Odómetro</Form.Label>
                                    <Form.Control
                                        type="number"
                                        isInvalid={!!errors.Odometro}
                                        {...register("Odometro", {
                                            required: "El odómetro es obligatorio",
                                        })}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.Odometro?.message as string}
                                    </Form.Control.Feedback>
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
                                <Form.Group>
                                    <Form.Label>Litros Carga</Form.Label>
                                    <Form.Control
                                        type="number"
                                        isInvalid={!!errors.LitrosCarga}
                                        {...register("LitrosCarga", {
                                            required: "Los litros de carga son obligatorios",
                                        })}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.LitrosCarga?.message as string}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Cuenta Litros</Form.Label>
                                    <Form.Control
                                        type="number"
                                        isInvalid={!!errors.CuentaLitros}
                                        {...register("CuentaLitros", {
                                            required: "La cuenta litros es obligatoria",
                                        })}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.CuentaLitros?.message as string}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Folio Vale</Form.Label>
                                    <Form.Control
                                        type="text"
                                        isInvalid={!!errors.FolioVale}
                                        {...register("FolioVale", {
                                            required: "El folio vale es obligatorio",
                                        })}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.FolioVale?.message as string}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row className="mt-3">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Observaciones</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        {...register("Observaciones")}
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
