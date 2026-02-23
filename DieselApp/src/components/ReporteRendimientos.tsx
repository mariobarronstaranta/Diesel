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
} from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import ComboCveCiudad from "./ComboCveCiudad";
import ComboTanquePorCiudad from "./ComboTanquePorCiudad";
import { supabase } from "../supabase/client";
import type {
  ReporteRendimientosData,
  ReporteRendimientosForm,
} from "../types/reportes.types";
import ReporteRendimientosDetalleModal from "./ReporteRendimientosDetalleModal";

export default function ReporteRendimientos() {
  const [isLoading, setIsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{
    type: "success" | "danger";
    text: string;
  } | null>(null);
  const [rendimientos, setRendimientos] = useState<ReporteRendimientosData[]>(
    [],
  );
  const [cveCiudadSeleccionada, setCveCiudadSeleccionada] =
    useState<string>("");

  // Estados para el modal de detalle
  const [showDetalle, setShowDetalle] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState<{
    fechaInicio: string;
    fechaFin: string;
    cveCiudad: string;
    idTanque: number;
    idUnidad: number;
    tanque: string;
    unidad: string;
  } | null>(null);
  const [lastQueryParams, setLastQueryParams] =
    useState<ReporteRendimientosForm | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ReporteRendimientosForm>({
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
    if (numero === null || numero === undefined) return "0.00";
    return Number(numero).toLocaleString("es-MX", {
      minimumFractionDigits: enteros ? 0 : 2,
      maximumFractionDigits: enteros ? 0 : 2,
    });
  };

  const abrirDetalle = (r: ReporteRendimientosData) => {
    if (!lastQueryParams) return;
    setFilaSeleccionada({
      fechaInicio: lastQueryParams.FechaInicial,
      fechaFin: lastQueryParams.FechaFinal,
      cveCiudad: lastQueryParams.CveCiudad,
      idTanque: lastQueryParams.IDTanque
        ? parseInt(lastQueryParams.IDTanque)
        : 0,
      idUnidad: r.IDUnidad,
      tanque: r.Tanque,
      unidad: r.Unidad,
    });
    setShowDetalle(true);
  };

  const onSubmit = async (data: ReporteRendimientosForm) => {
    try {
      setIsLoading(true);
      setAlertMessage(null);
      setLastQueryParams(data);

      const { data: result, error } = await supabase.rpc(
        "reporte_rendimientos",
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
        setRendimientos(result);
        if (result.length === 0) {
          setAlertMessage({
            type: "success",
            text: "No se encontraron rendimientos para los filtros seleccionados",
          });
        } else {
          setAlertMessage({
            type: "success",
            text: `Se encontraron ${result.length} registros`,
          });
        }
      } else {
        setAlertMessage({
          type: "danger",
          text: "Error al obtener los rendimientos",
        });
      }
    } catch (error: unknown) {
      console.error("Error al consultar rendimientos:", error);
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
    if (rendimientos.length === 0) return;

    const headers = [
      "Tanque",
      "Unidad",
      "Carga Total",
      "Kms Recorridos",
      "Hrs Recorridos",
      "Kms/Lts",
      "Hrs/Lts",
    ];

    const csvContent = [
      headers.join(","),
      ...rendimientos.map((r) =>
        [
          `"${r.Tanque}"`,
          `"${r.Unidad}"`,
          Number(r["Carga Total"] || 0).toFixed(0),
          Number(r["Kms Recorridos"] || 0).toFixed(0),
          Number(r["Hrs Recorridos"] || 0).toFixed(0),
          Number(r["Kms/Lts"] || 0).toFixed(4),
          Number(r["Hrs/Lts"] || 0).toFixed(4),
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
      `rendimientos_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Container fluid className="p-3">
      <h4 className="text-center mb-4">Reporte de Rendimientos</h4>

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
                <ComboCveCiudad register={register} error={errors.CveCiudad} />
              </Col>

              <Col lg={3} md={6} className="mb-3 mb-lg-0">
                <ComboTanquePorCiudad
                  cveCiudad={cveCiudadSeleccionada || null}
                  register={register}
                  error={errors.IDTanque}
                />
              </Col>

              <Col lg={2} md={6} className="mb-3 mb-lg-0">
                <Form.Group>
                  <Form.Label>Fecha Inicial</Form.Label>
                  <Form.Control
                    type="date"
                    isInvalid={!!errors.FechaInicial}
                    {...register("FechaInicial")}
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

      {rendimientos.length > 0 && (
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center bg-white">
            <h5 className="mb-0">Resultados</h5>
            <Button variant="success" size="sm" onClick={exportarCSV}>
              Exportar CSV
            </Button>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table
                striped
                bordered
                hover
                className="table-corporate align-middle"
              >
                <thead>
                  <tr>
                    <th className="text-center">Tanque</th>
                    <th className="text-center">Unidad</th>
                    <th className="text-center">Carga Total</th>
                    <th className="text-center">Kms Recorridos</th>
                    <th className="text-center">Hrs Recorridos</th>
                    <th className="text-center">Kms/Lts</th>
                    <th className="text-center">Hrs/Lts</th>
                    <th className="text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {rendimientos.map((r, index) => (
                    <tr key={index}>
                      <td>{r.Tanque}</td>
                      <td>{r.Unidad}</td>
                      <td className="text-end">
                        {formatearNumero(r["Carga Total"], true)}
                      </td>
                      <td className="text-end">
                        {formatearNumero(r["Kms Recorridos"], true)}
                      </td>
                      <td className="text-end">
                        {formatearNumero(r["Hrs Recorridos"], true)}
                      </td>
                      <td className="text-end">
                        {formatearNumero(r["Kms/Lts"])}
                      </td>
                      <td className="text-end">
                        {formatearNumero(r["Hrs/Lts"])}
                      </td>
                      <td className="text-center">
                        <Button
                          variant="outline-corporate"
                          size="sm"
                          onClick={() => abrirDetalle(r)}
                        >
                          Detalle
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      <ReporteRendimientosDetalleModal
        show={showDetalle}
        onHide={() => setShowDetalle(false)}
        datosFila={filaSeleccionada}
      />
    </Container>
  );
}
