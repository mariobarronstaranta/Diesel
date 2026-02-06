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

    const exportarCSV = () => {
        if (lecturas.length === 0) return;

        // Definir encabezados
        const headers = [
            "Ciudad",
            "Tanque",
            "Fecha Lectura",
            "Lectura Inicial CMS",
            "Lectura Final CMS",
            "Cuenta Lts Inicial",
            "Cuenta Lts Final",
            "Lts Consumidos"
        ];

        // Convertir datos a formato CSV
        const csvContent = [
            headers.join(","), // Encabezado
            ...lecturas.map(l => [
                `"${l.ciudad}"`,
                `"${l.nombre}"`,
                `"${formatearFecha(l.fecha)}"`,
                l.lecturaInicialCms,
                l.lecturaFinalCms,
                l.cuentaLitrosInicial,
                l.cuentaLitrosFinal,
                l.diferenciaCuentaLitros
            ].join(","))
        ].join("\n");

        // Crear Blob y descargar
        const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Lecturas_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                        <Row className="align-items-start">
                            <Col lg={4} md={12} className="mb-3 mb-lg-0">
                                <ComboCveCiudad register={register} error={errors.CveCiudad} />
                            </Col>

                            <Col lg={3} md={6} className="mb-3 mb-lg-0">
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

                            <Col lg={3} md={6} className="mb-3 mb-lg-0">
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

                            <Col lg={2} md={12} className="d-flex align-items-center mt-lg-4">
                                <Button
                                    variant="primary"
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-100"
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
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            </Form>

            {/* Tabla de resultados */}
            {lecturas.length > 0 && (
                <Card>
                    <Card.Header className="d-flex justify-content-between align-items-center bg-white">
                        <h5 className="mb-0">Resultados</h5>
                        <Button variant="success" size="sm" onClick={exportarCSV}>
                            Exportar CSV
                        </Button>
                    </Card.Header>
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
                                        <th>Cuenta Lts Inicial</th>
                                        <th>Cuenta Lts Final</th>
                                        <th>Lts Consumidos</th>
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
