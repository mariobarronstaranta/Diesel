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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ComboCveCiudad from "./ComboCveCiudad";
import ComboTanquePorCiudad from "./ComboTanquePorCiudad";
import { supabase } from "../supabase/client";
import ReporteProductividadDetalleModal from "./ReporteProductividadDetalleModal";
import logoUrl from "../assets/images/logo.png";
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
  const [mostrarUnidadesSinCargas, setMostrarUnidadesSinCargas] =
    useState<boolean>(true);
  const [cveCiudadSeleccionada, setCveCiudadSeleccionada] =
    useState<string>("");
  const [tanqueNombre, setTanqueNombre] = useState<string>("Todos");
  const [lastQueryParams, setLastQueryParams] =
    useState<ReporteProductividadForm | null>(null);

  // Estados para el modal de detalle
  const [showModal, setShowModal] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState<{
    idUnidad: number;
    unidad: string;
    tanque: string;
    fechaInicio: string;
    fechaFin: string;
  } | null>(null);

  const handleVerDetalle = (r: ReporteProductividadData) => {
    if (!lastQueryParams) return;
    setFilaSeleccionada({
      idUnidad: r.IDUnidad,
      unidad: r.Unidad,
      tanque: r.Tanque,
      fechaInicio: lastQueryParams.FechaInicial,
      fechaFin: lastQueryParams.FechaFinal,
    });
    setShowModal(true);
  };

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

  const formatearFecha = (fecha: string) => {
    const [y, m, d] = fecha.split("-");
    return `${d}/${m}/${y}`;
  };

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

  const esUnidadSinCargas = (row: ReporteProductividadData) => {
    return !row.Tanque || row.Tanque.trim().toUpperCase() === "N/A";
  };

  const reporteDataVisible = mostrarUnidadesSinCargas
    ? reporteData
    : reporteData.filter((r) => !esUnidadSinCargas(r));

  const consolidarProductividadPorUnidad = (
    rows: ReporteProductividadData[],
  ): ReporteProductividadData[] => {
    const mapa = new Map<
      string,
      ReporteProductividadData & { _tanques: Set<string> }
    >();

    for (const row of rows) {
      const idUnidad = row.IDUnidad ?? 0;
      const clave = `${idUnidad}-${row.Unidad}`;
      const tanqueActual = (row.Tanque || "").trim();

      if (!mapa.has(clave)) {
        const tanques = new Set<string>();
        if (tanqueActual && tanqueActual !== "N/A") {
          tanques.add(tanqueActual);
        }

        mapa.set(clave, {
          ...row,
          "Litros Consumidos": Number(row["Litros Consumidos"] || 0),
          Viajes: Number(row.Viajes || 0),
          MetrosCubicos: Number(row.MetrosCubicos || 0),
          "Kms Totales": Number(row["Kms Totales"] || 0),
          "Hrs Totales": Number(row["Hrs Totales"] || 0),
          _tanques: tanques,
        });
        continue;
      }

      const acumulado = mapa.get(clave)!;

      if (tanqueActual && tanqueActual !== "N/A") {
        acumulado._tanques.add(tanqueActual);
      }

      acumulado["Litros Consumidos"] =
        Number(acumulado["Litros Consumidos"] || 0) +
        Number(row["Litros Consumidos"] || 0);

      // Estos valores representan totales por unidad en el periodo y pueden repetirse por tanque.
      acumulado["Viajes"] = Math.max(
        Number(acumulado.Viajes || 0),
        Number(row.Viajes || 0),
      );
      acumulado["MetrosCubicos"] = Math.max(
        Number(acumulado.MetrosCubicos || 0),
        Number(row.MetrosCubicos || 0),
      );
      acumulado["Kms Totales"] = Math.max(
        Number(acumulado["Kms Totales"] || 0),
        Number(row["Kms Totales"] || 0),
      );
      acumulado["Hrs Totales"] = Math.max(
        Number(acumulado["Hrs Totales"] || 0),
        Number(row["Hrs Totales"] || 0),
      );

      if (acumulado.EstadoRegistro !== "Registrada") {
        acumulado.EstadoRegistro = row.EstadoRegistro;
      }
    }

    return Array.from(mapa.values())
      .map((item) => {
        const viajes = Number(item.Viajes || 0);
        const metros = Number(item.MetrosCubicos || 0);
        const kms = Number(item["Kms Totales"] || 0);
        const hrs = Number(item["Hrs Totales"] || 0);
        const litros = Number(item["Litros Consumidos"] || 0);

        const tanques = Array.from(item._tanques);
        const tanqueTexto = tanques.length > 0 ? tanques.join(", ") : "N/A";

        return {
          EstadoRegistro: item.EstadoRegistro,
          Tanque: tanqueTexto,
          Unidad: item.Unidad,
          IDUnidad: item.IDUnidad,
          Viajes: viajes,
          MetrosCubicos: metros,
          "Kms Totales": kms,
          "Hrs Totales": hrs,
          "Litros Consumidos": litros,
          "Lts/M3": metros > 0 ? Number((litros / metros).toFixed(4)) : 0,
          "Km/Lts": litros > 0 ? Number((kms / litros).toFixed(4)) : 0,
          "M3/Viaje": viajes > 0 ? Number((metros / viajes).toFixed(4)) : 0,
        } satisfies ReporteProductividadData;
      })
      .sort((a, b) => {
        if (a.EstadoRegistro !== b.EstadoRegistro) {
          return a.EstadoRegistro === "Registrada" ? -1 : 1;
        }
        return Number(b.MetrosCubicos || 0) - Number(a.MetrosCubicos || 0);
      });
  };

  const enriquecerConTodosLosTanques = async (
    rows: ReporteProductividadData[],
    filtros: ReporteProductividadForm,
  ): Promise<ReporteProductividadData[]> => {
    if (!filtros.IDTanque) return rows;

    const unidadesObjetivo = rows
      .filter((r) => Number(r.IDUnidad || 0) > 0)
      .map((r) => Number(r.IDUnidad));

    if (unidadesObjetivo.length === 0) return rows;

    const { data: movimientos, error: movimientosError } = await supabase
      .from("TanqueMovimiento")
      .select("IdUnidad, IdTanque, LitrosCarga, CveCiudad")
      .eq("TipoMovimiento", "S")
      .gte("FechaCarga", filtros.FechaInicial)
      .lte("FechaCarga", filtros.FechaFinal)
      .in("IdUnidad", unidadesObjetivo);

    if (movimientosError) {
      throw movimientosError;
    }

    const movimientosFiltrados = (movimientos || []).filter((m) =>
      filtros.CveCiudad ? m.CveCiudad === filtros.CveCiudad : true,
    );

    const idsTanque = Array.from(
      new Set(
        movimientosFiltrados
          .map((m) => Number(m.IdTanque || 0))
          .filter((id) => id > 0),
      ),
    );

    const nombresTanque = new Map<number, string>();
    if (idsTanque.length > 0) {
      const { data: tanques, error: tanquesError } = await supabase
        .from("Tanque")
        .select("IDTanque, Nombre")
        .in("IDTanque", idsTanque);

      if (tanquesError) {
        throw tanquesError;
      }

      for (const t of tanques || []) {
        nombresTanque.set(Number(t.IDTanque), String(t.Nombre || ""));
      }
    }

    const acumuladoPorUnidad = new Map<
      number,
      { litros: number; tanques: Set<string> }
    >();

    for (const m of movimientosFiltrados) {
      const idUnidad = Number(m.IdUnidad || 0);
      if (idUnidad <= 0) continue;

      if (!acumuladoPorUnidad.has(idUnidad)) {
        acumuladoPorUnidad.set(idUnidad, {
          litros: 0,
          tanques: new Set<string>(),
        });
      }

      const entrada = acumuladoPorUnidad.get(idUnidad)!;
      entrada.litros += Number(m.LitrosCarga || 0);

      const nombreTanque = nombresTanque.get(Number(m.IdTanque || 0));
      if (nombreTanque) {
        entrada.tanques.add(nombreTanque);
      }
    }

    return rows.map((row) => {
      const idUnidad = Number(row.IDUnidad || 0);
      const enriquecido = acumuladoPorUnidad.get(idUnidad);
      if (!enriquecido) return row;

      const litros = enriquecido.litros;
      const kms = Number(row["Kms Totales"] || 0);
      const metros = Number(row.MetrosCubicos || 0);
      const viajes = Number(row.Viajes || 0);

      return {
        ...row,
        Tanque:
          enriquecido.tanques.size > 0
            ? Array.from(enriquecido.tanques).join(", ")
            : row.Tanque,
        "Litros Consumidos": litros,
        "Lts/M3": metros > 0 ? Number((litros / metros).toFixed(4)) : 0,
        "Km/Lts": litros > 0 ? Number((kms / litros).toFixed(4)) : 0,
        "M3/Viaje": viajes > 0 ? Number((metros / viajes).toFixed(4)) : 0,
      };
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
        const dataConsolidada = consolidarProductividadPorUnidad(
          result as ReporteProductividadData[],
        );
        const dataFinal = await enriquecerConTodosLosTanques(
          dataConsolidada,
          data,
        );

        setReporteData(dataFinal);
        if (dataFinal.length === 0) {
          setAlertMessage({
            type: "warning",
            text: "No se encontraron datos de productividad para los filtros seleccionados",
          });
        } else {
          setAlertMessage({
            type: "success",
            text: `Se procesaron ${dataFinal.length} unidades consolidadas`,
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
    if (reporteDataVisible.length === 0) return;

    const headers = [
      "Estado",
      "Unidad",
      "Tanque",
      "Lts Totales",
      "Kms Totales",
      "Hrs Totales",
      "Carga Total Viajes",
      "Num Viajes",
      "Lts/M3 (Costo)",
      "M3/Viaje (Capacidad)",
      "Km/Lts (Rend.)",
    ];

    const csvContent = [
      headers.join(","),
      ...reporteDataVisible.map((r) =>
        [
          `"${r.EstadoRegistro}"`,
          `"${r.Unidad}"`,
          `"${r.Tanque}"`,
          Number(r["Litros Consumidos"] || 0).toFixed(2),
          Number(r["Kms Totales"] || 0).toFixed(0),
          Number(r["Hrs Totales"] || 0).toFixed(0),
          Number(r.MetrosCubicos || 0).toFixed(2),
          Number(r.Viajes || 0).toFixed(0),
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

  const exportarPDF = async () => {
    if (reporteDataVisible.length === 0) return;

    const doc = new jsPDF("landscape");

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

    doc.setFontSize(22);
    doc.setTextColor(52, 58, 64);
    doc.setFont("helvetica", "bold");
    doc.text("Reporte de Productividad y Rentabilidad", 14, 20);

    doc.setDrawColor(240, 173, 78);
    doc.setLineWidth(1.5);
    doc.line(14, 24, doc.internal.pageSize.getWidth() - 14, 24);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(108, 117, 125);
    const ciudad = lastQueryParams?.CveCiudad || "Todas";
    const tanque = tanqueNombre || "Todos";
    const fInicio = lastQueryParams?.FechaInicial
      ? formatearFecha(lastQueryParams.FechaInicial)
      : "";
    const fFinal = lastQueryParams?.FechaFinal
      ? formatearFecha(lastQueryParams.FechaFinal)
      : "";

    doc.text("Filtros:", 14, 30);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(52, 58, 64);
    doc.text("Ciudad:", 30, 30);
    doc.setFont("helvetica", "normal");
    doc.text(ciudad, 43, 30);

    doc.setFont("helvetica", "bold");
    doc.text("Tanque:", 85, 30);
    doc.setFont("helvetica", "normal");
    doc.text(tanque, 100, 30);

    doc.setFont("helvetica", "bold");
    doc.text("Desde:", 150, 30);
    doc.setFont("helvetica", "normal");
    doc.text(fInicio, 163, 30);

    doc.setFont("helvetica", "bold");
    doc.text("Hasta:", 205, 30);
    doc.setFont("helvetica", "normal");
    doc.text(fFinal, 218, 30);

    const totalLitros = reporteDataVisible.reduce(
      (sum, item) => sum + Number(item["Litros Consumidos"] || 0),
      0,
    );
    const totalKms = reporteDataVisible.reduce(
      (sum, item) => sum + Number(item["Kms Totales"] || 0),
      0,
    );
    const totalHrs = reporteDataVisible.reduce(
      (sum, item) => sum + Number(item["Hrs Totales"] || 0),
      0,
    );
    const totalMetros = reporteDataVisible.reduce(
      (sum, item) => sum + Number(item.MetrosCubicos || 0),
      0,
    );
    const totalViajes = reporteDataVisible.reduce(
      (sum, item) => sum + Number(item.Viajes || 0),
      0,
    );
    const totalLtsM3 = totalMetros > 0 ? totalLitros / totalMetros : 0;
    const totalM3Viaje = totalViajes > 0 ? totalMetros / totalViajes : 0;
    const totalKmLts = totalLitros > 0 ? totalKms / totalLitros : 0;

    const tableColumn = [
      "Unidad",
      "Tanque",
      "Lts Totales",
      "Kms Totales",
      "Hrs Totales",
      "Carga Total Viajes",
      "Lts/M3",
      "M3/Viaje",
      "Km/Lts",
    ];

    const tableRows = reporteDataVisible.map((item) => {
      const noRegistrada = item.EstadoRegistro === "No Registrada";
      return [
        noRegistrada ? `${item.Unidad} [No Registrada]` : item.Unidad,
        item.Tanque ?? "",
        noRegistrada ? "-" : formatearNumero(item["Litros Consumidos"]),
        noRegistrada ? "-" : formatearNumero(item["Kms Totales"], true),
        noRegistrada ? "-" : formatearNumero(item["Hrs Totales"], true),
        `${formatearNumero(item.MetrosCubicos)} (${item.Viajes} viajes)`,
        noRegistrada ? "-" : formatearNumero(item["Lts/M3"]),
        formatearNumero(item["M3/Viaje"]),
        noRegistrada ? "-" : formatearNumero(item["Km/Lts"]),
      ];
    });

    tableRows.push([
      "TOTALES",
      "",
      formatearNumero(totalLitros),
      formatearNumero(totalKms, true),
      formatearNumero(totalHrs, true),
      `${formatearNumero(totalMetros)} (${totalViajes} viajes)`,
      formatearNumero(totalLtsM3),
      formatearNumero(totalM3Viaje),
      formatearNumero(totalKmLts),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      styles: {
        fontSize: 8,
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
        1: { halign: "left" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "center" },
        6: { halign: "right" },
        7: { halign: "right" },
        8: { halign: "right", fontStyle: "bold", textColor: [52, 58, 64] },
      },
      didParseCell: (data) => {
        const rowIndex = data.row.index;
        if (rowIndex < reporteDataVisible.length) {
          const item = reporteDataVisible[rowIndex];
          if (item?.EstadoRegistro === "No Registrada") {
            data.cell.styles.fillColor = [255, 243, 205];
          }
          if (
            data.column.index === 6 &&
            item?.EstadoRegistro !== "No Registrada"
          ) {
            const valor = Number(item["Lts/M3"] || 0);
            if (valor > 5) {
              data.cell.styles.fillColor = [220, 53, 69];
              data.cell.styles.textColor = [255, 255, 255];
              data.cell.styles.fontStyle = "bold";
            } else if (valor > 3.5) {
              data.cell.styles.fillColor = [255, 193, 7];
              data.cell.styles.textColor = [33, 37, 41];
              data.cell.styles.fontStyle = "bold";
            } else if (valor > 0) {
              data.cell.styles.fillColor = [25, 135, 84];
              data.cell.styles.textColor = [255, 255, 255];
              data.cell.styles.fontStyle = "bold";
            }
          }
          if (
            data.column.index === 8 &&
            item?.EstadoRegistro !== "No Registrada"
          ) {
            const valor = Number(item["Km/Lts"] || 0);
            if (valor < 1.0 && valor > 0) {
              data.cell.styles.fillColor = [220, 53, 69];
              data.cell.styles.textColor = [255, 255, 255];
              data.cell.styles.fontStyle = "bold";
            }
          }
        }

        if (rowIndex === tableRows.length - 1) {
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
    doc.save(`Reporte_Productividad_${safeDate}.pdf`);
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
                <div
                  onChange={(e) => {
                    const select = e.target as HTMLSelectElement;
                    const selectedOption = select.options[select.selectedIndex];
                    setTanqueNombre(selectedOption?.text || "Todos");
                  }}
                >
                  <ComboTanquePorCiudad
                    cveCiudad={cveCiudadSeleccionada || null}
                    register={register}
                    error={errors.IDTanque}
                    optional
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
          <Card.Header className="bg-white">
            <div className="productividad-header">
              <h5 className="mb-0 productividad-header__title">
                Rendimiento por CR (
                {lastQueryParams.CveCiudad || "Todas las Ciudades"} | Tanque{" "}
                {lastQueryParams.IDTanque || "Todos"} | del{" "}
                {lastQueryParams.FechaInicial} al {lastQueryParams.FechaFinal})
              </h5>
              <div className="productividad-header__actions">
                <Form.Check
                  type="checkbox"
                  id="filtro-unidades-sin-cargas"
                  label="Mostrar unidades sin cargas"
                  checked={mostrarUnidadesSinCargas}
                  onChange={(e) =>
                    setMostrarUnidadesSinCargas(e.target.checked)
                  }
                  className="mb-0 productividad-header__toggle"
                />
                <div className="productividad-header__buttons">
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
              </div>
            </div>
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
                    <th className="text-center">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {reporteDataVisible.map((r, index) => {
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
                        <td className="text-center align-middle">
                          <Button
                            variant="outline-corporate"
                            size="sm"
                            onClick={() => handleVerDetalle(r)}
                          >
                            Detalle
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {reporteDataVisible.length === 0 && (
                    <tr>
                      <td colSpan={10} className="text-center text-muted py-4">
                        No hay unidades para mostrar con el filtro actual.
                      </td>
                    </tr>
                  )}
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

      {/* Modal de Detalle */}
      <ReporteProductividadDetalleModal
        show={showModal}
        onHide={() => setShowModal(false)}
        datosFila={filaSeleccionada}
      />
    </Container>
  );
}
