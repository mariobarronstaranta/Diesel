import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ComboCveCiudad from "./ComboCveCiudad";
import ComboTanquePorCiudad from "./ComboTanquePorCiudad";
import ComboUnidades from "./ComboUnidades";
import ReporteRendimientosDetalleModalV2 from "./ReporteRendimientosDetalleModalV2";
import { supabase } from "../supabase/client";
import logoUrl from "../assets/images/logo.png";
import type {
  ReporteRendimientosForm,
  ReporteRendimientosV2Data,
} from "../types/reportes.types";

export default function ReporteRendimientosV2() {
  // `rendimientos` guarda el resultado consolidado por unidad que devuelve la RPC v2.
  // A diferencia del reporte histórico, aquí cada renglón representa una unidad,
  // aunque esa unidad haya cargado en varios tanques durante el periodo.
  const [isLoading, setIsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{
    type: "success" | "danger";
    text: string;
  } | null>(null);
  const [rendimientos, setRendimientos] = useState<ReporteRendimientosV2Data[]>(
    [],
  );
  const [cveCiudadSeleccionada, setCveCiudadSeleccionada] =
    useState<string>("");
  const [tanqueNombre, setTanqueNombre] = useState<string>("Todos");
  const [unidadNombre, setUnidadNombre] = useState<string>("Todas");
  const [showDetalle, setShowDetalle] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState<{
    fechaInicio: string;
    fechaFin: string;
    cveCiudad: string;
    idUnidad: number;
    unidad: string;
    tanquePrincipal: string;
    tanquesUtilizados: string;
  } | null>(null);
  const [lastQueryParams, setLastQueryParams] =
    useState<ReporteRendimientosForm | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReporteRendimientosForm>({
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const cveCiudad = watch("CveCiudad");
  const idTanqueWatch = watch("IDTanque");

  useEffect(() => {
    // Cambio de ciudad = cambio de universo operativo.
    // Por eso se limpian tanque y unidad para evitar combinaciones inválidas
    // o filtros heredados de otra ciudad.
    setCveCiudadSeleccionada(cveCiudad || "");
    setValue("IDTanque", "");
    setValue("IDUnidad", "");
    setTanqueNombre("Todos");
    setUnidadNombre("Todas");
  }, [cveCiudad, setValue]);

  useEffect(() => {
    // La unidad depende del tanque seleccionado en el combo encadenado.
    // Si cambia el tanque, se limpia la unidad para forzar una selección consistente.
    setValue("IDUnidad", "");
    setUnidadNombre("Todas");
  }, [idTanqueWatch, setValue]);

  const formatearFecha = (fecha: string) => {
    const [y, m, d] = fecha.split("-");
    return `${d}/${m}/${y}`;
  };

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

  const calcularLtsHrs = (
    cargaTotal: number | null | undefined,
    hrsRecorridos: number | null | undefined,
  ) => {
    const litros = Number(cargaTotal || 0);
    const horas = Number(hrsRecorridos || 0);
    if (horas <= 0) return 0;
    return litros / horas;
  };

  const abrirDetalle = (r: ReporteRendimientosV2Data) => {
    // El modal necesita recordar los filtros originales de consulta para volver a pedir
    // el detalle con el mismo periodo/ciudad, pero ahora enfocado a una sola unidad.
    if (!lastQueryParams) return;
    setFilaSeleccionada({
      fechaInicio: lastQueryParams.FechaInicial,
      fechaFin: lastQueryParams.FechaFinal,
      cveCiudad: lastQueryParams.CveCiudad,
      idUnidad: r.IDUnidad,
      unidad: r.Unidad,
      tanquePrincipal: r["Tanque Principal"],
      tanquesUtilizados: r["Tanques Utilizados"],
    });
    setShowDetalle(true);
  };

  const onSubmit = async (data: ReporteRendimientosForm) => {
    try {
      setIsLoading(true);
      setAlertMessage(null);
      // Se guardan los filtros efectivos de la consulta para reutilizarlos después
      // en exportaciones y en el modal de detalle.
      setLastQueryParams(data);

      // Regla de negocio clave de la RPC v2:
      // - `p_id_tanque` no recorta el KPI final por tanque.
      // - solo sirve para identificar unidades objetivo que cargaron en ese tanque.
      // - el consolidado final usa todas las cargas de esas unidades en el periodo.
      const { data: result, error } = await supabase.rpc(
        "reporte_rendimientos_v2",
        {
          p_fecha_inicio: data.FechaInicial,
          p_fecha_fin: data.FechaFinal,
          p_cve_ciudad: data.CveCiudad || null,
          p_id_tanque: data.IDTanque ? parseInt(data.IDTanque) : null,
          p_id_unidad: data.IDUnidad ? parseInt(data.IDUnidad) : null,
        },
      );

      if (error) throw error;

      if (Array.isArray(result)) {
        // La UI solo consume el consolidado ya calculado por SQL.
        // No recalcula Kms/Lts ni Hrs/Lts en frontend para evitar divergencias
        // entre pantalla, CSV, PDF y la lógica de base de datos.
        setRendimientos(result);
        setAlertMessage({
          type: "success",
          text:
            result.length === 0
              ? "No se encontraron rendimientos consolidados para los filtros seleccionados"
              : `Se encontraron ${result.length} registros consolidados`,
        });
      } else {
        setAlertMessage({
          type: "danger",
          text: "Error al obtener los rendimientos consolidados",
        });
      }
    } catch (error: unknown) {
      console.error("Error al consultar rendimientos consolidados:", error);
      setAlertMessage({
        type: "danger",
        text:
          error instanceof Error
            ? error.message
            : "Error de conexión con el servidor",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportarCSV = () => {
    if (rendimientos.length === 0) return;

    // El CSV respeta exactamente las columnas visibles del resumen consolidado.
    // Esto facilita auditoría entre pantalla y archivo exportado.
    const headers = [
      "Unidad",
      "Carga Total",
      "Kms Rec.",
      "Hrs Rec.",
      "Km/Lt",
      "Hr/Lt",
      "Lt/Hr",
      "Tanque Principal",
      "Tanques Utilizados",
      "Cantidad Tanques",
    ];

    const csvContent = [
      headers.join(","),
      ...rendimientos.map((r) =>
        [
          `"${r.Unidad}"`,
          Number(r["Carga Total"] || 0).toFixed(0),
          Number(r["Kms Recorridos"] || 0).toFixed(0),
          Number(r["Hrs Recorridos"] || 0).toFixed(0),
          Number(r["Kms/Lts"] || 0).toFixed(4),
          Number(r["Hrs/Lts"] || 0).toFixed(4),
          calcularLtsHrs(r["Carga Total"], r["Hrs Recorridos"]).toFixed(4),
          `"${r["Tanque Principal"] || ""}"`,
          `"${r["Tanques Utilizados"] || ""}"`,
          Number(r["Cantidad Tanques"] || 0).toFixed(0),
        ].join(","),
      ),
    ].join("\n");

    // Se agrega BOM UTF-8 para preservar acentos al abrir el archivo en Excel.
    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `rendimientos_consolidados_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportarPDF = async () => {
    if (rendimientos.length === 0) return;

    const doc = new jsPDF("landscape");

    // El logo se carga aparte porque jsPDF necesita la imagen resuelta antes de insertarla.
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
      doc.addImage(
        logo,
        "PNG",
        pdfWidth - 14 - logoWidth,
        10,
        logoWidth,
        logoHeight,
      );
    } catch (err) {
      console.error("Error cargando logo en PDF", err);
    }

    // Encabezado visual del reporte exportado.
    doc.setFontSize(22);
    doc.setTextColor(52, 58, 64);
    doc.setFont("helvetica", "bold");
    doc.text("Reporte de Rendimientos Consolidado", 14, 20);

    doc.setDrawColor(240, 173, 78);
    doc.setLineWidth(1.5);
    doc.line(14, 24, doc.internal.pageSize.getWidth() - 14, 24);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(108, 117, 125);
    const ciudad = lastQueryParams?.CveCiudad || "Todas";
    const tanque = tanqueNombre || "Todos";
    const unidad = unidadNombre || "Todas";
    const fInicio = lastQueryParams?.FechaInicial
      ? formatearFecha(lastQueryParams.FechaInicial)
      : "";
    const fFinal = lastQueryParams?.FechaFinal
      ? formatearFecha(lastQueryParams.FechaFinal)
      : "";

    // Se imprimen los filtros visibles para que el PDF sea autocontenible
    // y pueda auditarse sin depender de la pantalla original.
    doc.text("Filtros:", 14, 30);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(52, 58, 64);
    doc.text("Ciudad:", 30, 30);
    doc.setFont("helvetica", "normal");
    doc.text(ciudad, 43, 30);

    doc.setFont("helvetica", "bold");
    doc.text("Tanque:", 75, 30);
    doc.setFont("helvetica", "normal");
    doc.text(tanque, 90, 30);

    doc.setFont("helvetica", "bold");
    doc.text("Unidad:", 140, 30);
    doc.setFont("helvetica", "normal");
    doc.text(unidad, 155, 30);

    doc.setFont("helvetica", "bold");
    doc.text("Desde:", 215, 30);
    doc.setFont("helvetica", "normal");
    doc.text(fInicio, 228, 30);

    doc.setFont("helvetica", "bold");
    doc.text("Hasta:", 255, 30);
    doc.setFont("helvetica", "normal");
    doc.text(fFinal, 268, 30);

    // Los totales del PDF se recalculan sobre el dataset ya consultado en pantalla.
    // Para Kms/Lts y Hrs/Lts total se usa total_recorrido / total_litros,
    // no un promedio simple de los indicadores por unidad.
    const totalCarga = rendimientos.reduce(
      (sum, item) => sum + Number(item["Carga Total"] || 0),
      0,
    );
    const totalKms = rendimientos.reduce(
      (sum, item) => sum + Number(item["Kms Recorridos"] || 0),
      0,
    );
    const totalHrs = rendimientos.reduce(
      (sum, item) => sum + Number(item["Hrs Recorridos"] || 0),
      0,
    );
    const totalKmsLts = totalCarga > 0 ? totalKms / totalCarga : 0;
    const totalHrsLts = totalCarga > 0 ? totalHrs / totalCarga : 0;
    const totalLtsHrs = totalHrs > 0 ? totalCarga / totalHrs : 0;

    // La tabla PDF replica el resumen principal; solo omite la columna de acción.
    const tableColumn = [
      "Unidad",
      "Carga Total",
      "Kms Rec.",
      "Hrs Rec.",
      "Km/Lt",
      "Hr/Lt",
      "Lt/Hr",
      "Tanque Principal",
      "Tanques Utilizados",
    ];
    const tableRows = rendimientos.map((item) => [
      item.Unidad ?? "",
      formatearNumero(item["Carga Total"], true),
      formatearNumero(item["Kms Recorridos"], true),
      formatearNumero(item["Hrs Recorridos"], true),
      formatearNumero(item["Kms/Lts"]),
      formatearNumero(item["Hrs/Lts"]),
      formatearNumero(calcularLtsHrs(item["Carga Total"], item["Hrs Recorridos"])),
      item["Tanque Principal"] ?? "",
      item["Tanques Utilizados"] ?? "",
    ]);

    tableRows.push([
      "TOTALES",
      formatearNumero(totalCarga, true),
      formatearNumero(totalKms, true),
      formatearNumero(totalHrs, true),
      formatearNumero(totalKmsLts),
      formatearNumero(totalHrsLts),
      formatearNumero(totalLtsHrs),
      "",
      "",
    ]);

    // Se resalta visualmente la última fila porque representa el agregado del reporte,
    // no un renglón operativo individual.
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      styles: {
        fontSize: 8.5,
        cellPadding: 3,
        valign: "middle",
      },
      headStyles: {
        fillColor: [52, 58, 64],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      alternateRowStyles: {
        fillColor: [244, 246, 251],
      },
      columnStyles: {
        0: { halign: "left" },
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right", fontStyle: "bold", textColor: [52, 58, 64] },
        6: { halign: "right", fontStyle: "bold", textColor: [52, 58, 64] },
        7: { halign: "left" },
        8: { halign: "left" },
      },
      didParseCell: (data) => {
        if (data.row.index === tableRows.length - 1) {
          data.cell.styles.fillColor = [230, 230, 230];
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = [52, 58, 64];
        }
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 35;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(
      14,
      finalY + 10,
      doc.internal.pageSize.getWidth() - 14,
      finalY + 10,
    );

    // El pie indica fecha/hora de generación para trazabilidad documental.
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
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
    doc.save(`Reporte_Rendimientos_Consolidado_${safeDate}.pdf`);
  };

  const totalDiesel = rendimientos.reduce(
    (sum, item) => sum + Number(item["Carga Total"] || 0),
    0,
  );
  const totalKms = rendimientos.reduce(
    (sum, item) => sum + Number(item["Kms Recorridos"] || 0),
    0,
  );
  const totalHoras = rendimientos.reduce(
    (sum, item) => sum + Number(item["Hrs Recorridos"] || 0),
    0,
  );

  return (
    <Container fluid className="p-3">
      <h4 className="text-center mb-4">Reporte de Rendimientos Consolidado</h4>

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
                <div
                  onChange={(e) => {
                    // Se guarda el nombre visible del tanque para usarlo en PDF.
                    // No se reutiliza el ID porque el documento necesita etiquetas legibles.
                    const select = e.target as HTMLSelectElement;
                    const selectedOption = select.options[select.selectedIndex];
                    setTanqueNombre(selectedOption?.text || "Todos");
                  }}
                >
                  <ComboTanquePorCiudad
                    cveCiudad={cveCiudadSeleccionada || null}
                    register={register}
                    error={errors.IDTanque}
                    optional={true}
                  />
                </div>
              </Col>

              <Col lg={2} md={6} className="mb-3 mb-lg-0">
                <div
                  onChange={(e) => {
                    // Igual que con tanque, se conserva el texto mostrado para encabezados de exportación.
                    const select = e.target as HTMLSelectElement;
                    const selectedOption = select.options[select.selectedIndex];
                    setUnidadNombre(selectedOption?.text || "Todas");
                  }}
                >
                  <ComboUnidades
                    cveCiudad={cveCiudadSeleccionada}
                    register={register}
                    error={errors.IDUnidad}
                    optional={true}
                    idTanque={idTanqueWatch || null}
                  />
                </div>
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
            <h5 className="mb-0">Resultados consolidados</h5>
            <div>
              <Button
                variant="success"
                size="sm"
                onClick={exportarCSV}
                className="me-2"
              >
                Exportar CSV
              </Button>
              <Button variant="danger" size="sm" onClick={exportarPDF}>
                Exportar PDF
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            <Row className="g-2 mb-3">
              <Col md={4}>
                <div className="border rounded p-2 bg-light h-100">
                  <div className="small text-muted">Total Diesel</div>
                  <div className="fw-bold fs-5">{formatearNumero(totalDiesel, true)}</div>
                </div>
              </Col>
              <Col md={4}>
                <div className="border rounded p-2 bg-light h-100">
                  <div className="small text-muted">Total Kms</div>
                  <div className="fw-bold fs-5">{formatearNumero(totalKms, true)}</div>
                </div>
              </Col>
              <Col md={4}>
                <div className="border rounded p-2 bg-light h-100">
                  <div className="small text-muted">Total Horas</div>
                  <div className="fw-bold fs-5">{formatearNumero(totalHoras, true)}</div>
                </div>
              </Col>
            </Row>
            <div className="table-responsive">
              <Table
                striped
                bordered
                hover
                className="table-corporate align-middle rendimientos-v2-table"
              >
                <colgroup>
                  <col className="rendimientos-v2-table__col--unidad" />
                  <col className="rendimientos-v2-table__col--numero" />
                  <col className="rendimientos-v2-table__col--numero" />
                  <col className="rendimientos-v2-table__col--numero" />
                  <col className="rendimientos-v2-table__col--kpi" />
                  <col className="rendimientos-v2-table__col--kpi" />
                  <col className="rendimientos-v2-table__col--kpi" />
                  <col className="rendimientos-v2-table__col--tanque" />
                  <col className="rendimientos-v2-table__col--tanques" />
                  <col className="rendimientos-v2-table__col--accion" />
                </colgroup>
                <thead>
                  <tr>
                    <th className="text-center">Unidad</th>
                    <th className="text-center">Carga Total</th>
                    <th className="text-center">Kms Rec.</th>
                    <th className="text-center">Hrs Rec.</th>
                    <th className="text-center">Km/Lt</th>
                    <th className="text-center">Hr/Lt</th>
                    <th className="text-center">Lt/Hr</th>
                    <th className="text-center">Tanque Principal</th>
                    <th className="text-center">Tanques Utilizados</th>
                    <th className="text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {rendimientos.map((r, index) => (
                    <tr key={index}>
                      <td className="rendimientos-v2-table__unidad">
                        {r.Unidad}
                      </td>
                      <td className="text-end rendimientos-v2-table__numero">
                        {formatearNumero(r["Carga Total"], true)}
                      </td>
                      <td className="text-end rendimientos-v2-table__numero">
                        {formatearNumero(r["Kms Recorridos"], true)}
                      </td>
                      <td className="text-end rendimientos-v2-table__numero">
                        {formatearNumero(r["Hrs Recorridos"], true)}
                      </td>
                      <td className="text-end rendimientos-v2-table__numero">
                        {formatearNumero(r["Kms/Lts"])}
                      </td>
                      <td className="text-end rendimientos-v2-table__numero">
                        {formatearNumero(r["Hrs/Lts"])}
                      </td>
                      <td className="text-end rendimientos-v2-table__numero">
                        {formatearNumero(calcularLtsHrs(r["Carga Total"], r["Hrs Recorridos"]))}
                      </td>
                      <td className="rendimientos-v2-table__tanque">
                        {r["Tanque Principal"]}
                      </td>
                      <td className="rendimientos-v2-table__tanques">
                        {r["Tanques Utilizados"]}
                      </td>
                      <td className="text-center rendimientos-v2-table__accion">
                        <Button
                          variant="outline-corporate"
                          size="sm"
                          // El detalle no vuelve a filtrar por tanque del renglón,
                          // porque el resumen consolidado ya está definido por unidad.
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

      <ReporteRendimientosDetalleModalV2
        show={showDetalle}
        onHide={() => setShowDetalle(false)}
        // El modal recibe el contexto mínimo necesario para volver a consultar
        // el detalle de la misma unidad bajo los filtros originales del reporte.
        datosFila={filaSeleccionada}
      />
    </Container>
  );
}
