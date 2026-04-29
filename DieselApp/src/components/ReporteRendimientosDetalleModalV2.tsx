import { useEffect, useState } from "react";
import { Alert, Button, Col, Form, Modal, Row, Spinner, Table } from "react-bootstrap";
import { supabase } from "../supabase/client";
import type { RendimientoDetalleV2Item } from "../types/reportes.types";

interface ReporteRendimientosDetalleModalV2Props {
  show: boolean;
  onHide: () => void;
  // El modal recibe el contexto del renglón consolidado para consultar
  // únicamente los movimientos que pertenecen a esa unidad y periodo.
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
  const toOneDecimal = (value: number) => Math.round(value * 10) / 10;
  const formatearLectura = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return "-";
    const numberValue =
      typeof value === "number"
        ? value
        : Number(String(value).replace(",", "."));

    if (Number.isNaN(numberValue)) return String(value);

    return numberValue.toLocaleString("es-MX", {
      minimumFractionDigits: Number.isInteger(numberValue) ? 0 : 1,
      maximumFractionDigits: 1,
    });
  };

  // `movimientos` es la fotografía del detalle que devuelve la RPC v2.
  // Incluye lecturas actuales y previas para explicar el cálculo incremental.
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
    // Cada vez que el modal abre con un renglón distinto, se reinicia el modo edición
    // y se vuelve a consultar el detalle para mantener la vista sincronizada.
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
      const { data: rows, error: rowsError } = await supabase
        .from("TanqueMovimiento")
        .select(
          "IdTanqueMovimiento, IdTanque, FechaCarga, HoraCarga, LitrosCarga, CuentaLitros, Horimetro, Odometro",
        )
        .eq("TipoMovimiento", "S")
        .eq("CveCiudad", datosFila.cveCiudad)
        .eq("IdUnidad", datosFila.idUnidad)
        .lte("FechaCarga", datosFila.fechaFin)
        .order("FechaCarga", { ascending: true })
        .order("HoraCarga", { ascending: true })
        .order("IdTanqueMovimiento", { ascending: true });

      if (rowsError) throw rowsError;

      const tanqueIds = [
        ...new Set((rows || []).map((r) => r.IdTanque).filter(Boolean)),
      ] as number[];

      let tanquesMap = new Map<number, string>();
      if (tanqueIds.length > 0) {
        const { data: tanques, error: tanquesError } = await supabase
          .from("Tanque")
          .select("IDTanque, Nombre")
          .in("IDTanque", tanqueIds);

        if (tanquesError) throw tanquesError;

        tanquesMap = new Map((tanques || []).map((t) => [t.IDTanque, t.Nombre]));
      }

      let prevOdometro: number | null = null;
      let prevHorometro: number | null = null;

      const detalle: RendimientoDetalleV2Item[] = [];

      for (const row of rows || []) {
        const fecha = String(row.FechaCarga);
        const hora = String(row.HoraCarga);
        const odometroRaw = row.Odometro;
        const horometroRaw = row.Horimetro;

        const odometroActual = Number(odometroRaw ?? 0);
        const horometroActual = Number(horometroRaw ?? 0);

        const dentroRango =
          fecha >= datosFila.fechaInicio && fecha <= datosFila.fechaFin;

        if (dentroRango) {
          detalle.push({
            id_tanque_movimiento: Number(row.IdTanqueMovimiento),
            tanque:
              tanquesMap.get(Number(row.IdTanque)) ||
              String(row.IdTanque ?? "N/A"),
            fecha,
            hora,
            litros: Number(row.LitrosCarga ?? 0),
            cuenta_litros: Number(row.CuentaLitros ?? 0),
            odometro_ant: prevOdometro,
            horometro_ant: prevHorometro,
            horometro: horometroActual,
            odometro: odometroActual,
          });
        }

        prevOdometro = odometroRaw === null ? null : odometroActual;
        prevHorometro = horometroRaw === null ? null : horometroActual;
      }

      setMovimientos(detalle);
    } catch (err) {
      console.error("Error al obtener detalle consolidado de rendimientos:", err);
      setError("Error inesperado al cargar los datos");
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (m: RendimientoDetalleV2Item) => {
    // El edit inline solo modifica los valores capturados del movimiento actual.
    // Los campos "anteriores" son de referencia y por eso permanecen de solo lectura.
    if (!m.id_tanque_movimiento) {
      alert(
        "Error: No se encontró el ID del movimiento para este registro.",
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

      const horometro = toOneDecimal(editForm.horometro);
      const odometro = toOneDecimal(editForm.odometro);

      // La edición impacta directamente la tabla operativa `TanqueMovimiento`.
      // Después del update se vuelve a consultar la RPC para refrescar también
      // los campos derivados que podrían cambiar visualmente en el detalle.
      const { error: updateError } = await supabase
        .from("TanqueMovimiento")
        .update({
          LitrosCarga: editForm.litros,
          CuentaLitros: editForm.cuenta_litros,
          Horimetro: horometro,
          Odometro: odometro,
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

    // Se respeta exactamente el mismo orden de columnas visible en el modal
    // para evitar diferencias entre lo que el usuario ve y lo que exporta.
    const headers = [
      "ID",
      "Tanque",
      "Fecha",
      "Hora",
      "Litros",
      "Cuenta Litros",
      "Odómetro Ant",
      "Odómetro",
      "Horometro Ant",
      "Horómetro",
      "Dif Odometro",
      "Dif Horometro",
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
          m.odometro_ant ?? "",
          m.odometro,
          m.horometro_ant ?? "",
          m.horometro,
          m.odometro_ant === null ? "" : m.odometro - m.odometro_ant,
          m.horometro_ant === null ? "" : m.horometro - m.horometro_ant,
        ].join(","),
      ),
    ].join("\n");

    // Se agrega BOM UTF-8 para que Excel abra correctamente acentos y caracteres especiales.
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

  const calcularDiferencia = (
    actual: number | null | undefined,
    anterior: number | null,
  ) => {
    if (actual === null || actual === undefined || anterior === null) return "-";
    return actual - anterior;
  };

  const formatearNumero = (
    valor: number,
    decimales?: number,
  ) => {
    const minDecimales =
      decimales ?? (Number.isInteger(valor) ? 0 : 1);
    const maxDecimales = decimales ?? 1;

    return Number(valor).toLocaleString("es-MX", {
      minimumFractionDigits: minDecimales,
      maximumFractionDigits: maxDecimales,
    });
  };

  const totalHoras = movimientos.reduce((acc, m) => {
    if (m.horometro_ant === null) return acc;
    return acc + (m.horometro - m.horometro_ant);
  }, 0);

  const totalKms = movimientos.reduce((acc, m) => {
    if (m.odometro_ant === null) return acc;
    return acc + (m.odometro - m.odometro_ant);
  }, 0);

  const totalDiesel = movimientos.reduce((acc, m) => acc + m.litros, 0);

  // Sin contexto del renglón padre no hay forma de consultar el detalle correcto.
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
          Tanque principal: {datosFila.tanquePrincipal}. Tanques utilizados: {datosFila.tanquesUtilizados}.
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

        {!loading && !error && movimientos.length > 0 && (
          <Row className="g-2 mb-3">
            <Col md={4}>
              <div className="border rounded p-2 bg-light h-100">
                <div className="small text-muted">Total Horas</div>
                <div className="fw-bold fs-5">{formatearNumero(totalHoras)}</div>
              </div>
            </Col>
            <Col md={4}>
              <div className="border rounded p-2 bg-light h-100">
                <div className="small text-muted">Total Kms</div>
                <div className="fw-bold fs-5">{formatearNumero(totalKms)}</div>
              </div>
            </Col>
            <Col md={4}>
              <div className="border rounded p-2 bg-light h-100">
                <div className="small text-muted">Total Diesel</div>
                <div className="fw-bold fs-5">{formatearNumero(totalDiesel)}</div>
              </div>
            </Col>
          </Row>
        )}

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
                  <th>ID</th>
                  <th>Tanque</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Litros</th>
                  <th>Cuenta Litros</th>
                  <th>Odómetro Ant</th>
                  <th>Odómetro</th>
                  <th>Horometro Ant</th>
                  <th>Horómetro</th>
                  <th>Dif Odometro</th>
                  <th>Dif Horometro</th>
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
                        {/* En modo edición solo se habilitan campos operativos capturables.
                            Los valores "Ant" se muestran como referencia fija para auditoría visual. */}
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
                          {formatearLectura(m.odometro_ant)}
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            step="0.1"
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
                        <td>
                          {formatearLectura(m.horometro_ant)}
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            step="0.1"
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
                        <td>{formatearLectura(calcularDiferencia(editForm.odometro, m.odometro_ant))}</td>
                        <td>
                          {formatearLectura(calcularDiferencia(editForm.horometro, m.horometro_ant))}
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
                        {/* Vista normal: muestra el detalle tal como lo devuelve la RPC,
                            incluyendo valores previos usados para explicar el rendimiento incremental. */}
                        <td>{m.litros}</td>
                        <td>{m.cuenta_litros}</td>
                        <td>{formatearLectura(m.odometro_ant)}</td>
                        <td>{formatearLectura(m.odometro)}</td>
                        <td>{formatearLectura(m.horometro_ant)}</td>
                        <td>{formatearLectura(m.horometro)}</td>
                        <td>{formatearLectura(calcularDiferencia(m.odometro, m.odometro_ant))}</td>
                        <td>{formatearLectura(calcularDiferencia(m.horometro, m.horometro_ant))}</td>
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
