import { useState } from "react";
import {
  Container,
  Card,
  Form,
  Button,
  Alert,
} from "react-bootstrap";
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

    if (error || !data || data.length === 0) {
      setError("Usuario o contraseña incorrectos");
      return;
    }

    navigate("/captura");
  };

  return (
    <Container fluid className="p-3">
      <h4 className="text-center mb-4">Captura Diaria de Lecturas</h4>

      <Form onSubmit={onLogin}>
        <Card className="mb-3">
          <Card.Body>
            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
              </Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Usuario</Form.Label>
              <Form.Control
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
                autoFocus
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>
          </Card.Body>
        </Card>

        <div className="d-grid">
          <Button size="lg" variant="warning" type="submit">
            Entrar
          </Button>
        </div>
      </Form>
    </Container>
  );
}
