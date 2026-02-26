import {
  Container,
  Card,
  Form,
  Button,
  Row,
  Col,
  Alert,
  Table,
  Spinner,
  Badge,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import ComboCveCiudad from "./ComboCveCiudad";
import ComboTanquePorCiudad from "./ComboTanquePorCiudad";
import { supabase } from "../supabase/client";
import type {
  ReporteProductividadData,
  ReporteProductividadForm,
} from "../types/reportes.types";

export default function ReporteProductividad() {
  const [isLoading, setIsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{
    type: "success" | "danger" | "warning";
    text: string;
  } | null>(null);
  const [reporteData, setReporteData] = useState<ReporteProductividadData[]>(
    [],
  );
  const [cveCiudadSeleccionada, setCveCiudadSeleccionada] =
    useState<string>("");
  const [lastQueryParams, setLastQueryParams] =
    useState<ReporteProductividadForm | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ReporteProductividadForm>({
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const cveCiudad = watch("CveCiudad");

  useEffect(() => {
    setCveCiudadSeleccionada(cveCiudad || "");
  }, [cveCiudad]);

  const formatearNumero = (
    numero: number | null | undefined,
    enteros = false,
  ) => {
    if (numero === null || numero === undefined || Number(numero) === 0)
      return "-";
    return Number(numero).toLocaleString("es-MX", {
      minimumFractionDigits: enteros ? 0 : 2,
      maximumFractionDigits: enteros ? 0 : 2,
    });
  };

  const onSubmit = async (data: ReporteProductividadForm) => {
    try {
      setIsLoading(true);
      setAlertMessage(null);
      setLastQueryParams(data);

      const { data: result, error } = await supabase.rpc(
        "reporte_productividad",
        {
          p_fecha_inicio: data.FechaInicial,
          p_fecha_fin: data.FechaFinal,
          p_cve_ciudad: data.CveCiudad || null,
          p_id_tanque: data.IDTanque ? parseInt(data.IDTanque) : null,
        },
      );

      if (error) {
        throw error;
      }

      if (Array.isArray(result)) {
        setReporteData(result);
        if (result.length === 0) {
          setAlertMessage({
            type: "warning",
            text: "No se encontraron datos de productividad para los filtros seleccionados",
          });
        } else {
          setAlertMessage({
            type: "success",
            text: `Se procesaron ${result.length} unidades`,
          });
        }
      } else {
        setAlertMessage({
          type: "danger",
          text: "Error al obtener los datos de productividad",
        });
      }
    } catch (error: unknown) {
      console.error("Error al consultar productividad:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error de conexión con el servidor";
      setAlertMessage({
        type: "danger",
        text: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportarCSV = () => {
    if (reporteData.length === 0) return;

    const headers = [
      "Estado",
      "Unidad",
      "Tanque",
      "Lts Totales",
      "Kms Totales",
      "Hrs Totales",
      "Carga Total Viajes",
      "Lts/M3 (Costo)",
      "M3/Viaje (Capacidad)",
      "Km/Lts (Rend.)",
    ];

    const csvContent = [
      headers.join(","),
      ...reporteData.map((r) =>
        [
          `"${r.EstadoRegistro}"`,
          `"${r.Unidad}"`,
          `"${r.Tanque}"`,
          Number(r["Litros Consumidos"] || 0).toFixed(2),
          Number(r["Kms Totales"] || 0).toFixed(0),
          Number(r["Hrs Totales"] || 0).toFixed(0),
          Number(r.MetrosCubicos || 0).toFixed(2),
          Number(r["Lts/M3"] || 0).toFixed(4),
          Number(r["M3/Viaje"] || 0).toFixed(4),
          Number(r["Km/Lts"] || 0).toFixed(4),
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
      `productividad_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Lógica de Semáforos
  const determinarClaseCelda = (
    valor: number,
    metrica: "lts_m3" | "km_lts",
  ) => {
    if (!valor) return "";
    if (metrica === "lts_m3") {
      // Si gasta más de 5 litros por metro cúbico transportado, es crítico (Ajustar umbral según negocio)
      if (valor > 5) return "bg-danger text-white fw-bold";
      // Si gasta más de 3.5, es advertencia
      if (valor > 3.5) return "bg-warning text-dark fw-bold";
      return "bg-success text-white fw-bold";
    }
    if (metrica === "km_lts") {
      // Rendimiento mecánico pobre
      if (valor < 1.0) return "bg-danger text-white fw-bold";
      return "";
    }
    return "";
  };

  return (
    <Container fluid className="p-3">
      <h4 className="text-center mb-4">
        Reporte de Productividad y Rentabilidad
      </h4>

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
                      required: "Dato requerido",
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
                      required: "Dato requerido",
                      validate: (value, formValues) => {
                        if (
                          formValues.FechaInicial &&
                          value &&
                          value < formValues.FechaInicial
                        ) {
                          return "La fecha final no puede ser menor a la inicial";
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

      {reporteData.length > 0 && lastQueryParams && (
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center bg-white">
            <h5 className="mb-0">
              Rendimiento por CR (
              {lastQueryParams.CveCiudad || "Todas las Ciudades"} | Tanque{" "}
              {lastQueryParams.IDTanque || "Todos"} | del{" "}
              {lastQueryParams.FechaInicial} al {lastQueryParams.FechaFinal})
            </h5>
            <Button variant="success" size="sm" onClick={exportarCSV}>
              Exportar CSV
            </Button>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table striped bordered className="table-corporate align-middle">
                <thead>
                  <tr className="bg-light">
                    <th>Unidad</th>
                    <th>Tanque</th>
                    <th className="text-center">Lts Totales</th>
                    <th className="text-center">Kms Totales</th>
                    <th className="text-center">Hrs Totales</th>
                    <th
                      className="text-center"
                      title="Metros cúbicos entregados por el total de viajes"
                    >
                      Carga Total Viajes
                    </th>
                    <th
                      className="text-center bg-opacity-10 bg-info"
                      title="Costo energético: Litros gastados para mover 1 metro cúbico"
                    >
                      Lts / M3
                    </th>
                    <th
                      className="text-center"
                      title="Eficiencia de asignación: Metros cúbicos promedio por viaje"
                    >
                      M3 / Viaje
                    </th>
                    <th
                      className="text-center"
                      title="Rendimiento mecánico tradicional"
                    >
                      Km / Lts
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reporteData.map((r, index) => {
                    const noRegistrada = r.EstadoRegistro === "No Registrada";
                    return (
                      <tr
                        key={index}
                        className={noRegistrada ? "table-warning" : ""}
                      >
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="fw-bold me-2">{r.Unidad}</span>
                            {noRegistrada && (
                              <OverlayTrigger
                                placement="top"
                                overlay={
                                  <Tooltip id={`tooltip-${index}`}>
                                    Esta unidad generó viajes pero no existe en
                                    el catálogo de la App.
                                  </Tooltip>
                                }
                              >
                                <Badge bg="danger" pill>
                                  No Registrada
                                </Badge>
                              </OverlayTrigger>
                            )}
                          </div>
                        </td>
                        <td>{r.Tanque}</td>
                        <td className="text-center text-muted">
                          {noRegistrada
                            ? "-"
                            : `${formatearNumero(r["Litros Consumidos"])} L`}
                        </td>
                        <td className="text-center align-middle">
                          {noRegistrada
                            ? "-"
                            : formatearNumero(r["Kms Totales"], true)}
                        </td>
                        <td className="text-center align-middle">
                          {noRegistrada
                            ? "-"
                            : formatearNumero(r["Hrs Totales"], true)}
                        </td>
                        <td className="text-center">
                          <strong>{formatearNumero(r.MetrosCubicos)} m³</strong>
                          <div className="text-muted small">
                            {r.Viajes} viajes
                          </div>
                        </td>
                        <td
                          className={`text-center align-middle ${determinarClaseCelda(r["Lts/M3"], "lts_m3")}`}
                        >
                          {noRegistrada ? "-" : formatearNumero(r["Lts/M3"])}
                        </td>
                        <td className="text-center align-middle">
                          {formatearNumero(r["M3/Viaje"])}
                        </td>
                        <td
                          className={`text-center align-middle ${determinarClaseCelda(r["Km/Lts"], "km_lts")}`}
                        >
                          {noRegistrada ? "-" : formatearNumero(r["Km/Lts"])}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
            <div className="mt-3 small text-muted">
              <strong>Nota sobre Semáforos (Lts/M3):</strong> Rojo indica un
              consumo mayor a 5 l/m³. Amarillo entre 3.5 y 5 l/m³. Verde menor a
              3.5 l/m³. <em>Esto es personalizable.</em>
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}
