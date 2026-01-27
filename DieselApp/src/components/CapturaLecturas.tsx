import { Container, Card, Form, Button, Row, Col } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import ComboCiudad from "./ComboCiudad";
import ComboPlanta from "./ComboPlanta";
import ComboTanque from "./ComboTanque";

export default function CapturaLecturas() {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
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

  useEffect(() => {
    setValue("Fecha", todayStr);
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

  const onSubmit = (data: any) => {
    console.log("Formulario válido:", data);
  };

  return (
    <Container fluid className="p-3">
      <h4 className="text-center mb-4">Captura Diaria de Lecturas</h4>

      <Form noValidate onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-3">
          <Card.Body>
            {/* Ciudad */}
            <ComboCiudad register={register} error={errors.IDCiudad} />

            {/* Planta */}
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

            {/* Tanque */}
            <ComboTanque
              idPlanta={
                idPlantaSeleccionada ? Number(idPlantaSeleccionada) : null
              }
              register={register}
            />
            {errors.IDTanque && (
              <div className="text-danger small mb-2">Seleccione un tanque</div>
            )}

            {/* Fecha y Hora */}
            <Row className="mb-3">
              <Col xs={6}>
                <Form.Group>
                  <Form.Label>Fecha</Form.Label>
                  <Form.Control
                    type="date"
                    min={minDateStr}
                    max={todayStr}
                    isInvalid={!!errors.Fecha}
                    {...register("Fecha", {
                      required: "La fecha es obligatoria",
                      validate: (value) => {
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

              <Col xs={6}>
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
            </Row>

            {/* Mediciones */}
            <Row className="mb-3">
              <Col xs={6}>
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

              <Col xs={6}>
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
            </Row>
          </Card.Body>
        </Card>

        <div className="d-grid">
          <Button size="lg" variant="warning" type="submit">
            Guardar Datos
          </Button>
        </div>
      </Form>
    </Container>
  );
}
