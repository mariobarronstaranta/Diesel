import { Container, Card, Form, Button, Row, Col, Alert } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import ComboCiudad from "./ComboCiudad";
import ComboPlanta from "./ComboPlanta";
import ComboTanque from "./ComboTanque";
import { supabase } from "../supabase/client";

interface CapturaLecturasForm {
  IDCiudad: string;
  IDPlanta: string;
  IDTanque: string;
  Fecha: string;
  Hora: string;
  Temperatura: string; // Inputs returns strings usually
  AlturaCms: string;
  CuentaLitros: string;
}

export default function CapturaLecturas() {
  const [isLoading, setIsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{
    type: "success" | "danger";
    text: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CapturaLecturasForm>({
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const idCiudadSeleccionada = watch("IDCiudad");
  const idPlantaSeleccionada = watch("IDPlanta");

  // ============================
  // Fecha: valores y límites
  // ============================
  const toDateInput = (d: Date) => d.toISOString().slice(0, 10);
  const today = new Date();
  const todayStr = toDateInput(today);
  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 2);
  const minDateStr = toDateInput(minDate);

  // Helper to set default date/time
  const setDefaults = () => {
    setValue("Fecha", todayStr);
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setValue("Hora", `${hours}:${minutes}`);
  };

  useEffect(() => {
    setDefaults();
  }, [setValue, todayStr]);

  // Encadenamiento de combos
  // ============================
  useEffect(() => {
    setValue("IDPlanta", "");
    setValue("IDTanque", "");
  }, [idCiudadSeleccionada, setValue]);

  useEffect(() => {
    setValue("IDTanque", "");
  }, [idPlantaSeleccionada, setValue]);

  const onSubmit = async (data: CapturaLecturasForm) => {
    try {
      setIsLoading(true);
      setAlertMessage(null);

      // Formatear hora a HH:MM:SS (si solo tiene HH:MM, agregar :00)
      const horaFormateada = data.Hora.includes(":00:")
        ? data.Hora
        : `${data.Hora}:00`;

      const { error } = await supabase
        .from("TanqueLecturas")
        .insert([
          {
            IDTanque: Number(data.IDTanque),
            Fecha: data.Fecha,
            Hora: horaFormateada,
            LecturaCms: Number(data.AlturaCms),
            Temperatura: Number(data.Temperatura),
            VolActualTA: 0,
            VolActual15C: 0,
            CuentaLitros: Number(data.CuentaLitros),
            FechaRegistro: new Date(),
            IDUsuarioRegistro: 1,
          },
        ]);

      if (error) {
        throw error;
      }

      setAlertMessage({
        type: "success",
        text: "Lectura registrada de manera exitosa",
      });

      handleClean();
    } catch (error: unknown) {
      console.error("Error al enviar datos:", error);
      const errorMessage = error instanceof Error ? error.message : "Error de conexión con el servidor";
      setAlertMessage({
        type: "danger",
        text: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };



  const handleClean = () => {
    reset({
      IDCiudad: "",
      IDPlanta: "",
      IDTanque: "",
      Fecha: todayStr, // Reset to today
      Hora: "",
      Temperatura: "",
      AlturaCms: "",
      CuentaLitros: "",
    });
    setDefaults(); // Use the helper
  };

  return (
    <Container fluid className="p-3">
      <h4 className="text-center mb-4">Captura Diaria de Lecturas</h4>

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
        <Card className="mb-4">
          <Card.Header className="card-header-corporate text-white text-center fw-bold">DATOS DEL TANQUE</Card.Header>
          <Card.Body>
            <Row>
              <Col md={4}>
                <ComboCiudad register={register} error={errors.IDCiudad} />
              </Col>

              <Col md={4}>
                <ComboPlanta
                  idCiudad={
                    idCiudadSeleccionada ? Number(idCiudadSeleccionada) : null
                  }
                  register={register}
                />
                {errors.IDPlanta && (
                  <div className="text-danger small mb-2">
                    Seleccione una planta
                  </div>
                )}
              </Col>

              <Col md={4}>
                <ComboTanque
                  idPlanta={
                    idPlantaSeleccionada ? Number(idPlantaSeleccionada) : null
                  }
                  register={register}
                />
                {errors.IDTanque && (
                  <div className="text-danger small mb-2">Seleccione un tanque</div>
                )}
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="mb-3">
          <Card.Header className="card-header-corporate text-white text-center fw-bold">DATOS DE LECTURA</Card.Header>
          <Card.Body>
            <Row className="mb-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Fecha</Form.Label>
                  <Form.Control
                    type="date"
                    min={minDateStr}
                    max={todayStr}
                    isInvalid={!!errors.Fecha}
                    {...register("Fecha", {
                      required: "La fecha es obligatoria",
                      validate: (value: string) => {
                        if (!value) return "La fecha es obligatoria";
                        if (value > todayStr)
                          return "La fecha no puede ser mayor al día de hoy";
                        if (value < minDateStr)
                          return `La fecha no puede ser menor que ${minDateStr}`;
                        return true;
                      },
                    })}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.Fecha?.message as string}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Hora</Form.Label>
                  <Form.Control
                    type="time"
                    isInvalid={!!errors.Hora}
                    {...register("Hora", {
                      required: "La hora es obligatoria",
                    })}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.Hora?.message as string}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Temperatura (°C)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    isInvalid={!!errors.Temperatura}
                    {...register("Temperatura", {
                      required: "La temperatura es obligatoria",
                    })}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.Temperatura?.message as string}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Altura (cms)</Form.Label>
                  <Form.Control
                    type="number"
                    inputMode="numeric"
                    isInvalid={!!errors.AlturaCms}
                    {...register("AlturaCms", {
                      required: "La altura es obligatoria",
                      min: {
                        value: 1,
                        message: "La altura debe ser mayor a 0",
                      },
                    })}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.AlturaCms?.message as string}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Cuenta Litros</Form.Label>
                  <Form.Control
                    type="number"
                    inputMode="numeric"
                    isInvalid={!!errors.CuentaLitros}
                    {...register("CuentaLitros", {
                      required: "La cuenta litros es obligatoria",
                      min: {
                        value: 0,
                        message: "La cuenta litros debe ser mayor o igual a 0",
                      },
                    })}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.CuentaLitros?.message as string}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <div className="d-flex gap-2 justify-content-end">
          <Button
            size="lg"
            variant="secondary"
            type="button"
            onClick={() => {
              handleClean();
              setAlertMessage(null);
            }}
            disabled={isLoading}
          >
            Limpiar Formulario
          </Button>
          <Button
            size="lg"
            variant="warning"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </Form>
    </Container>
  );
}
