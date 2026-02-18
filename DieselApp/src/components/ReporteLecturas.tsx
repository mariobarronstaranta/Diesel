import { Container, Card, Form, Button, Row, Col, Alert, Table, Spinner, Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useState } from "react";
import ComboCveCiudad from "./ComboCveCiudad";
import { supabase } from "../supabase/client";

interface ReporteLecturasForm {
    CveCiudad: string;
    FechaInicial: string;
    FechaFinal: string;
}

interface LecturaDiaria {
    ciudad: string;
    nombre: string;
    fecha: string;
    lectura_inicial_cms: number;
    lectura_final_cms: number;
    cuenta_litros_inicial: number;
    cuenta_litros_final: number;
    diferencia_cuenta_litros: number;
}

interface DetalleLectura {
    IDTanqueLecturas: number;
    Tanque: string;
    Fecha: string;
    Hora: string;
    LecturaCms: number;
    Temperatura: number;
    CuentaLitros: number;
}

export default function ReporteLecturas() {
    const [isLoading, setIsLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{
        type: "success" | "danger";
        text: string;
    } | null>(null);
    const [lecturas, setLecturas] = useState<LecturaDiaria[]>([]);

    // Estados para el detalle
    const [showModal, setShowModal] = useState(false);
    const [detalleLecturas, setDetalleLecturas] = useState<DetalleLectura[]>([]);
    const [isModalLoading, setIsModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [infoFilaSeleccionada, setInfoFilaSeleccionada] = useState<{ fecha: string; tanque: string } | null>(null);

    // Estados para edición
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({
        Hora: "",
        LecturaCms: 0,
        Temperatura: 0,
        CuentaLitros: 0
    });
    const [lastQueryParams, setLastQueryParams] = useState<ReporteLecturasForm | null>(null);

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
            setLastQueryParams(data);

            console.log("Consultando lecturas diarias:", {
                p_ciudad: data.CveCiudad,
                p_fecha_inicial: data.FechaInicial,
                p_fecha_final: data.FechaFinal,
            });

            // Llamar a la función RPC de Supabase
            const { data: result, error } = await supabase.rpc('sp_obtener_lecturas_diarias', {
                p_ciudad: data.CveCiudad,
                p_fecha_inicial: data.FechaInicial,
                p_fecha_final: data.FechaFinal,
            });

            if (error) {
                throw error;
            }

            console.log("Resultado de Supabase RPC:", result);

            if (Array.isArray(result)) {
                // Sort by fecha (date) first, then by nombre (tank name)
                const sortedResult = result.sort((a, b) => {
                    // First sort by fecha
                    const dateCompare = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
                    if (dateCompare !== 0) return dateCompare;

                    // If dates are equal, sort by nombre
                    return a.nombre.localeCompare(b.nombre);
                });

                setLecturas(sortedResult);
                if (sortedResult.length === 0) {
                    setAlertMessage({
                        type: "success",
                        text: "No se encontraron lecturas para los filtros seleccionados",
                    });
                } else {
                    setAlertMessage({
                        type: "success",
                        text: `Se encontraron ${sortedResult.length} lecturas`,
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

    const handleVerDetalle = async (fecha: string, tanque: string) => {
        try {
            setIsModalLoading(true);
            setModalError(null);
            setInfoFilaSeleccionada({ fecha, tanque });
            setShowModal(true);
            setDetalleLecturas([]);

            console.log("Consultando detalle de lecturas:", { fecha, tanque });

            const { data: result, error } = await supabase.rpc('fn_obtener_lecturas_por_fecha', {
                p_fecha: fecha,
                p_tanque: tanque
            });

            if (error) throw error;

            console.log("Resultado detalle Supabase:", result);
            setDetalleLecturas(result || []);

        } catch (error: unknown) {
            console.error("Error al obtener detalle:", error);
            setModalError(error instanceof Error ? error.message : "Error al obtener el detalle");
        } finally {
            setIsModalLoading(false);
        }
    };

    const handleDelete = async (id: number, tanque: string) => {
        const confirmar = window.confirm(`¿Desea Borrar el registro del Movimiento ${id} del Tanque ${tanque}?`);
        if (!confirmar) return;

        try {
            setIsModalLoading(true);
            const { error } = await supabase
                .from('TanqueLecturas')
                .update({ Activo: 0 })
                .eq('IDTanqueLecturas', id);

            if (error) throw error;

            alert("Registro borrado exitosamente");
            setShowModal(false);
            // Recargar consulta principal
            if (lastQueryParams) onSubmit(lastQueryParams);

        } catch (error: unknown) {
            console.error("Error al borrar:", error);
            alert("Error al borrar el registro: " + (error instanceof Error ? error.message : "Error desconocido"));
        } finally {
            setIsModalLoading(false);
        }
    };

    const handleEditStart = (item: DetalleLectura) => {
        setEditingId(item.IDTanqueLecturas);
        setEditForm({
            Hora: item.Hora,
            LecturaCms: item.LecturaCms,
            Temperatura: item.Temperatura,
            CuentaLitros: item.CuentaLitros
        });
    };

    const handleUpdate = async (id: number, tanque: string) => {
        // Validaciones
        if (!editForm.Hora || editForm.LecturaCms === null || editForm.Temperatura === null || editForm.CuentaLitros === null) {
            alert("Todos los campos son obligatorios y no pueden ir en blanco");
            return;
        }

        const confirmar = window.confirm(`¿Desea actualizar el registro del Movimiento ${id} del Tanque ${tanque}?`);
        if (!confirmar) return;

        try {
            setIsModalLoading(true);
            const { error } = await supabase
                .from('TanqueLecturas')
                .update({
                    Hora: editForm.Hora,
                    LecturaCms: editForm.LecturaCms,
                    Temperatura: editForm.Temperatura,
                    CuentaLitros: editForm.CuentaLitros
                })
                .eq('IDTanqueLecturas', id);

            if (error) throw error;

            alert("Registro actualizado exitosamente");
            setEditingId(null);
            setShowModal(false);
            // Recargar consulta principal
            if (lastQueryParams) onSubmit(lastQueryParams);

        } catch (error: unknown) {
            console.error("Error al actualizar:", error);
            alert("Error al actualizar el registro: " + (error instanceof Error ? error.message : "Error desconocido"));
        } finally {
            setIsModalLoading(false);
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
                l.lectura_inicial_cms,
                l.lectura_final_cms,
                l.cuenta_litros_inicial,
                l.cuenta_litros_final,
                l.diferencia_cuenta_litros
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
                            <Table striped bordered hover className="table-corporate">
                                <thead>
                                    <tr>
                                        <th rowSpan={2}>Ciudad</th>
                                        <th rowSpan={2}>Tanque</th>
                                        <th rowSpan={2}>Fecha Lectura</th>
                                        <th colSpan={2}>Altura (cms)</th>
                                        <th colSpan={2}>Cuenta Litros</th>
                                        <th rowSpan={2}>Lts Consumidos</th>
                                        <th rowSpan={2}>Acción</th>
                                    </tr>
                                    <tr>
                                        <th>Inicial</th>
                                        <th>Final</th>
                                        <th>Inicial</th>
                                        <th>Final</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lecturas.map((lectura, index) => (
                                        <tr key={index}>
                                            <td>{lectura.ciudad ?? ''}</td>
                                            <td>{lectura.nombre ?? ''}</td>
                                            <td>{lectura.fecha ? formatearFecha(lectura.fecha) : ''}</td>
                                            <td>{lectura.lectura_inicial_cms ?? 0}</td>
                                            <td>{lectura.lectura_final_cms ?? 0}</td>
                                            <td>{(lectura.cuenta_litros_inicial ?? 0).toLocaleString()}</td>
                                            <td>{(lectura.cuenta_litros_final ?? 0).toLocaleString()}</td>
                                            <td>{(lectura.diferencia_cuenta_litros ?? 0).toLocaleString()}</td>
                                            <td className="text-center">
                                                <Button
                                                    variant="outline-corporate"
                                                    size="sm"
                                                    onClick={() => handleVerDetalle(lectura.fecha, lectura.nombre)}
                                                >
                                                    Detalle
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>
            )}
            {/* Modal de Detalle */}
            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                centered
                backdropClassName="modal-backdrop-blur"
                dialogClassName="modal-custom-width"
            >
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title>
                        Detalle de Movimientos - {infoFilaSeleccionada?.tanque} ({infoFilaSeleccionada ? formatearFecha(infoFilaSeleccionada.fecha) : ''})
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0">
                    {isModalLoading ? (
                        <div className="text-center p-5">
                            <Spinner animation="border" variant="warning" />
                            <p className="mt-2 text-muted">Cargando detalles...</p>
                        </div>
                    ) : modalError ? (
                        <Alert variant="danger" className="m-3">{modalError}</Alert>
                    ) : (
                        <div className="table-responsive">
                            <Table striped bordered hover className="mb-0 table-corporate">
                                <thead>
                                    <tr>
                                        <th className="text-center">Movimiento</th>
                                        <th className="text-center">Tanque</th>
                                        <th className="text-center">Fecha</th>
                                        <th className="text-center" style={{ minWidth: '120px' }}>Hora</th>
                                        <th className="text-center">Lectura CMS</th>
                                        <th className="text-center">Temperatura</th>
                                        <th className="text-center">CuentaLitros</th>
                                        <th className="text-center">Editar</th>
                                        <th className="text-center">Eliminar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detalleLecturas.length > 0 ? (
                                        detalleLecturas.map((d, i) => (
                                            <tr key={i}>
                                                <td className="text-center">{d.IDTanqueLecturas}</td>
                                                <td>{d.Tanque}</td>
                                                <td className="text-center">{formatearFecha(d.Fecha)}</td>
                                                <td className="text-center">
                                                    {editingId === d.IDTanqueLecturas ? (
                                                        <Form.Control
                                                            type="time"
                                                            size="sm"
                                                            value={editForm.Hora}
                                                            onChange={(e) => setEditForm({ ...editForm, Hora: e.target.value })}
                                                        />
                                                    ) : d.Hora}
                                                </td>
                                                <td className="text-end">
                                                    {editingId === d.IDTanqueLecturas ? (
                                                        <Form.Control
                                                            type="number"
                                                            size="sm"
                                                            value={editForm.LecturaCms}
                                                            onChange={(e) => setEditForm({ ...editForm, LecturaCms: parseInt(e.target.value) || 0 })}
                                                        />
                                                    ) : d.LecturaCms}
                                                </td>
                                                <td className="text-end">
                                                    {editingId === d.IDTanqueLecturas ? (
                                                        <Form.Control
                                                            type="number"
                                                            size="sm"
                                                            value={editForm.Temperatura}
                                                            onChange={(e) => setEditForm({ ...editForm, Temperatura: parseInt(e.target.value) || 0 })}
                                                        />
                                                    ) : d.Temperatura}
                                                </td>
                                                <td className="text-end">
                                                    {editingId === d.IDTanqueLecturas ? (
                                                        <Form.Control
                                                            type="number"
                                                            size="sm"
                                                            value={editForm.CuentaLitros}
                                                            onChange={(e) => setEditForm({ ...editForm, CuentaLitros: parseInt(e.target.value) || 0 })}
                                                        />
                                                    ) : d.CuentaLitros.toLocaleString()}
                                                </td>
                                                <td className="text-center">
                                                    {editingId === d.IDTanqueLecturas ? (
                                                        <div className="d-flex gap-1 justify-content-center">
                                                            <Button variant="success" size="sm" onClick={() => handleUpdate(d.IDTanqueLecturas, d.Tanque)}>
                                                                Ok
                                                            </Button>
                                                            <Button variant="secondary" size="sm" onClick={() => setEditingId(null)}>
                                                                X
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            variant="outline-corporate"
                                                            size="sm"
                                                            onClick={() => handleEditStart(d)}
                                                        >
                                                            Editar
                                                        </Button>
                                                    )}
                                                </td>
                                                <td className="text-center">
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleDelete(d.IDTanqueLecturas, d.Tanque)}
                                                        disabled={editingId === d.IDTanqueLecturas}
                                                    >
                                                        Eliminar
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={9} className="text-center p-3 text-muted">
                                                No hay movimientos registrados para este tanque en la fecha seleccionada.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="bg-light">
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Estilos para el blur del modal */}
            <style>
                {`
                .modal-backdrop-blur {
                    backdrop-filter: blur(5px);
                    background-color: rgba(0, 0, 0, 0.5) !important;
                }
                .modal-custom-width {
                    width: 1050px !important;
                    max-width: 95% !important;
                    margin: 16px auto !important;
                }
                @media (min-width: 576px) {
                    .modal-custom-width {
                        max-width: calc(100% - 32px) !important;
                    }
                }
                `}
            </style>
        </Container>
    );
}
