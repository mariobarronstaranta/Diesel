import { Container, Card, Form, Button, Row, Col, Alert, Table, Spinner } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useState } from "react";
import ComboCiudad from "./ComboCiudad";
import ComboTanquePorCiudad from "./ComboTanquePorCiudad";
import { supabase } from "../supabase/client";
import type { ReporteConsumosData, ReporteConsumosForm } from "../types/reportes.types";

export default function ReporteConsumos() {
    const [isLoading, setIsLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{
        type: "success" | "danger";
        text: string;
    } | null>(null);
    const [consumos, setConsumos] = useState<ReporteConsumosData[]>([]);
    const [cveCiudadSeleccionada, setCveCiudadSeleccionada] = useState<string>("");

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<ReporteConsumosForm>({
        mode: "onSubmit",
        reValidateMode: "onChange",
    });

    // Observar cambios en CveCiudad para actualizar el combo de tanques
    const cveCiudad = watch("CveCiudad");

    // Actualizar el estado cuando cambia la ciudad
    if (cveCiudad !== cveCiudadSeleccionada) {
        setCveCiudadSeleccionada(cveCiudad || "");
    }

    // Formatear fecha para mostrar en la tabla
    const formatearFecha = (fecha: string) => {
        const date = new Date(fecha);
        return date.toLocaleDateString("es-MX", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    };

    // Formatear números con separadores de miles
    const formatearNumero = (numero: number) => {
        return numero.toLocaleString("es-MX", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const onSubmit = async (data: ReporteConsumosForm) => {
        try {
            setIsLoading(true);
            setAlertMessage(null);

            console.log("Consultando consumos:", {
                p_fecha_inicio: data.FechaInicial,
                p_fecha_fin: data.FechaFinal,
                p_cve_ciudad: data.CveCiudad || null,
                p_id_tanque: data.IDTanque ? parseInt(data.IDTanque) : null,
            });

            // Llamar a la función RPC de Supabase
            const { data: result, error } = await supabase.rpc('get_reporte_consumos', {
                p_fecha_inicio: data.FechaInicial,
                p_fecha_fin: data.FechaFinal,
                p_cve_ciudad: data.CveCiudad || null,
                p_id_tanque: data.IDTanque ? parseInt(data.IDTanque) : null,
            });

            if (error) {
                throw error;
            }

            console.log("Resultado de Supabase RPC:", result);

            if (Array.isArray(result)) {
                setConsumos(result);
                if (result.length === 0) {
                    setAlertMessage({
                        type: "success",
                        text: "No se encontraron consumos para los filtros seleccionados",
                    });
                } else {
                    setAlertMessage({
                        type: "success",
                        text: `Se encontraron ${result.length} registros`,
                    });
                }
            } else {
                setAlertMessage({
                    type: "danger",
                    text: "Error al obtener los consumos",
                });
            }
        } catch (error: unknown) {
            console.error("Error al consultar consumos:", error);
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
        if (consumos.length === 0) return;

        // Calcular totales
        const totalEntradas = consumos.reduce((sum, c) => sum + Number(c.totalEntradas), 0);
        const totalSalidas = consumos.reduce((sum, c) => sum + Number(c.totalSalidas), 0);

        // Definir encabezados
        const headers = [
            "Fecha",
            "Ciudad",
            "Tanque",
            "Total Entradas",
            "Total Salidas"
        ];

        // Convertir datos a formato CSV
        const csvContent = [
            headers.join(","), // Encabezado
            ...consumos.map(c => [
                `"${formatearFecha(c.fecha)}"`,
                `"${c.ciudad}"`,
                `"${c.tanque}"`,
                Number(c.totalEntradas).toFixed(2),
                Number(c.totalSalidas).toFixed(2)
            ].join(",")),
            // Agregar fila de totales
            [
                `"TOTALES"`,
                `""`,
                `""`,
                totalEntradas.toFixed(2),
                totalSalidas.toFixed(2)
            ].join(",")
        ].join("\n");

        // Crear Blob y descargar
        const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `consumos_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Calcular totales para mostrar en la tabla
    const totalEntradas = consumos.reduce((sum, c) => sum + Number(c.totalEntradas), 0);
    const totalSalidas = consumos.reduce((sum, c) => sum + Number(c.totalSalidas), 0);

    return (
        <Container fluid className="p-3">
            <h4 className="text-center mb-4">Reporte de Consumos</h4>

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
                            <Col lg={3} md={6} className="mb-3 mb-lg-0">
                                <ComboCiudad register={register} error={errors.CveCiudad} />
                            </Col>

                            <Col lg={3} md={6} className="mb-3 mb-lg-0">
                                <ComboTanquePorCiudad
                                    cveCiudad={cveCiudadSeleccionada}
                                    register={register}
                                    error={errors.IDTanque}
                                />
                            </Col>

                            <Col lg={2} md={6} className="mb-3 mb-lg-0">
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

                            <Col lg={2} md={6} className="mb-3 mb-lg-0">
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
                                    variant="warning"
                                    size="lg"
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-100 fw-bold"
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
            {consumos.length > 0 && (
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
                                <thead style={{ background: '#6c757d', color: '#fff', borderColor: '#5a6268' }}>
                                    <tr>
                                        <th className="text-center" style={{ backgroundColor: '#6c757d', color: '#fff' }}>Fecha</th>
                                        <th className="text-center" style={{ backgroundColor: '#6c757d', color: '#fff' }}>Ciudad</th>
                                        <th className="text-center" style={{ backgroundColor: '#6c757d', color: '#fff' }}>Tanque</th>
                                        <th className="text-center" style={{ backgroundColor: '#6c757d', color: '#fff' }}>Total Entradas</th>
                                        <th className="text-center" style={{ backgroundColor: '#6c757d', color: '#fff' }}>Total Salidas</th>
                                        <th className="text-center" style={{ backgroundColor: '#6c757d', color: '#fff' }}>Detalle</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {consumos.map((consumo, index) => (
                                        <tr key={index}>
                                            <td className="text-center">{formatearFecha(consumo.fecha)}</td>
                                            <td>{consumo.ciudad}</td>
                                            <td>{consumo.tanque}</td>
                                            <td className="text-end">{formatearNumero(Number(consumo.totalEntradas))}</td>
                                            <td className="text-end">{formatearNumero(Number(consumo.totalSalidas))}</td>
                                            <td className="text-center">
                                                <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                                                    (Fase 2)
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Fila de totales */}
                                    <tr style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}>
                                        <td colSpan={3} className="text-end">TOTALES:</td>
                                        <td className="text-end">{formatearNumero(totalEntradas)}</td>
                                        <td className="text-end">{formatearNumero(totalSalidas)}</td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>
            )}
        </Container>
    );
}
