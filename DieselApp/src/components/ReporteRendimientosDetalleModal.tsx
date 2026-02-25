import { useState, useEffect } from "react";
import { Modal, Button, Table, Spinner, Alert, Form } from "react-bootstrap";
import { supabase } from "../supabase/client";
import type { RendimientoDetalleItem } from "../types/reportes.types";

interface ReporteRendimientosDetalleModalProps {
  show: boolean;
  onHide: () => void;
  datosFila: {
    fechaInicio: string;
    fechaFin: string;
    cveCiudad: string;
    idTanque: number;
    idUnidad: number;
    tanque: string;
    unidad: string;
  } | null;
}

export default function ReporteRendimientosDetalleModal({
  show,
  onHide,
  datosFila,
}: ReporteRendimientosDetalleModalProps) {
  const [movimientos, setMovimientos] = useState<RendimientoDetalleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para edición
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    litros: 0,
    cuenta_litros: 0,
    horometro: 0,
    odometro: 0,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (show && datosFila) {
      setEditingId(null);
      cargarMovimientos();
    }
  }, [show, datosFila]);

  const cargarMovimientos = async () => {
    if (!datosFila) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "get_rendimientos_detalle",
        {
          p_fecha_inicio: datosFila.fechaInicio,
          p_fecha_fin: datosFila.fechaFin,
          p_cve_ciudad: datosFila.cveCiudad,
          p_id_tanque: datosFila.idTanque,
          p_id_unidad: datosFila.idUnidad,
        },
      );

      if (rpcError) {
        console.error("Error al obtener detalle de rendimientos:", rpcError);
        setError("Error al cargar los movimientos de detalle");
        setMovimientos([]);
      } else {
        setMovimientos(data || []);
      }
    } catch (err) {
      console.error("Error inesperado:", err);
      setError("Error inesperado al cargar los datos");
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (m: RendimientoDetalleItem) => {
    if (!m.id_tanque_movimiento) {
      alert(
        "Error: No se encontró el ID del movimiento. Verifique que la función 'get_rendimientos_detalle' retorne id_tanque_movimiento.",
      );
      return;
    }

    setEditingId(m.id_tanque_movimiento);
    setEditForm({
      litros: m.litros,
      cuenta_litros: m.cuenta_litros,
      horometro: m.horometro,
      odometro: m.odometro,
    });
  };

  const handleUpdate = async (id: number) => {
    if (
      editForm.litros === null ||
      editForm.cuenta_litros === null ||
      editForm.horometro === null ||
      editForm.odometro === null
    ) {
      alert(
        "Todos los campos numéricos son obligatorios y no pueden ir en blanco",
      );
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);

      const { error } = await supabase
        .from("TanqueMovimiento")
        .update({
          LitrosCarga: editForm.litros,
          CuentaLitros: editForm.cuenta_litros,
          Horimetro: editForm.horometro,
          Odometro: editForm.odometro,
        })
        .eq("IdTanqueMovimiento", id);

      if (error) throw error;

      setEditingId(null);

      // Recargar datos para ver los cambios
      cargarMovimientos();
    } catch (err: unknown) {
      console.error("Error al actualizar:", err);
      alert(
        "Error al actualizar el registro: " +
          (err instanceof Error ? err.message : "Error desconocido"),
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const exportarCSV = () => {
    if (movimientos.length === 0) return;

    const headers = [
      "ID Movimiento",
      "Fecha",
      "Hora",
      "Litros",
      "Cuenta Litros",
      "Horómetro",
      "Odómetro",
    ];

    const csvContent = [
      headers.join(","),
      ...movimientos.map((m) =>
        [
          m.id_tanque_movimiento,
          m.fecha,
          m.hora,
          m.litros,
          m.cuenta_litros,
          m.horometro,
          m.odometro,
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
      `detalle_rendimientos_${datosFila?.tanque}_${datosFila?.unidad}_${datosFila?.fechaInicio}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  if (!datosFila) return null;

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
          Detalle de Movimientos — {datosFila.tanque} / {datosFila.unidad}
          <small className="text-muted ms-2 fs-6">
            ({formatearFecha(datosFila.fechaInicio)} al{" "}
            {formatearFecha(datosFila.fechaFin)})
          </small>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0 fw-bold text-dark">
            Movimientos de Salida de Combustible
          </h6>
          <Button
            variant="success"
            size="sm"
            onClick={exportarCSV}
            disabled={movimientos.length === 0 || loading}
          >
            <i className="bi bi-download me-1"></i> Exportar CSV
          </Button>
        </div>

        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Cargando...</span>
            </Spinner>
            <p className="mt-2 text-muted">Cargando movimientos...</p>
          </div>
        )}

        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        {isUpdating && (
          <Alert variant="warning" className="mb-3 d-flex align-items-center">
            <Spinner animation="border" size="sm" className="me-2" />
            Actualizando registro...
          </Alert>
        )}

        {!loading && !error && movimientos.length === 0 && (
          <Alert variant="info" className="mb-3">
            No se encontraron movimientos para esta combinación de filtros.
          </Alert>
        )}

        {!loading && !error && movimientos.length > 0 && (
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
                  <th className="text-center">ID Movimiento</th>
                  <th className="text-center">Fecha</th>
                  <th className="text-center">Hora</th>
                  <th className="text-center">Litros</th>
                  <th className="text-center">Cuenta Litros</th>
                  <th className="text-center">Horómetro</th>
                  <th className="text-center">Odómetro</th>
                  <th className="text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m, i) => (
                  <tr key={i}>
                    <td className="text-center">{m.id_tanque_movimiento}</td>
                    <td className="text-center">{formatearFecha(m.fecha)}</td>
                    <td className="text-center">{m.hora}</td>
                    <td className="text-end" style={{ minWidth: "100px" }}>
                      {editingId === m.id_tanque_movimiento ? (
                        <Form.Control
                          type="number"
                          size="sm"
                          value={editForm.litros}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              litros: Number(e.target.value),
                            }))
                          }
                        />
                      ) : (
                        m.litros.toLocaleString()
                      )}
                    </td>
                    <td className="text-end" style={{ minWidth: "110px" }}>
                      {editingId === m.id_tanque_movimiento ? (
                        <Form.Control
                          type="number"
                          size="sm"
                          value={editForm.cuenta_litros}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              cuenta_litros: Number(e.target.value),
                            }))
                          }
                        />
                      ) : (
                        (m.cuenta_litros ?? 0).toLocaleString()
                      )}
                    </td>
                    <td className="text-end" style={{ minWidth: "100px" }}>
                      {editingId === m.id_tanque_movimiento ? (
                        <Form.Control
                          type="number"
                          size="sm"
                          value={editForm.horometro}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              horometro: Number(e.target.value),
                            }))
                          }
                        />
                      ) : (
                        (m.horometro ?? 0).toLocaleString()
                      )}
                    </td>
                    <td className="text-end" style={{ minWidth: "100px" }}>
                      {editingId === m.id_tanque_movimiento ? (
                        <Form.Control
                          type="number"
                          size="sm"
                          value={editForm.odometro}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              odometro: Number(e.target.value),
                            }))
                          }
                        />
                      ) : (
                        (m.odometro ?? 0).toLocaleString()
                      )}
                    </td>
                    <td className="text-center">
                      {editingId === m.id_tanque_movimiento ? (
                        <div className="d-flex gap-1 justify-content-center">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleUpdate(m.id_tanque_movimiento)}
                            disabled={isUpdating}
                          >
                            Ok
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setEditingId(null)}
                            disabled={isUpdating}
                          >
                            X
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline-corporate"
                          size="sm"
                          onClick={() => handleEditStart(m)}
                          disabled={
                            isUpdating || (isUpdating && editingId !== null)
                          }
                        >
                          Editar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-secondary fw-bold">
                <tr>
                  <td colSpan={3} className="text-end">
                    Total:
                  </td>
                  <td className="text-end">
                    {movimientos
                      .reduce((sum, m) => sum + (m.litros ?? 0), 0)
                      .toLocaleString()}
                  </td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            </Table>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="bg-light">
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>

      <style>{`
        .modal-backdrop-blur {
          backdrop-filter: blur(5px);
          background-color: rgba(0, 0, 0, 0.5) !important;
        }
      `}</style>
    </Modal>
  );
}
