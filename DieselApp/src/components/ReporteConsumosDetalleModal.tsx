import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Table,
  Tabs,
  Tab,
  Spinner,
  Alert,
} from "react-bootstrap";
import { supabase } from "../supabaseClient";

interface ReporteConsumosDetalleModalProps {
  show: boolean;
  onHide: () => void;
  datosFila: {
    fecha: string;
    ciudad: string;
    tanque: string;
    idTanque: number;
  } | null;
}

interface SalidaDetalle {
  tanque: string;
  fecha: string;
  hora: string;
  temperatura: number;
  unidad: string;
  litros: number;
  cuenta_litros: number;
  horometro: number;
  odometro: number;
}

interface EntradaDetalle {
  fecha: string;
  hora: string;
  temperatura: number;
  litros: number;
  planta: string;
  tanque: string;
  cuenta_litros: number;
}

export default function ReporteConsumosDetalleModal({
  show,
  onHide,
  datosFila,
}: ReporteConsumosDetalleModalProps) {
  const [salidas, setSalidas] = useState<SalidaDetalle[]>([]);
  const [entradas, setEntradas] = useState<EntradaDetalle[]>([]);
  const [loadingSalidas, setLoadingSalidas] = useState(false);
  const [loadingEntradas, setLoadingEntradas] = useState(false);
  const [errorSalidas, setErrorSalidas] = useState<string | null>(null);
  const [errorEntradas, setErrorEntradas] = useState<string | null>(null);

  useEffect(() => {
    if (show && datosFila) {
      cargarSalidas();
      cargarEntradas();
    }
  }, [show, datosFila]);

  const cargarSalidas = async () => {
    if (!datosFila) return;

    setLoadingSalidas(true);
    setErrorSalidas(null);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "get_salidas_detalle",
        {
          p_fecha: datosFila.fecha,
          p_ciudad: datosFila.ciudad,
          p_id_tanque: datosFila.idTanque,
        },
      );

      if (rpcError) {
        console.error("Error al obtener salidas:", rpcError);
        setErrorSalidas("Error al cargar los datos de salidas");
        setSalidas([]);
      } else {
        setSalidas(data || []);
      }
    } catch (err) {
      console.error("Error inesperado:", err);
      setErrorSalidas("Error inesperado al cargar los datos");
      setSalidas([]);
    } finally {
      setLoadingSalidas(false);
    }
  };

  const cargarEntradas = async () => {
    if (!datosFila) return;

    setLoadingEntradas(true);
    setErrorEntradas(null);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "get_entradas_detalle",
        {
          p_fecha: datosFila.fecha,
          p_ciudad: datosFila.ciudad,
          p_id_tanque: datosFila.idTanque,
        },
      );

      if (rpcError) {
        console.error("Error al obtener entradas:", rpcError);
        setErrorEntradas("Error al cargar los datos de entradas");
        setEntradas([]);
      } else {
        setEntradas(data || []);
      }
    } catch (err) {
      console.error("Error inesperado:", err);
      setErrorEntradas("Error inesperado al cargar los datos");
      setEntradas([]);
    } finally {
      setLoadingEntradas(false);
    }
  };

  const exportarSalidasCSV = () => {
    const headers = [
      "Tanque",
      "Fecha",
      "Hora",
      "Temperatura",
      "Unidad",
      "Litros",
      "CuentaLitros",
      "Horometro",
      "Odometro",
    ];
    const csvContent = [
      headers.join(","),
      ...salidas.map((s) =>
        [
          s.tanque,
          s.fecha,
          s.hora,
          s.temperatura,
          s.unidad,
          s.litros,
          s.cuenta_litros,
          s.horometro,
          s.odometro,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `detalle_salidas_${datosFila?.tanque}_${datosFila?.fecha}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportarEntradasCSV = () => {
    const headers = [
      "Fecha",
      "Hora",
      "Temperatura",
      "Litros",
      "Planta",
      "Tanque",
      "CuentaLitros",
    ];
    const csvContent = [
      headers.join(","),
      ...entradas.map((e) =>
        [
          e.fecha,
          e.hora,
          e.temperatura,
          e.litros,
          e.planta,
          e.tanque,
          e.cuenta_litros,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `detalle_entradas_${datosFila?.tanque}_${datosFila?.fecha}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!datosFila) return null;

  // Formatear fecha para mostrar en el título del modal
  const formatearFechaDisplay = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
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
          Detalle de Movimientos: {datosFila.tanque} (
          {formatearFechaDisplay(datosFila.fecha)})
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0 position-relative">
        <Tabs
          defaultActiveKey="salidas"
          id="detalle-movimientos-tabs"
          className="p-3"
        >
          <Tab eventKey="salidas" title="Salidas">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0 text-dark text-center w-100 fw-bold">
                Movimiento de Salidas de Combustible
              </h6>
              <Button
                variant="success"
                size="sm"
                onClick={exportarSalidasCSV}
                className="position-absolute end-0 me-3"
                disabled={salidas.length === 0}
              >
                <i className="bi bi-download me-1"></i> Exportar CSV
              </Button>
            </div>
            {loadingSalidas && (
              <div className="text-center py-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </Spinner>
                <p className="mt-2">Cargando datos de salidas...</p>
              </div>
            )}
            {errorSalidas && (
              <Alert variant="danger" className="mb-3">
                {errorSalidas}
              </Alert>
            )}
            {!loadingSalidas && !errorSalidas && salidas.length === 0 && (
              <Alert variant="info" className="mb-3">
                No se encontraron movimientos de salida para esta fecha.
              </Alert>
            )}
            {!loadingSalidas && !errorSalidas && salidas.length > 0 && (
              <div className="table-responsive">
                <Table
                  striped
                  bordered
                  hover
                  size="sm"
                  className="mb-0 table-corporate"
                >
                  <thead>
                    <tr>
                      <th className="text-center">Tanque</th>
                      <th className="text-center">Fecha</th>
                      <th className="text-center">Hora</th>
                      <th className="text-center">Temp (°C)</th>
                      <th className="text-center">Unidad</th>
                      <th className="text-center">Litros</th>
                      <th className="text-center">CuentaLitros</th>
                      <th className="text-center">Horómetro</th>
                      <th className="text-center">Odómetro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salidas.map((s: SalidaDetalle, i: number) => (
                      <tr key={i}>
                        <td>{s.tanque}</td>
                        <td className="text-center">{s.fecha}</td>
                        <td className="text-center">{s.hora}</td>
                        <td className="text-center">{s.temperatura}</td>
                        <td>{s.unidad}</td>
                        <td className="text-end">
                          {s.litros.toLocaleString()}
                        </td>
                        <td className="text-end">
                          {s.cuenta_litros.toLocaleString()}
                        </td>
                        <td className="text-end">
                          {s.horometro.toLocaleString()}
                        </td>
                        <td className="text-end">
                          {s.odometro.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Tab>
          <Tab eventKey="entradas" title="Entradas">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0 text-dark text-center w-100 fw-bold">
                Movimiento de Entradas de Combustibles a Tanques
              </h6>
              <Button
                variant="success"
                size="sm"
                onClick={exportarEntradasCSV}
                className="position-absolute end-0 me-3"
                disabled={entradas.length === 0}
              >
                <i className="bi bi-download me-1"></i> Exportar CSV
              </Button>
            </div>
            {loadingEntradas && (
              <div className="text-center py-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </Spinner>
                <p className="mt-2">Cargando datos de entradas...</p>
              </div>
            )}
            {errorEntradas && (
              <Alert variant="danger" className="mb-3">
                {errorEntradas}
              </Alert>
            )}
            {!loadingEntradas && !errorEntradas && entradas.length === 0 && (
              <Alert variant="info" className="mb-3">
                No se encontraron movimientos de entrada para esta fecha.
              </Alert>
            )}
            {!loadingEntradas && !errorEntradas && entradas.length > 0 && (
              <div className="table-responsive">
                <Table
                  striped
                  bordered
                  hover
                  size="sm"
                  className="mb-0 table-corporate"
                >
                  <thead>
                    <tr>
                      <th className="text-center">Fecha</th>
                      <th className="text-center">Hora</th>
                      <th className="text-center">Temp (°C)</th>
                      <th className="text-center">Litros</th>
                      <th className="text-center">Planta</th>
                      <th className="text-center">Tanque</th>
                      <th className="text-center">CuentaLitros</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entradas.map((e: EntradaDetalle, i: number) => (
                      <tr key={i}>
                        <td className="text-center">{e.fecha}</td>
                        <td className="text-center">{e.hora}</td>
                        <td className="text-center">{e.temperatura}</td>
                        <td className="text-end">
                          {e.litros.toLocaleString()}
                        </td>
                        <td>{e.planta}</td>
                        <td>{e.tanque}</td>
                        <td className="text-end">
                          {e.cuenta_litros.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
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
