import {
  Container,
  Card,
  Form,
  Button,
  Row,
  Col,
  Alert,
  Spinner,
} from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import ComboCveCiudad from "./ComboCveCiudad";
import ComboTanquePorCiudad from "./ComboTanquePorCiudad";
import { supabase } from "../supabase/client";
import type { ReporteConsumosData } from "../types/reportes.types";
import type { ReporteRendimientosData } from "../types/reportes.types";
import type {
  DashboardFilters,
  KpiData,
  ConsumoDiario,
  ConsumoTanque,
  RendimientoUnidad,
} from "../types/dashboard.types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{
    type: "success" | "danger";
    text: string;
  } | null>(null);
  const [cveCiudadSeleccionada, setCveCiudadSeleccionada] =
    useState<string>("");
  const [hasData, setHasData] = useState(false);

  // Dashboard data
  const [kpis, setKpis] = useState<KpiData>({
    totalEntradas: 0,
    totalSalidas: 0,
    balance: 0,
    promedioRendimiento: 0,
  });
  const [consumosDiarios, setConsumosDiarios] = useState<ConsumoDiario[]>([]);
  const [consumosTanque, setConsumosTanque] = useState<ConsumoTanque[]>([]);
  const [rendimientos, setRendimientos] = useState<RendimientoUnidad[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DashboardFilters>({
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const cveCiudad = watch("CveCiudad");

  useEffect(() => {
    setCveCiudadSeleccionada(cveCiudad || "");
  }, [cveCiudad]);

  const formatearNumero = (numero: number, decimales = 2) => {
    return numero.toLocaleString("es-MX", {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
    });
  };

  const formatearFechaCorta = (fecha: string) => {
    const date = new Date(fecha + "T00:00:00");
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
    });
  };

  const onSubmit = async (data: DashboardFilters) => {
    try {
      setIsLoading(true);
      setAlertMessage(null);
      setHasData(false);

      // Call both RPCs in parallel
      const [consumosRes, rendimientosRes] = await Promise.all([
        supabase.rpc("get_reporte_consumos", {
          p_fecha_inicio: data.FechaInicial,
          p_fecha_fin: data.FechaFinal,
          p_cve_ciudad: data.CveCiudad || null,
          p_id_tanque: data.IDTanque ? parseInt(data.IDTanque) : null,
        }),
        supabase.rpc("reporte_rendimientos", {
          p_fecha_inicio: data.FechaInicial,
          p_fecha_fin: data.FechaFinal,
          p_cve_ciudad: data.CveCiudad || null,
          p_id_tanque: data.IDTanque ? parseInt(data.IDTanque) : null,
        }),
      ]);

      if (consumosRes.error) throw consumosRes.error;
      if (rendimientosRes.error) throw rendimientosRes.error;

      const consumosData = consumosRes.data as ReporteConsumosData[];
      const rendimientosData =
        rendimientosRes.data as ReporteRendimientosData[];

      // === Process KPIs ===
      const totalEntradas = consumosData.reduce(
        (sum, c) => sum + Number(c.totalEntradas),
        0,
      );
      const totalSalidas = consumosData.reduce(
        (sum, c) => sum + Number(c.totalSalidas),
        0,
      );

      const rendimientosConKms = rendimientosData.filter(
        (r) => r["Kms/Lts"] != null && r["Kms/Lts"] > 0,
      );
      const promedioRendimiento =
        rendimientosConKms.length > 0
          ? rendimientosConKms.reduce(
              (sum, r) => sum + Number(r["Kms/Lts"]),
              0,
            ) / rendimientosConKms.length
          : 0;

      setKpis({
        totalEntradas,
        totalSalidas,
        balance: totalEntradas - totalSalidas,
        promedioRendimiento,
      });

      // === Process daily consumption for area chart ===
      const dailyMap = new Map<string, { entradas: number; salidas: number }>();
      consumosData.forEach((c) => {
        const existing = dailyMap.get(c.fecha) || { entradas: 0, salidas: 0 };
        existing.entradas += Number(c.totalEntradas);
        existing.salidas += Number(c.totalSalidas);
        dailyMap.set(c.fecha, existing);
      });

      const dailyArray = Array.from(dailyMap.entries())
        .map(([fecha, vals]) => ({
          fecha,
          entradas: vals.entradas,
          salidas: vals.salidas,
        }))
        .sort((a, b) => a.fecha.localeCompare(b.fecha));
      setConsumosDiarios(dailyArray);

      // === Process consumption by tank for bar chart ===
      const tankMap = new Map<string, { entradas: number; salidas: number }>();
      consumosData.forEach((c) => {
        const existing = tankMap.get(c.tanque) || { entradas: 0, salidas: 0 };
        existing.entradas += Number(c.totalEntradas);
        existing.salidas += Number(c.totalSalidas);
        tankMap.set(c.tanque, existing);
      });

      const tankArray = Array.from(tankMap.entries())
        .map(([tanque, vals]) => ({
          tanque,
          entradas: vals.entradas,
          salidas: vals.salidas,
        }))
        .sort((a, b) => b.salidas - a.salidas);
      setConsumosTanque(tankArray);

      // === Process top units by efficiency ===
      const topUnidades = rendimientosData
        .filter((r) => r["Kms/Lts"] != null && r["Kms/Lts"] > 0)
        .map((r) => ({
          unidad: r.Unidad,
          kmsLts: Number(r["Kms/Lts"]),
        }))
        .sort((a, b) => b.kmsLts - a.kmsLts)
        .slice(0, 10);
      setRendimientos(topUnidades);

      setHasData(true);

      if (consumosData.length === 0 && rendimientosData.length === 0) {
        setAlertMessage({
          type: "success",
          text: "No se encontraron datos para los filtros seleccionados",
        });
        setHasData(false);
      }
    } catch (error: unknown) {
      console.error("Error al consultar dashboard:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error de conexión con el servidor";
      setAlertMessage({ type: "danger", text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // Colors for charts
  const COLORS_BAR = ["#f0ad4e", "#e8913a", "#d4782e", "#c06022", "#a84818"];

  return (
    <Container fluid className="p-3">
      <h4 className="text-center mb-4">Dashboard</h4>

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

      {/* Filtros */}
      <Form noValidate onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-4">
          <Card.Body>
            <Row className="align-items-start">
              <Col lg={3} md={6} className="mb-3 mb-lg-0">
                <ComboCveCiudad
                  register={register}
                  error={errors.CveCiudad}
                  optional
                />
              </Col>
              <Col lg={3} md={6} className="mb-3 mb-lg-0">
                <ComboTanquePorCiudad
                  cveCiudad={cveCiudadSeleccionada || null}
                  register={register}
                  error={errors.IDTanque}
                  optional
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
                        if (
                          formValues.FechaInicial &&
                          value < formValues.FechaInicial
                        ) {
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
                  variant="primary"
                  size="lg"
                  type="submit"
                  disabled={isLoading}
                  className="w-100 fw-bold"
                >
                  {isLoading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Cargando...
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

      {/* Dashboard Content */}
      {hasData && (
        <>
          {/* KPI Cards */}
          <Row className="mb-4 g-3">
            <Col sm={6} lg={3}>
              <div className="dash-kpi dash-kpi--entradas">
                <div className="dash-kpi__icon">🛢️</div>
                <div className="dash-kpi__body">
                  <span className="dash-kpi__label">Total Entradas</span>
                  <span className="dash-kpi__value">
                    {formatearNumero(kpis.totalEntradas, 0)}
                  </span>
                  <span className="dash-kpi__unit">litros</span>
                </div>
              </div>
            </Col>
            <Col sm={6} lg={3}>
              <div className="dash-kpi dash-kpi--salidas">
                <div className="dash-kpi__icon">⛽</div>
                <div className="dash-kpi__body">
                  <span className="dash-kpi__label">Total Salidas</span>
                  <span className="dash-kpi__value">
                    {formatearNumero(kpis.totalSalidas, 0)}
                  </span>
                  <span className="dash-kpi__unit">litros</span>
                </div>
              </div>
            </Col>
            <Col sm={6} lg={3}>
              <div className="dash-kpi dash-kpi--rendimiento">
                <div className="dash-kpi__icon">📊</div>
                <div className="dash-kpi__body">
                  <span className="dash-kpi__label">Rendimiento Prom.</span>
                  <span className="dash-kpi__value">
                    {formatearNumero(kpis.promedioRendimiento)}
                  </span>
                  <span className="dash-kpi__unit">Kms/Lt</span>
                </div>
              </div>
            </Col>
            <Col sm={6} lg={3}>
              <div
                className={`dash-kpi ${kpis.balance >= 0 ? "dash-kpi--balance-pos" : "dash-kpi--balance-neg"}`}
              >
                <div className="dash-kpi__icon">📈</div>
                <div className="dash-kpi__body">
                  <span className="dash-kpi__label">Balance</span>
                  <span className="dash-kpi__value">
                    {kpis.balance >= 0 ? "+" : ""}
                    {formatearNumero(kpis.balance, 0)}
                  </span>
                  <span className="dash-kpi__unit">litros</span>
                </div>
              </div>
            </Col>
          </Row>

          {/* Charts Row 1: Daily Consumption */}
          {consumosDiarios.length > 0 && (
            <Card className="mb-4 dash-chart-card">
              <Card.Header className="card-header-corporate">
                Consumo Diario — Entradas vs Salidas
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart
                    data={consumosDiarios}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="gradEntradas"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#f0ad4e"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#f0ad4e"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="gradSalidas"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#343a40"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#343a40"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="fecha"
                      tickFormatter={formatearFechaCorta}
                      tick={{ fontSize: 12 }}
                      stroke="#9ca3af"
                    />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <Tooltip
                      formatter={(value: number | undefined) => [
                        formatearNumero(value ?? 0),
                        "",
                      ]}
                      labelFormatter={(label) =>
                        formatearFechaCorta(String(label))
                      }
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="entradas"
                      name="Entradas"
                      stroke="#f0ad4e"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#gradEntradas)"
                    />
                    <Area
                      type="monotone"
                      dataKey="salidas"
                      name="Salidas"
                      stroke="#343a40"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#gradSalidas)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="dash-legend">
                  <span className="dash-legend__item">
                    <span
                      className="dash-legend__dot"
                      style={{ background: "#f0ad4e" }}
                    ></span>
                    Entradas
                  </span>
                  <span className="dash-legend__item">
                    <span
                      className="dash-legend__dot"
                      style={{ background: "#343a40" }}
                    ></span>
                    Salidas
                  </span>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Charts Row 2: Tank + Efficiency */}
          <Row className="g-3 mb-4">
            {consumosTanque.length > 0 && (
              <Col lg={6}>
                <Card className="dash-chart-card h-100">
                  <Card.Header className="card-header-corporate">
                    Consumo por Tanque
                  </Card.Header>
                  <Card.Body>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={consumosTanque}
                        margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="tanque"
                          tick={{ fontSize: 11 }}
                          stroke="#9ca3af"
                        />
                        <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                        <Tooltip
                          formatter={(value: number | undefined) => [
                            formatearNumero(value ?? 0),
                            "",
                          ]}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          }}
                        />
                        <Bar
                          dataKey="entradas"
                          name="Entradas"
                          fill="#f0ad4e"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="salidas"
                          name="Salidas"
                          fill="#343a40"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="dash-legend">
                      <span className="dash-legend__item">
                        <span
                          className="dash-legend__dot"
                          style={{ background: "#f0ad4e" }}
                        ></span>
                        Entradas
                      </span>
                      <span className="dash-legend__item">
                        <span
                          className="dash-legend__dot"
                          style={{ background: "#343a40" }}
                        ></span>
                        Salidas
                      </span>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )}

            {rendimientos.length > 0 && (
              <Col lg={6}>
                <Card className="dash-chart-card h-100">
                  <Card.Header className="card-header-corporate">
                    Top Rendimientos (Kms/Lt)
                  </Card.Header>
                  <Card.Body>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={rendimientos}
                        layout="vertical"
                        margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 11 }}
                          stroke="#9ca3af"
                        />
                        <YAxis
                          type="category"
                          dataKey="unidad"
                          width={120}
                          tick={{ fontSize: 10 }}
                          stroke="#9ca3af"
                        />
                        <Tooltip
                          formatter={(value: number | undefined) => [
                            formatearNumero(value ?? 0) + " Kms/Lt",
                            "",
                          ]}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          }}
                        />
                        <Bar
                          dataKey="kmsLts"
                          name="Kms/Lt"
                          radius={[0, 4, 4, 0]}
                        >
                          {rendimientos.map((_entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS_BAR[index % COLORS_BAR.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>
        </>
      )}
    </Container>
  );
}
