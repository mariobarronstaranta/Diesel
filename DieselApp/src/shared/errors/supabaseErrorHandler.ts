import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Mapeo de códigos de error PostgreSQL a mensajes en español amigables para el usuario.
 * Referencia: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
const PG_ERROR_MESSAGES: Record<string, string> = {
  "23505": "Ya existe un registro con esos datos (valor duplicado).",
  "23503":
    "El registro referenciado no existe. Verifique los datos seleccionados.",
  "23502":
    "Faltan datos obligatorios. Por favor complete todos los campos requeridos.",
  "23514": "Los datos ingresados no cumplen con las reglas de validación.",
  "42501": "No tiene permisos para realizar esta operación.",
  PGRST301: "La sesión ha expirado. Por favor inicie sesión nuevamente.",
};

/**
 * Frases clave en mensajes de Supabase/PostgREST que indican errores comunes.
 */
function matchByMessage(message: string): string | null {
  const lower = message.toLowerCase();
  if (lower.includes("row-level security") || lower.includes("rls"))
    return "No tiene permisos para realizar esta operación.";
  if (lower.includes("jwt expired") || lower.includes("session expired"))
    return "La sesión ha expirado. Por favor inicie sesión nuevamente.";
  if (lower.includes("network") || lower.includes("fetch"))
    return "Error de conexión. Verifique su conexión a internet e intente de nuevo.";
  return null;
}

/**
 * Convierte un PostgrestError de Supabase en un mensaje amigable para el usuario.
 * Nunca expone detalles técnicos internos al usuario final.
 *
 * @param error  El error devuelto por Supabase (puede ser PostgrestError, Error, o unknown)
 * @returns      Mensaje legible en español para mostrar al usuario
 */
export function handleSupabaseError(error: unknown): string {
  // Error tipado de Supabase/PostgREST
  if (error && typeof error === "object" && "code" in error) {
    const pgError = error as PostgrestError;

    // Primero buscar por código exacto
    if (pgError.code && PG_ERROR_MESSAGES[pgError.code]) {
      return PG_ERROR_MESSAGES[pgError.code];
    }

    // Luego analizar el mensaje
    if (pgError.message) {
      const match = matchByMessage(pgError.message);
      if (match) return match;
    }

    // Fallback con código para que se pueda reportar
    if (pgError.code) {
      return `Error al procesar la solicitud (código: ${pgError.code}). Contacte al administrador.`;
    }
  }

  // Error nativo de JavaScript (ej. network failure)
  if (error instanceof Error) {
    const match = matchByMessage(error.message);
    if (match) return match;
  }

  // Fallback genérico
  return "Ocurrió un error inesperado. Por favor intente de nuevo o contacte al administrador.";
}
