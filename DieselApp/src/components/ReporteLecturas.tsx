import { Container, Card, Form, Button, Row, Col, Alert, Table, Spinner } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useState } from "react";
import ComboCveCiudad from "./ComboCveCiudad";
import { API_ENDPOINTS, apiRequest } from "../config/api.config";

interface ReporteLecturasForm {
    CveCiudad: string;
    FechaInicial: string;
    FechaFinal: string;
}

interface LecturaDiaria {
    ciudad: string;
    nombre: string;
    fecha: string;
    lecturaInicialCms: number;
    lecturaFinalCms: number;
    cuentaLitrosInicial: number;
    cuentaLitrosFinal: number;
    diferenciaCuentaLitros: number;
}

export default function ReporteLecturas() {
    const [isLoading, setIsLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{
        type: "success" | "danger";
        text: string;
    } | null>(null);
    const [lecturas, setLecturas] = useState<LecturaDiaria[]>([]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ReporteLecturasForm>({
        mode: "onSubmit",
        reValidateMode: "onChange",
    });

    // Formatear fecha para mostrar en la tabla
    const formatearFecha = (fecha: string) => {
        const date = new Date(fecha);
        return date.toLocaleDateString("es-MX", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    };

    const onSubmit = async (data: ReporteLecturasForm) => {
        try {
            setIsLoading(true);
            setAlertMessage(null);

            // Preparar el payload
            const payload = {
                FechaInicial: data.FechaInicial,
                FechaFinal: data.FechaFinal,
                Ciudad: data.CveCiudad,
            };

            console.log("Consultando lecturas diarias:", payload);

            // Realizar la petición POST
            const result = await apiRequest<LecturaDiaria[]>(API_ENDPOINTS.lecturas.diarias, {
                method: "POST",
                body: JSON.stringify(payload),
            });

            if (Array.isArray(result)) {
                setLecturas(result);
                if (result.length === 0) {
                    setAlertMessage({
                        type: "success",
                        text: "No se encontraron lecturas para los filtros seleccionados",
                    });
                } else {
                    setAlertMessage({
                        type: "success",
                        text: `Se encontraron ${result.length} lecturas`,
                    });
                }
            } else {
                setAlertMessage({
                    type: "danger",
                    text: "Error al obtener las lecturas",
                });
            }
        } catch (error: unknown) {
            console.error("Error al consultar lecturas:", error);
            const errorMessage = error instanceof Error ? error.message : "Error de conexión con el servidor";
            setAlertMessage({
                type: "danger",
                text: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container fluid className="p-3">
            <h4 className="text-center mb-4">Reporte de Lecturas Diarias</h4>

            {/* Mensaje de alerta */}
            {alertMessage && (
                <Alert
                    variant={alertMessage.type}
                    dismissible
                    onClose={() => setAlertMessage(null)}
                    className="mb-3"
                >
                    {alertMessage.text}
                </Alert>
            )}

            <Form noValidate onSubmit={handleSubmit(onSubmit)}>
                <Card className="mb-3">
                    <Card.Body>
                        {/* Ciudad */}
                        <ComboCveCiudad register={register} error={errors.CveCiudad} />

                        {/* Fechas */}
                        <Row className="mb-3">
                            <Col xs={6}>
                                <Form.Group>
                                    <Form.Label>Fecha Inicial</Form.Label>
                                    <Form.Control
                                        type="date"
                                        isInvalid={!!errors.FechaInicial}
                                        {...register("FechaInicial", {
                                            required: "La fecha inicial es obligatoria",
                                        })}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.FechaInicial?.message as string}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col xs={6}>
                                <Form.Group>
                                    <Form.Label>Fecha Final</Form.Label>
                                    <Form.Control
                                        type="date"
                                        isInvalid={!!errors.FechaFinal}
                                        {...register("FechaFinal", {
                                            required: "La fecha final es obligatoria",
                                            validate: (value, formValues) => {
                                                if (formValues.FechaInicial && value < formValues.FechaInicial) {
                                                    return "La fecha final no puede ser menor a la fecha inicial";
                                                }
                                                return true;
                                            },
                                        })}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.FechaFinal?.message as string}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <div className="d-grid mb-3">
                    <Button
                        size="lg"
                        variant="primary"
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Consultando...
                            </>
                        ) : (
                            "Consultar"
                        )}
                    </Button>
                </div>
            </Form>

            {/* Tabla de resultados */}
            {lecturas.length > 0 && (
                <Card>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>Ciudad</th>
                                        <th>Tanque</th>
                                        <th>Fecha Lectura</th>
                                        <th>Lectura Inicial CMS</th>
                                        <th>Lectura Final CMS</th>
                                        <th>Cuenta Litros Inicial</th>
                                        <th>Cuenta Litros Final</th>
                                        <th>Litros Consumidos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lecturas.map((lectura, index) => (
                                        <tr key={index}>
                                            <td>{lectura.ciudad}</td>
                                            <td>{lectura.nombre}</td>
                                            <td>{formatearFecha(lectura.fecha)}</td>
                                            <td>{lectura.lecturaInicialCms}</td>
                                            <td>{lectura.lecturaFinalCms}</td>
                                            <td>{lectura.cuentaLitrosInicial.toLocaleString()}</td>
                                            <td>{lectura.cuentaLitrosFinal.toLocaleString()}</td>
                                            <td>{lectura.diferenciaCuentaLitros.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>
            )}
        </Container>
    );
}
