import { Container, Card, Form, Button, Row, Col } from "react-bootstrap";
import { useForm } from "react-hook-form";
import ComboCiudad from "./ComboCiudad";

export default function CapturaLecturas() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data: any) => {
    console.log("Datos capturados:", data);
  };

  return (
    <Container fluid className="p-3">
      <h4 className="text-center mb-4">Captura Diaria de Lecturas</h4>

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-3">
          <Card.Body>
            {/* Ciudad (Supabase) */}
            <ComboCiudad register={register} error={errors.IDCiudad} />

            {/* Planta */}
            <Form.Group className="mb-3">
              <Form.Label>Planta</Form.Label>
              <Form.Select>
                <option value="">Seleccione planta</option>
                <option value="m1">M1</option>
              </Form.Select>
            </Form.Group>

            {/* Tanque */}
            <Form.Group className="mb-3">
              <Form.Label>Tanque</Form.Label>
              <Form.Select>
                <option value="">Seleccione tanque</option>
                <option value="1">Tanque 1</option>
              </Form.Select>
            </Form.Group>

            {/* Fecha y Hora */}
            <Row className="mb-3">
              <Col xs={6}>
                <Form.Group>
                  <Form.Label>Fecha</Form.Label>
                  <Form.Control
                    type="date"
                    {...register("Fecha", { required: true })}
                  />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label>Hora</Form.Label>
                  <Form.Control
                    type="time"
                    {...register("Hora", { required: true })}
                  />
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
                    inputMode="decimal"
                    {...register("Temperatura")}
                  />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label>Altura (cms)</Form.Label>
                  <Form.Control
                    type="number"
                    inputMode="numeric"
                    {...register("AlturaCms")}
                  />
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
