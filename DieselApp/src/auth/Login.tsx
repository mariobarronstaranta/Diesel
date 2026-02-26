import { useState } from "react";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { supabase } from "../supabase/client";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { data, error } = await supabase
      .from("Usuarios")
      .select("CveUsuario")
      .eq("CveUsuario", usuario)
      .eq("Password", password)
      .limit(1);

    const loginExitoso = !error && data && data.length > 0;

    // Registrar intento de login en bitácora (fire-and-forget)
    supabase
      .from("LoginBitacora")
      .insert({
        CveUsuario: usuario,
        UserAgent: navigator.userAgent,
        Exitoso: loginExitoso,
      })
      .then(({ error: logError }) => {
        if (logError) console.error("Error al registrar login:", logError);
      });

    if (!loginExitoso) {
      setError("Usuario o contraseña incorrectos");
      return;
    }

    navigate("/captura");
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{
        background: "linear-gradient(135deg, #f0ad4e 0%, #f8c471 100%)",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflow: "auto",
      }}
    >
      <Container style={{ maxWidth: "500px" }}>
        <Card className="shadow-lg border-0 rounded-4">
          <Card.Body className="p-5">
            <div className="text-center mb-4">
              <h2 className="fw-bold text-dark">Admon. de Combustibles</h2>
              <h3 className="fw-bold text-dark">Bienvenido</h3>
            </div>

            {error && (
              <Alert variant="danger" className="mb-4 text-center">
                {error}
              </Alert>
            )}

            <Form onSubmit={onLogin}>
              <Form.Group className="mb-3" controlId="formBasicEmail">
                <Form.Label className="fw-bold medium text-secondary">
                  USUARIO
                </Form.Label>
                <Form.Control
                  size="lg"
                  type="text"
                  placeholder="Ingrese su usuario"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="bg-light border-0"
                  required
                  autoFocus
                />
              </Form.Group>

              <Form.Group className="mb-4" controlId="formBasicPassword">
                <Form.Label className="fw-bold medium text-secondary">
                  CONTRASEÑA
                </Form.Label>
                <Form.Control
                  size="lg"
                  type="password"
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-light border-0"
                  required
                />
              </Form.Group>

              <div className="d-grid gap-2">
                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  className="fw-bold shadow-sm"
                  style={{
                    background: "#f0ad4e",
                    border: "none",
                    color: "white",
                  }} // Keeping the warning color feel but custom styled if needed, or just use variant="warning"
                >
                  INGRESAR
                </Button>
              </div>
            </Form>
          </Card.Body>
          <Card.Footer className="text-center bg-transparent border-0 pb-4">
            <small className="text-muted">&copy; 2026 Diesel App System</small>
          </Card.Footer>
        </Card>
      </Container>
    </div>
  );
}
