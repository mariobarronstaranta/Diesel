import { useEffect, useState } from "react";
import { Alert, Button, Form, Modal, Spinner, Table } from "react-bootstrap";
import { supabase } from "../supabase/client";
import type { RendimientoDetalleV2Item } from "../types/reportes.types";

interface ReporteRendimientosDetalleModalV2Props {
  show: boolean;
  onHide: () => void;
  datosFila: {
    fechaInicio: string;
    fechaFin: string;
    cveCiudad: string;
    idUnidad: number;
    unidad: string;
    tanquePrincipal: string;
    tanquesUtilizados: string;
  } | null;
}

export default function ReporteRendimientosDetalleModalV2({
  show,
  onHide,
  datosFila,
}: ReporteRendimientosDetalleModalV2Props) {
  const [movimientos, setMovimientos] = useState<RendimientoDetalleV2Item[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        "get_rendimientos_detalle_v2",
        {
          p_fecha_inicio: datosFila.fechaInicio,
          p_fecha_fin: datosFila.fechaFin,
          p_cve_ciudad: datosFila.cveCiudad,
          p_id_unidad: datosFila.idUnidad,
        },
      );

      if (rpcError) {
        console.error(
          "Error al obtener detalle consolidado de rendimientos:",
          rpcError,
        );
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

  const handleEditStart = (m: RendimientoDetalleV2Item) => {
    if (!m.id_tanque_movimiento) {
      alert(
        "Error: No se encontró el ID del movimiento. Verifique que la función 'get_rendimientos_detalle_v2' retorne id_tanque_movimiento.",
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

      const { error: updateError } = await supabase
        .from("TanqueMovimiento")
        .update({
          LitrosCarga: editForm.litros,
          CuentaLitros: editForm.cuenta_litros,
          Horimetro: editForm.horometro,
          Odometro: editForm.odometro,
        })
        .eq("IdTanqueMovimiento", id);

      if (updateError) throw updateError;

      setEditingId(null);
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
      "Tanque",
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
          `"${m.tanque}"`,
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
      `detalle_rendimientos_consolidado_${datosFila?.unidad}_${datosFila?.fechaInicio}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatearFecha = (fecha: string) => {
    const [y, m, d] = fecha.split("-");
    return `${d}/${m}/${y}`;
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
          Detalle Consolidado — {datosFila.unidad}
          <small className="text-muted ms-2 fs-6">
            ({formatearFecha(datosFila.fechaInicio)} al{" "}
            {formatearFecha(datosFila.fechaFin)})
          </small>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-3">
        <Alert variant="info" className="mb-3">
          El rendimiento consolidado se calcula con todas las cargas de la
          unidad en el periodo. Tanque principal: {datosFila.tanquePrincipal}.
          Tanques utilizados: {datosFila.tanquesUtilizados}.
        </Alert>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0 fw-bold text-dark">
            Movimientos de salida consolidados por unidad
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
            No se encontraron movimientos para esta unidad en el periodo.
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
                  <th>ID Movimiento</th>
                  <th>Tanque</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Litros</th>
                  <th>Cuenta Litros</th>
                  <th>Horómetro</th>
                  <th>Odómetro</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr key={m.id_tanque_movimiento}>
                    <td>{m.id_tanque_movimiento}</td>
                    <td>{m.tanque}</td>
                    <td>{formatearFecha(m.fecha)}</td>
                    <td>{m.hora}</td>
                    {editingId === m.id_tanque_movimiento ? (
                      <>
                        <td>
                          <Form.Control
                            type="number"
                            size="sm"
                            value={editForm.litros}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                litros: Number(e.target.value),
                              })
                            }
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            size="sm"
                            value={editForm.cuenta_litros}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                cuenta_litros: Number(e.target.value),
                              })
                            }
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            size="sm"
                            value={editForm.horometro}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                horometro: Number(e.target.value),
                              })
                            }
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            size="sm"
                            value={editForm.odometro}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                odometro: Number(e.target.value),
                              })
                            }
                          />
                        </td>
                        <td className="text-center">
                          <div className="d-flex gap-1 justify-content-center">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() =>
                                handleUpdate(m.id_tanque_movimiento)
                              }
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
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{m.litros}</td>
                        <td>{m.cuenta_litros}</td>
                        <td>{m.horometro}</td>
                        <td>{m.odometro}</td>
                        <td className="text-center">
                          <Button
                            variant="outline-corporate"
                            size="sm"
                            onClick={() => handleEditStart(m)}
                            disabled={isUpdating}
                          >
                            Editar
                          </Button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
