import { useState, useCallback } from "react";
import type { FormAlert } from "../types/errors.types";

/**
 * Hook reutilizable para manejar el estado de alertas en formularios.
 * Reemplaza el patrón repetitivo de useState<{type, text} | null> en cada componente.
 *
 * Uso:
 *   const { alert, showSuccess, showError, clearAlert } = useFormAlert();
 */
export function useFormAlert() {
  const [alert, setAlert] = useState<FormAlert | null>(null);

  const showSuccess = useCallback((text: string) => {
    setAlert({ type: "success", text });
  }, []);

  const showError = useCallback((text: string) => {
    setAlert({ type: "danger", text });
  }, []);

  const showWarning = useCallback((text: string) => {
    setAlert({ type: "warning", text });
  }, []);

  const clearAlert = useCallback(() => {
    setAlert(null);
  }, []);

  return { alert, showSuccess, showError, showWarning, clearAlert };
}
