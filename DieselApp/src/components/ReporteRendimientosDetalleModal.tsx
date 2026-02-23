import { useState, useEffect } from "react";
import { Modal, Button, Table, Spinner, Alert } from "react-bootstrap";
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

  useEffect(() => {
    if (show && datosFila) {
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
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m, i) => (
                  <tr key={i}>
                    <td className="text-center">{m.id_tanque_movimiento}</td>
                    <td className="text-center">{formatearFecha(m.fecha)}</td>
                    <td className="text-center">{m.hora}</td>
                    <td className="text-end">{m.litros.toLocaleString()}</td>
                    <td className="text-end">
                      {(m.cuenta_litros ?? 0).toLocaleString()}
                    </td>
                    <td className="text-end">
                      {(m.horometro ?? 0).toLocaleString()}
                    </td>
                    <td className="text-end">
                      {(m.odometro ?? 0).toLocaleString()}
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
                  <td colSpan={3}></td>
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
