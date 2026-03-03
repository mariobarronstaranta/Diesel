/**
 * Tipos centralizados para el manejo de errores y alertas en la aplicación.
 */

/** Variantes visuales de alerta compatibles con React Bootstrap */
export type AlertVariant = "success" | "danger" | "warning" | "info";

/** Estructura estándar de una alerta de formulario */
export interface FormAlert {
  type: AlertVariant;
  text: string;
}

/** Estado de carga de un recurso asíncrono */
export interface AsyncState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}
