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

  const formatearHora = (hora: string | undefined | null) => {
    if (!hora) return "00:00";
    const partes = hora.split(":");
    return `${partes[0]?.padStart(2, "0") || "00"}:${partes[1]?.padStart(2, "0") || "00"}`;
  };

  const getTimestamp = (fecha: string, hora?: string | null) => {
    if (!fecha) return 0;
    
    let year = "1970", month = "01", day = "01";
    if (fecha.includes("/")) {
      const parte = fecha.split(" ")[0];
      const [m, d, y] = parte.split("/");
      year = y; month = m.padStart(2, "0"); day = d.padStart(2, "0");
    } else {
      const parte = fecha.split("T")[0];
      const [y, m, d] = parte.split("-");
      year = y; month = m.padStart(2, "0"); day = d.padStart(2, "0");
    }

    let hh = "12", mm = "00", ss = "00";
    if (hora) {
      const parts = hora.split(":");
      hh = parts[0]?.padStart(2, "0") || "00";
      mm = parts[1]?.padStart(2, "0") || "00";
      ss = (parts[2] || "00").substring(0, 2).padStart(2, "0");
    }

    return new Date(`${year}-${month}-${day}T${hh}:${mm}:${ss}`).getTime();
  };

  const cargarMovDiesel = async () => {
    if (!datosFila || !datosFila.idUnidad) return;
    setLoadingDiesel(true);
    setErrorDiesel(null);
    try {
      const { data, error } = await supabase
        .from("TanqueMovimiento")
        .select("FechaCarga, HoraCarga, LitrosCarga, Horimetro, Odometro")
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
          "FechaInicio, HoraInicio, NombreUnidad, CargaViaje, Remision, NombreProducto, NombreCliente",
        )
        .eq("IDUnidad", datosFila.idUnidad);

      if (error) throw error;

      const inicioNum = new Date(`${datosFila.fechaInicio}T00:00:00`).getTime();
      const finNum = new Date(`${datosFila.fechaFin}T23:59:59`).getTime();

      const filtered = ((data as ProductividadMovSP[]) || []).filter((m) => {
        if (!m.FechaInicio) return false;
        const recordDateNum = getTimestamp(m.FechaInicio, m.HoraInicio);
        return recordDateNum >= inicioNum && recordDateNum <= finNum;
      });

      // Ordenar por fecha y hora cronológicamente
      filtered.sort((a, b) => {
        return getTimestamp(a.FechaInicio, a.HoraInicio) - getTimestamp(b.FechaInicio, b.HoraInicio);
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

  // ══════════════════════════════════════
  //    CORRELACIÓN (Productividad por Carga)
  // ══════════════════════════════════════
  const productividadCargas = [];
  
  if (movDiesel.length > 0) {
    for (let i = 0; i < movDiesel.length; i++) {
      const cargaActual = movDiesel[i];
      const timeA = getTimestamp(cargaActual.FechaCarga, cargaActual.HoraCarga);
      
      let timeB = Infinity;
      let odometroFin = cargaActual.Odometro ?? 0;
      let horometroFin = cargaActual.Horimetro ?? 0;

      if (i < movDiesel.length - 1) {
         const cargaSiguiente = movDiesel[i + 1];
         timeB = getTimestamp(cargaSiguiente.FechaCarga, cargaSiguiente.HoraCarga);
         odometroFin = cargaSiguiente.Odometro ?? cargaActual.Odometro ?? 0;
         horometroFin = cargaSiguiente.Horimetro ?? cargaActual.Horimetro ?? 0;
      } else {
         if (movSP.length > 0) {
            const ultimoViaje = movSP[movSP.length - 1];
            timeB = getTimestamp(ultimoViaje.FechaInicio, ultimoViaje.HoraInicio) + 1;
         }
      }

      const viajesEnLapso = movSP.filter(viaje => {
        const timeViaje = getTimestamp(viaje.FechaInicio, viaje.HoraInicio);
        return timeViaje >= timeA && timeViaje < timeB;
      });

      const cantViajes = viajesEnLapso.length;
      const m3Movidos = viajesEnLapso.reduce((sum, v) => sum + (v.CargaViaje ?? 0), 0);
      const remisionesStr = viajesEnLapso.map(v => v.Remision).filter(Boolean).join(", ");
      
      let kmsRecorridos = odometroFin - (cargaActual.Odometro ?? 0);
      let hrsTrabajadas = horometroFin - (cargaActual.Horimetro ?? 0);
      
      if (kmsRecorridos < 0) kmsRecorridos = 0;
      if (hrsTrabajadas < 0) hrsTrabajadas = 0;

      const litros = cargaActual.LitrosCarga ?? 0;
      const kmsLt = litros > 0 ? (kmsRecorridos / litros) : 0;
      const hrsLt = litros > 0 ? (hrsTrabajadas / litros) : 0;

      productividadCargas.push({
        num: i + 1,
        fecha: cargaActual.FechaCarga,
        hora: formatearHora(cargaActual.HoraCarga),
        litros: litros,
        viajes: cantViajes,
        m3: m3Movidos,
        remisiones: remisionesStr,
        kms: kmsRecorridos,
        hrs: hrsTrabajadas,
        kmsLt,
        hrsLt
      });
    }
  }

  const totalProdkms = productividadCargas.reduce((sum, c) => sum + c.kms, 0);
  const totalProdHrs = productividadCargas.reduce((sum, c) => sum + c.hrs, 0);
  const totalProdZ = totalLitros > 0 ? totalProdkms / totalLitros : 0;
  const totalProdH = totalLitros > 0 ? totalProdHrs / totalLitros : 0;

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
                          {formatearFecha(m.FechaCarga)} {formatearHora(m.HoraCarga)}
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
                          {formatearFecha(m.FechaInicio)} {formatearHora(m.HoraInicio)}
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

          {/* ══════════════════════════════════════
              PESTAÑA 3 — Productividad por Carga
          ══════════════════════════════════════ */}
          <Tab eventKey="prod" title="📊 Productividad por Carga">
            {loadingDiesel || loadingSP ? (
              <div className="text-center py-5">
                <Spinner animation="border" role="status" />
                <p className="mt-2 text-muted">Correlacionando datos...</p>
              </div>
            ) : errorDiesel || errorSP ? (
              <Alert variant="danger">
                Hubo un error al cargar datos y no se puede calcular la productividad.
              </Alert>
            ) : productividadCargas.length === 0 ? (
              <Alert variant="info">
                No hay recargas de Diésel registradas en este periodo para calcular productividad.
              </Alert>
            ) : (
              <div className="table-responsive">
                <Table
                  striped
                  bordered
                  hover
                  size="sm"
                  className="mb-0 table-corporate align-middle"
                >
                  <thead>
                    <tr>
                      <th className="text-center">#</th>
                      <th className="text-center">Fecha/Hora Carga</th>
                      <th className="text-end">Lt Carga</th>
                      <th className="text-center">Viajes</th>
                      <th className="text-center">Remisiones</th>
                      <th className="text-end">m³ Movidos</th>
                      <th className="text-end">Kms Recorridos</th>
                      <th className="text-end">Kms/Lt</th>
                      <th className="text-end">Hrs Trabajadas</th>
                      <th className="text-end">Hrs/Lt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productividadCargas.map((c, i) => (
                      <tr key={i}>
                        <td className="text-center text-muted fw-bold">{c.num}</td>
                        <td className="text-center">
                          {formatearFecha(c.fecha)} {c.hora}
                        </td>
                        <td className="text-end fw-bold text-primary">
                          {c.litros.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-center">
                          {c.viajes > 0 ? (
                            <span className="badge bg-success rounded-pill px-3">{c.viajes}</span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="text-center text-muted small" style={{ maxWidth: '200px', wordWrap: 'break-word', whiteSpace: 'normal' }}>
                          {c.remisiones || "-"}
                        </td>
                        <td className="text-end">
                          {c.m3 > 0 ? c.m3.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}
                        </td>
                        <td className="text-end">
                          {c.kms > 0 ? c.kms.toLocaleString() : "-"}
                        </td>
                        <td className="text-end text-success fw-bold">
                          {c.kmsLt > 0 ? c.kmsLt.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}
                        </td>
                        <td className="text-end">
                          {c.hrs > 0 ? c.hrs.toLocaleString() : "-"}
                        </td>
                        <td className="text-end text-info fw-bold">
                          {c.hrsLt > 0 ? c.hrsLt.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-secondary fw-bold">
                    <tr>
                      <td colSpan={2} className="text-end">Totales de Productividad:</td>
                      <td className="text-end">
                        {totalLitros.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="text-center">{productividadCargas.reduce((sum, c) => sum + c.viajes, 0)}</td>
                      <td className="text-center">-</td>
                      <td className="text-end">{productividadCargas.reduce((sum, c) => sum + c.m3, 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="text-end">{totalProdkms.toLocaleString()}</td>
                      <td className="text-end">{totalProdZ.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="text-end">{totalProdHrs.toLocaleString()}</td>
                      <td className="text-end">{totalProdH.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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
