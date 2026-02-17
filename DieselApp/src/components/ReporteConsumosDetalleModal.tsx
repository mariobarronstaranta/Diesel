import { Modal, Button, Table, Tabs, Tab } from "react-bootstrap";

interface ReporteConsumosDetalleModalProps {
    show: boolean;
    onHide: () => void;
    datosFila: {
        fecha: string;
        ciudad: string;
        tanque: string;
    } | null;
}

export default function ReporteConsumosDetalleModal({ show, onHide, datosFila }: ReporteConsumosDetalleModalProps) {
    if (!datosFila) return null;

    // Datos Mock para Entradas
    const mockEntradas = [
        { fecha: datosFila.fecha, litros: 5000, planta: "Planta Norte", tanque: datosFila.tanque, cuentaLitros: 125430 },
        { fecha: datosFila.fecha, litros: 2500, planta: "Planta Norte", tanque: datosFila.tanque, cuentaLitros: 127930 },
    ];

    // Datos Mock para Salidas
    const mockSalidas = [
        { fecha: datosFila.fecha, hora: "08:30", temperatura: 24, litros: 150, tanque: datosFila.tanque, unidad: "UN-01", cuentaLitros: 128080 },
        { fecha: datosFila.fecha, hora: "10:15", temperatura: 26, litros: 200, tanque: datosFila.tanque, unidad: "UN-45", cuentaLitros: 128280 },
        { fecha: datosFila.fecha, hora: "14:45", temperatura: 28, litros: 180, tanque: datosFila.tanque, unidad: "UN-22", cuentaLitros: 128460 },
    ];

    const exportarSalidasCSV = () => {
        const headers = ["Fecha", "Hora", "Temperatura", "Litros", "Tanque", "Unidad", "CuentaLitros"];
        const csvContent = [
            headers.join(","),
            ...mockSalidas.map(s => [
                s.fecha,
                s.hora,
                s.temperatura,
                s.litros,
                s.tanque,
                s.unidad,
                s.cuentaLitros
            ].join(","))
        ].join("\n");

        const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `detalle_salidas_${datosFila.tanque}_${datosFila.fecha}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Modal
            show={show}
            onHide={onHide}
            size="xl"
            centered
            backdropClassName="modal-backdrop-blur"
        >
            <Modal.Header closeButton className="bg-light">
                <Modal.Title>
                    Detalle de Movimientos: {datosFila.tanque} ({datosFila.fecha})
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0 position-relative">
                <Tabs defaultActiveKey="salidas" id="detalle-movimientos-tabs" className="p-3">
                    <Tab eventKey="salidas" title="Salidas">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="mb-0 text-dark text-center w-100 fw-bold">Movimiento de Salidas de Combustible</h6>
                            <Button variant="success" size="sm" onClick={exportarSalidasCSV} className="position-absolute end-0 me-3">
                                <i className="bi bi-download me-1"></i> Exportar CSV
                            </Button>
                        </div>
                        <div className="table-responsive">
                            <Table striped bordered hover size="sm" className="mb-0">
                                <thead style={{ background: '#6c757d', color: '#fff' }}>
                                    <tr>
                                        <th className="text-center" style={{ backgroundColor: '#6c757d', color: '#fff' }}>Fecha</th>
                                        <th className="text-center" style={{ backgroundColor: '#6c757d', color: '#fff' }}>Hora</th>
                                        <th className="text-center" style={{ backgroundColor: '#6c757d', color: '#fff' }}>Temp (°C)</th>
                                        <th className="text-center" style={{ backgroundColor: '#6c757d', color: '#fff' }}>Litros</th>
                                        <th className="text-center" style={{ backgroundColor: '#6c757d', color: '#fff' }}>Tanque</th>
                                        <th className="text-center" style={{ backgroundColor: '#6c757d', color: '#fff' }}>Unidad</th>
                                        <th className="text-center" style={{ backgroundColor: '#6c757d', color: '#fff' }}>CuentaLitros</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mockSalidas.map((s, i) => (
                                        <tr key={i}>
                                            <td className="text-center">{s.fecha}</td>
                                            <td className="text-center">{s.hora}</td>
                                            <td className="text-center">{s.temperatura}</td>
                                            <td className="text-end font-monospace">{s.litros.toLocaleString()}</td>
                                            <td>{s.tanque}</td>
                                            <td>{s.unidad}</td>
                                            <td className="text-end font-monospace">{s.cuentaLitros.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </Tab>
                    <Tab eventKey="entradas" title="Entradas">
                        <h6 className="mb-3 text-dark text-center fw-bold">Movimiento de Entras de Combustibles a Tanques</h6>
                        <div className="table-responsive">
                            <Table striped bordered hover size="sm" className="mb-0">
                                <thead style={{ background: '#6c757d', color: '#fff' }}>
                                    <tr>
                                        <th className="text-center" style={{ backgroundColor: '#6c757d', color: '#fff' }}>Fecha</th>
                                        <th className="text-center" style={{ backgroundColor: '#6c757d', color: '#fff' }}>Litros</th>
                                        <th className="text-center" style={{ backgroundColor: '#6c757d', color: '#fff' }}>Planta</th>
                                        <th className="text-center" style={{ backgroundColor: '#6c757d', color: '#fff' }}>Tanque</th>
                                        <th className="text-center" style={{ backgroundColor: '#6c757d', color: '#fff' }}>CuentaLitros</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mockEntradas.map((e, i) => (
                                        <tr key={i}>
                                            <td className="text-center">{e.fecha}</td>
                                            <td className="text-end font-monospace">{e.litros.toLocaleString()}</td>
                                            <td>{e.planta}</td>
                                            <td>{e.tanque}</td>
                                            <td className="text-end font-monospace">{e.cuentaLitros.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </Tab>
                </Tabs>
            </Modal.Body>
            <Modal.Footer className="bg-light">
                <Button variant="secondary" onClick={onHide}>
                    Cerrar
                </Button>
            </Modal.Footer>
            {/* Estilos para el blur del modal y Tabs personalizados */}
            <style>
                {`
                .modal-backdrop-blur {
                    backdrop-filter: blur(5px);
                    background-color: rgba(0, 0, 0, 0.5) !important;
                }
                
                /* Estilos para los Tabs */
                .nav-tabs .nav-link {
                    color: #6c757d;
                    font-weight: 600;
                    border: none;
                    border-bottom: 3px solid transparent;
                    transition: all 0.3s ease;
                }

                .nav-tabs .nav-link:hover {
                    border-color: transparent;
                    background-color: #f8f9fa;
                }

                /* Tab de Salidas (Azul) */
                #detalle-movimientos-tabs-tab-salidas.nav-link.active {
                    color: #0d6efd !important;
                    background-color: #e7f1ff !important;
                    border-bottom: 3px solid #0d6efd !important;
                    border-radius: 8px 8px 0 0;
                }

                /* Tab de Entradas (Naranja) */
                #detalle-movimientos-tabs-tab-entradas.nav-link.active {
                    color: #fd7e14 !important;
                    background-color: #fff3e6 !important;
                    border-bottom: 3px solid #fd7e14 !important;
                    border-radius: 8px 8px 0 0;
                }

                .nav-tabs {
                    border-bottom: 2px solid #dee2e6;
                }
                `}
            </style>
        </Modal>
    );
}
