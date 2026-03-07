import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Table,
  Spinner,
  Alert,
  Tab,
  Tabs,
} from "react-bootstrap";
import { supabase } from "../supabase/client";
import type {
  ProductividadMovDiesel,
  ProductividadMovSP,
} from "../types/reportes.types";

interface ReporteProductividadDetalleModalProps {
  show: boolean;
  onHide: () => void;
  datosFila: {
    idUnidad: number;
    unidad: string;
    tanque: string;
    fechaInicio: string;
    fechaFin: string;
  } | null;
}

export default function ReporteProductividadDetalleModal({
  show,
  onHide,
  datosFila,
}: ReporteProductividadDetalleModalProps) {
  const [movDiesel, setMovDiesel] = useState<ProductividadMovDiesel[]>([]);
  const [movSP, setMovSP] = useState<ProductividadMovSP[]>([]);
  const [loadingDiesel, setLoadingDiesel] = useState(false);
  const [loadingSP, setLoadingSP] = useState(false);
  const [errorDiesel, setErrorDiesel] = useState<string | null>(null);
  const [errorSP, setErrorSP] = useState<string | null>(null);

  // Reordena "YYYY-MM-DD" o "M/D/YYYY" → "DD/MM/YYYY" sin zona horaria
  const formatearFecha = (fecha: string) => {
    if (!fecha) return "";

    if (fecha.includes("/")) {
      const parte = fecha.split(" ")[0]; // Quitar la hora si la trae
      const [m, d, y] = parte.split("/");
      return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
    }

    const parte = fecha.split("T")[0]; // por si viene con timestamp
    const [y, m, d] = parte.split("-");
    return `${d}/${m}/${y}`;
  };

  const cargarMovDiesel = async () => {
    if (!datosFila || !datosFila.idUnidad) return;
    setLoadingDiesel(true);
    setErrorDiesel(null);
    try {
      const { data, error } = await supabase
        .from("TanqueMovimiento")
        .select("FechaCarga, LitrosCarga, Horimetro, Odometro")
        .eq("IdUnidad", datosFila.idUnidad)
        .eq("TipoMovimiento", "S")
        .gte("FechaCarga", datosFila.fechaInicio)
        .lte("FechaCarga", datosFila.fechaFin)
        .order("FechaCarga", { ascending: true });

      if (error) throw error;
      setMovDiesel((data as ProductividadMovDiesel[]) || []);
    } catch (err: unknown) {
      console.error("[MovDiesel] Error:", err);
      setErrorDiesel(
        err instanceof Error
          ? err.message
          : "Error al cargar movimientos Diesel",
      );
      setMovDiesel([]);
    } finally {
      setLoadingDiesel(false);
    }
  };

  const cargarMovSP = async () => {
    if (!datosFila || !datosFila.idUnidad) return;
    setLoadingSP(true);
    setErrorSP(null);
    try {
      const { data, error } = await supabase
        .from("InformacionGeneral_Cierres")
        .select(
          "FechaInicio, NombreUnidad, CargaViaje, Remision, NombreProducto, NombreCliente",
        )
        .eq("IDUnidad", datosFila.idUnidad);

      if (error) throw error;

      // Filtrado en cliente porque FechaInicio es string con formato "M/D/YYYY"
      const inicioNum = new Date(`${datosFila.fechaInicio}T00:00:00`).getTime();
      const finNum = new Date(`${datosFila.fechaFin}T23:59:59`).getTime();

      const filtered = ((data as ProductividadMovSP[]) || []).filter((m) => {
        if (!m.FechaInicio) return false;

        let recordDateNum = 0;
        if (m.FechaInicio.includes("/")) {
          const [mdy] = m.FechaInicio.split(" ");
          const [month, day, year] = mdy.split("/");
          recordDateNum = new Date(
            `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T12:00:00`,
          ).getTime();
        } else if (m.FechaInicio.includes("-")) {
          const [ymd] = m.FechaInicio.split(" ");
          const [year, month, day] = ymd.split("-");
          recordDateNum = new Date(
            `${year}-${month}-${day}T12:00:00`,
          ).getTime();
        } else {
          recordDateNum = new Date(m.FechaInicio).getTime();
        }

        return recordDateNum >= inicioNum && recordDateNum <= finNum;
      });

      // Ordenar por fecha cronológicamente
      filtered.sort((a, b) => {
        if (!a.FechaInicio) return -1;
        if (!b.FechaInicio) return 1;
        return (
          new Date(a.FechaInicio).getTime() - new Date(b.FechaInicio).getTime()
        );
      });

      setMovSP(filtered);
    } catch (err: unknown) {
      console.error("[MovSP] Error:", err);
      setErrorSP(
        err instanceof Error ? err.message : "Error al cargar movimientos SP",
      );
      setMovSP([]);
    } finally {
      setLoadingSP(false);
    }
  };

  useEffect(() => {
    if (show && datosFila) {
      cargarMovDiesel();
      cargarMovSP();
    }
  }, [show, datosFila]);

  const totalLitros = movDiesel.reduce(
    (sum, m) => sum + (m.LitrosCarga ?? 0),
    0,
  );

  // Calcular totales de horómetro y odómetro (último - primero)
  // asumiendo que movDiesel está ordenado cronológicamente ascendente
  let totalHorometro = 0;
  let totalOdometro = 0;
  if (movDiesel.length > 0) {
    const primerMov = movDiesel[0];
    const ultimoMov = movDiesel[movDiesel.length - 1];

    // Solo calcular si ambos valores existen y son mayores a cero para evitar negativos erróneos
    if ((ultimoMov.Horimetro ?? 0) >= (primerMov.Horimetro ?? 0)) {
      totalHorometro = (ultimoMov.Horimetro ?? 0) - (primerMov.Horimetro ?? 0);
    }
    if ((ultimoMov.Odometro ?? 0) >= (primerMov.Odometro ?? 0)) {
      totalOdometro = (ultimoMov.Odometro ?? 0) - (primerMov.Odometro ?? 0);
    }
  }

  const totalM3 = movSP.reduce((sum, m) => sum + (m.CargaViaje ?? 0), 0);

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
          Detalle de Movimientos — {datosFila.unidad}
          <small className="text-muted ms-2 fs-6">
            ({formatearFecha(datosFila.fechaInicio)} al{" "}
            {formatearFecha(datosFila.fechaFin)})
          </small>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-3">
        <Tabs defaultActiveKey="diesel" className="mb-3">
          {/* ══════════════════════════════════════
              PESTAÑA 1 — Mov. Diesel
          ══════════════════════════════════════ */}
          <Tab eventKey="diesel" title="🛢️ Mov. Diesel">
            {loadingDiesel ? (
              <div className="text-center py-5">
                <Spinner animation="border" role="status" />
                <p className="mt-2 text-muted">
                  Cargando movimientos Diesel...
                </p>
              </div>
            ) : errorDiesel ? (
              <Alert variant="danger">{errorDiesel}</Alert>
            ) : movDiesel.length === 0 ? (
              <Alert variant="info">
                No se encontraron movimientos Diesel para esta unidad en el
                rango de fechas seleccionado.
              </Alert>
            ) : (
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
                      <th className="text-center">#</th>
                      <th className="text-center">Fecha</th>
                      <th className="text-center">Unidad</th>
                      <th className="text-end">Lts Carga</th>
                      <th className="text-end">Horómetro</th>
                      <th className="text-end">Odómetro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movDiesel.map((m, i) => (
                      <tr key={i}>
                        <td className="text-center text-muted">{i + 1}</td>
                        <td className="text-center">
                          {formatearFecha(m.FechaCarga)}
                        </td>
                        <td>{datosFila.unidad}</td>
                        <td className="text-end">
                          {(m.LitrosCarga ?? 0).toLocaleString("es-MX", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="text-end">
                          {(m.Horimetro ?? 0).toLocaleString()}
                        </td>
                        <td className="text-end">
                          {(m.Odometro ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-secondary fw-bold">
                    <tr>
                      <td colSpan={3} className="text-end">
                        Total ({movDiesel.length} movs):
                      </td>
                      <td className="text-end">
                        {totalLitros.toLocaleString("es-MX", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="text-end">
                        {totalHorometro > 0
                          ? totalHorometro.toLocaleString()
                          : "-"}
                      </td>
                      <td className="text-end">
                        {totalOdometro > 0
                          ? totalOdometro.toLocaleString()
                          : "-"}
                      </td>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            )}
          </Tab>

          {/* ══════════════════════════════════════
              PESTAÑA 2 — Mov. SP
          ══════════════════════════════════════ */}
          <Tab eventKey="sp" title="🚛 Mov. SP">
            {loadingSP ? (
              <div className="text-center py-5">
                <Spinner animation="border" role="status" />
                <p className="mt-2 text-muted">Cargando movimientos SP...</p>
              </div>
            ) : errorSP ? (
              <Alert variant="danger">{errorSP}</Alert>
            ) : movSP.length === 0 ? (
              <Alert variant="info">
                No se encontraron movimientos SP para esta unidad en el rango de
                fechas seleccionado.
              </Alert>
            ) : (
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
                      <th className="text-center">#</th>
                      <th className="text-center">Fecha</th>
                      <th className="text-center">Unidad</th>
                      <th className="text-end">Carga (m³)</th>
                      <th>Remisión</th>
                      <th>Producto</th>
                      <th>Cliente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movSP.map((m, i) => (
                      <tr key={i}>
                        <td className="text-center text-muted">{i + 1}</td>
                        <td className="text-center">
                          {formatearFecha(m.FechaInicio)}
                        </td>
                        <td>{datosFila.unidad}</td>
                        <td className="text-end">
                          {(m.CargaViaje ?? 0).toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td>{m.Remision}</td>
                        <td>{m.NombreProducto}</td>
                        <td>{m.NombreCliente}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-secondary fw-bold">
                    <tr>
                      <td colSpan={3} className="text-end">
                        Total ({movSP.length} viajes):
                      </td>
                      <td className="text-end">
                        {totalM3.toLocaleString("es-MX", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        m³
                      </td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
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

      <style>{`
        .modal-backdrop-blur {
          backdrop-filter: blur(5px);
          background-color: rgba(0, 0, 0, 0.5) !important;
        }
      `}</style>
    </Modal>
  );
}
