import { useState, useEffect } from "react";
import type { AsyncState } from "../types/errors.types";
import { handleSupabaseError } from "../errors/supabaseErrorHandler";

type SupabaseQueryFn<T> = () => PromiseLike<{
  data: T[] | null;
  error: unknown;
}>;

/**
 * Hook reutilizable para cargar catálogos (combos) desde Supabase.
 * Maneja loading, datos y errores de forma visible — nunca silencia errores.
 *
 * @param queryFn  Función que devuelve la promesa de Supabase
 * @param deps     Dependencias adicionales que re-disparan la carga (ej. un ID de ciudad)
 * @param enabled  Si es false, no ejecuta la query y retorna estado vacío (default: true)
 */
export function useComboLoader<T>(
  queryFn: SupabaseQueryFn<T>,
  deps: unknown[] = [],
  enabled = true,
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: [],
    loading: enabled,
    error: null,
  });

  useEffect(() => {
    // Si está deshabilitado, limpiar y no disparar la query
    if (!enabled) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    let cancelled = false;

    const cargar = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { data, error } = await queryFn();

        if (cancelled) return;

        if (error) {
          setState({
            data: [],
            loading: false,
            error: handleSupabaseError(error),
          });
        } else {
          setState({
            data: data ?? [],
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            data: [],
            loading: false,
            error: handleSupabaseError(err),
          });
        }
      }
    };

    cargar();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled]);

  return state;
}
