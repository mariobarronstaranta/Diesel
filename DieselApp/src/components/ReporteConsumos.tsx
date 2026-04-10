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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ComboCveCiudad from "./ComboCveCiudad";
import ComboTanquePorCiudad from "./ComboTanquePorCiudad";
import ComboUnidades from "./ComboUnidades";
import { supabase } from "../supabase/client";
import logoUrl from "../assets/images/logo.png";
import type {
  ReporteConsumosData,
  ReporteConsumosForm,
} from "../types/reportes.types";
import ReporteConsumosDetalleModal from "./ReporteConsumosDetalleModal";

export default function ReporteConsumos() {
  const [isLoading, setIsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{
    type: "success" | "danger";
    text: string;
  } | null>(null);
  const [consumos, setConsumos] = useState<ReporteConsumosData[]>([]);
  const [cveCiudadSeleccionada, setCveCiudadSeleccionada] =
    useState<string>("");

  // Estados para el modal de detalle
  const [showDetalle, setShowDetalle] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState<{
    fecha: string;
    ciudad: string;
    tanque: string;
    idTanque: number;
    idUnidad?: number | null;
  } | null>(null);
  const [lastQueryParams, setLastQueryParams] =
    useState<ReporteConsumosForm | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReporteConsumosForm>({
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  // Observar cambios para actualizar los combos en cascada
  const cveCiudad = watch("CveCiudad");
  const idTanqueWatch = watch("IDTanque");

  // Al cambiar la ciudad: resetear Tanque y Unidad
  useEffect(() => {
    setCveCiudadSeleccionada(cveCiudad || "");
    setValue("IDTanque", "");
    setValue("IDUnidad", "");
  }, [cveCiudad, setValue]);

  // Al cambiar el tanque: resetear Unidad
  useEffect(() => {
    setValue("IDUnidad", "");
  }, [idTanqueWatch, setValue]);

  // Formatear fecha para mostrar en la tabla
  const formatearFecha = (fecha: string) => {
    // Parsear como hora local (sin Z) para evitar el desfase UTC→CST
    const date = new Date(fecha + "T00:00:00");
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Formatear números con separadores de miles
  const formatearNumero = (numero: number) => {
    return numero.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const abrirDetalle = (consumo: ReporteConsumosData) => {
    setFilaSeleccionada({
      fecha: consumo.fecha, // Pasar fecha en formato ISO (yyyy-MM-dd) para Supabase
      ciudad: consumo.ciudad,
      tanque: consumo.tanque,
      idTanque: consumo.idTanque,
      idUnidad: lastQueryParams?.IDUnidad ? parseInt(lastQueryParams.IDUnidad) : null,
    });
    setShowDetalle(true);
  };

  const onSubmit = async (data: ReporteConsumosForm) => {
    try {
      setIsLoading(true);
      setAlertMessage(null);
      setLastQueryParams(data);

      console.log("Consultando consumos:", {
        p_fecha_inicio: data.FechaInicial,
        p_fecha_fin: data.FechaFinal,
        p_cve_ciudad: data.CveCiudad || null,
        p_id_tanque: data.IDTanque ? parseInt(data.IDTanque) : null,
        p_id_unidad: data.IDUnidad ? parseInt(data.IDUnidad) : null,
      });

      // Llamar a la función RPC de Supabase
      const { data: result, error } = await supabase.rpc(
        "get_reporte_consumos",
        {
          p_fecha_inicio: data.FechaInicial,
          p_fecha_fin: data.FechaFinal,
          p_cve_ciudad: data.CveCiudad || null,
          p_id_tanque: data.IDTanque ? parseInt(data.IDTanque) : null,
          p_id_unidad: data.IDUnidad ? parseInt(data.IDUnidad) : null,
        },
      );

      if (error) {
        throw error;
      }

      console.log("Resultado de Supabase RPC:", result);

      if (Array.isArray(result)) {
        setConsumos(result);
        if (result.length === 0) {
          setAlertMessage({
            type: "success",
            text: "No se encontraron consumos para los filtros seleccionados",
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
          text: "Error al obtener los consumos",
        });
      }
    } catch (error: unknown) {
      console.error("Error al consultar consumos:", error);
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
    if (consumos.length === 0) return;

    // Calcular totales
    const totalEntradas = consumos.reduce(
      (sum, c) => sum + Number(c.totalEntradas),
      0,
    );
    const totalSalidas = consumos.reduce(
      (sum, c) => sum + Number(c.totalSalidas),
      0,
    );

    // Definir encabezados
    const headers = [
      "Fecha",
      "Ciudad",
      "Tanque",
      "Total Entradas",
      "Total Salidas",
    ];

    // Convertir datos a formato CSV
    const csvContent = [
      headers.join(","), // Encabezado
      ...consumos.map((c) =>
        [
          `"${formatearFecha(c.fecha)}"`,
          `"${c.ciudad}"`,
          `"${c.tanque}"`,
          Number(c.totalEntradas).toFixed(2),
          Number(c.totalSalidas).toFixed(2),
        ].join(","),
      ),
      // Agregar fila de totales
      [
        `"TOTALES"`,
        `""`,
        `""`,
        totalEntradas.toFixed(2),
        totalSalidas.toFixed(2),
      ].join(","),
    ].join("\n");

    // Crear Blob y descargar
    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `consumos_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportarPDF = async () => {
    if (consumos.length === 0) return;

    const doc = new jsPDF("landscape");
    
    // Función auxiliar para cargar imagen
    const loadLogo = (): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = logoUrl;
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
      });
    };

    try {
      const logo = await loadLogo();
      const ratio = logo.width / logo.height;
      const logoHeight = 12;
      const logoWidth = logoHeight * ratio;
      const pdfWidth = doc.internal.pageSize.getWidth();
      doc.addImage(logo, "PNG", pdfWidth - 14 - logoWidth, 10, logoWidth, logoHeight);
    } catch (err) {
      console.error("Error cargando logo en PDF", err);
    }

    // Cabecera Corporativa
    doc.setFontSize(22);
    doc.setTextColor(52, 58, 64);
    doc.setFont("helvetica", "bold");
    doc.text("Reporte de Consumos", 14, 20);
    
    // Línea separadora amarilla
    doc.setDrawColor(240, 173, 78);
    doc.setLineWidth(1.5);
    doc.line(14, 24, doc.internal.pageSize.getWidth() - 14, 24);
    
    // Filtros
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(108, 117, 125);
    const ciudad = lastQueryParams?.CveCiudad || "Todas";
    const fInicio = lastQueryParams?.FechaInicial ? formatearFecha(lastQueryParams.FechaInicial) : "";
    const fFinal = lastQueryParams?.FechaFinal ? formatearFecha(lastQueryParams.FechaFinal) : "";
    
    doc.text(`Filtros:`, 14, 30);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(52, 58, 64);
    
    doc.text(`Ciudad:`, 30, 30);
    doc.setFont("helvetica", "normal");
    doc.text(ciudad, 43, 30);
    
    doc.setFont("helvetica", "bold");
    doc.text(`Desde:`, 75, 30);
    doc.setFont("helvetica", "normal");
    doc.text(fInicio, 88, 30);
    
    doc.setFont("helvetica", "bold");
    doc.text(`Hasta:`, 115, 30);
    doc.setFont("helvetica", "normal");
    doc.text(fFinal, 126, 30);
    
    const tableColumn = ["Fecha", "Ciudad", "Tanque", "Total Entradas (lts)", "Total Salidas (lts)"];
    const tableRows = consumos.map(c => [
      formatearFecha(c.fecha),
      c.ciudad,
      c.tanque,
      formatearNumero(Number(c.totalEntradas)),
      formatearNumero(Number(c.totalSalidas))
    ]);

    // Calcular totales localmente para el PDF
    const tEntradas = consumos.reduce((sum, c) => sum + Number(c.totalEntradas), 0);
    const tSalidas = consumos.reduce((sum, c) => sum + Number(c.totalSalidas), 0);
    
    // Anexar fila de totales
    tableRows.push([
      "TOTALES", "", "",
       formatearNumero(tEntradas),
       formatearNumero(tSalidas)
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      styles: { 
        fontSize: 10, 
        cellPadding: 4,
        valign: 'middle'
      },
      headStyles: { 
        fillColor: [52, 58, 64],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [244, 246, 251]
      },
      columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'left' },
        2: { halign: 'left' },
        3: { halign: 'right' },
        4: { halign: 'right', fontStyle: 'bold', textColor: [52, 58, 64] }
      },
      didParseCell: function(data) {
        // Estilizar fila de totales (ultima fila)
        if (data.row.index === tableRows.length - 1) {
          data.cell.styles.fillColor = [230, 230, 230];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [52, 58, 64];
        }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 35;
    
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(14, finalY + 10, doc.internal.pageSize.getWidth() - 14, finalY + 10);
    
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes()); 
    const timestamp = `${now.getFullYear()}-${month}-${day} ${hours}:${minutes}`;
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150, 150, 150);
    doc.text(`Generado desde DieselApp el ${timestamp}`, 14, finalY + 15);

    const safeDate = `${now.getFullYear()}${month}${day}`;
    doc.save(`Reporte_Consumos_${safeDate}.pdf`);
  };

  // Calcular totales para mostrar en la tabla
  const totalEntradas = consumos.reduce(
    (sum, c) => sum + Number(c.totalEntradas),
    0,
  );
  const totalSalidas = consumos.reduce(
    (sum, c) => sum + Number(c.totalSalidas),
    0,
  );

  return (
    <Container fluid className="p-3">
      <h4 className="text-center mb-4">Reporte de Consumos</h4>

      {/* Mensaje de alerta */}
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
              <Col lg={2} md={6} className="mb-3 mb-lg-0">
                <ComboCveCiudad register={register} error={errors.CveCiudad} />
              </Col>

              <Col lg={2} md={6} className="mb-3 mb-lg-0">
                <ComboTanquePorCiudad
                  cveCiudad={cveCiudadSeleccionada || null}
                  register={register}
                  error={errors.IDTanque}
                  optional={true}
                />
              </Col>

              <Col lg={2} md={6} className="mb-3 mb-lg-0">
                <ComboUnidades
                  cveCiudad={cveCiudadSeleccionada}
                  register={register}
                  error={errors.IDUnidad}
                  optional={true}
                  idTanque={idTanqueWatch || null}
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

      {/* Tabla de resultados */}
      {consumos.length > 0 && (
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center bg-white">
            <h5 className="mb-0">Resultados</h5>
            <div>
              <Button variant="success" size="sm" onClick={exportarCSV} className="me-2">
                Exportar CSV
              </Button>
              <Button variant="danger" size="sm" onClick={exportarPDF}>
                Exportar PDF
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table striped bordered hover className="table-corporate">
                <thead>
                  <tr>
                    <th className="text-center">Fecha</th>
                    <th className="text-center">Ciudad</th>
                    <th className="text-center">Tanque</th>
                    <th className="text-center">Total Entradas</th>
                    <th className="text-center">Total Salidas</th>
                    <th className="text-center">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {consumos.map((consumo, index) => (
                    <tr key={index}>
                      <td className="text-center">
                        {formatearFecha(consumo.fecha)}
                      </td>
                      <td>{consumo.ciudad}</td>
                      <td>{consumo.tanque}</td>
                      <td className="text-end">
                        {formatearNumero(Number(consumo.totalEntradas))}
                      </td>
                      <td className="text-end">
                        {formatearNumero(Number(consumo.totalSalidas))}
                      </td>
                      <td className="text-center">
                        <Button
                          variant="outline-corporate"
                          size="sm"
                          onClick={() => abrirDetalle(consumo)}
                        >
                          Detalle
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {/* Fila de totales */}
                  <tr
                    style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}
                  >
                    <td colSpan={3} className="text-end">
                      TOTALES:
                    </td>
                    <td className="text-end">
                      {formatearNumero(totalEntradas)}
                    </td>
                    <td className="text-end">
                      {formatearNumero(totalSalidas)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      <ReporteConsumosDetalleModal
        show={showDetalle}
        onHide={() => setShowDetalle(false)}
        datosFila={filaSeleccionada}
      />
    </Container>
  );
}
