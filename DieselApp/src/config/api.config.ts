/**
 * Configuración centralizada de APIs
 * 
 * Las URLs base se obtienen de las variables de entorno para facilitar
 * el cambio entre ambientes (desarrollo, pruebas, producción)
 */

// URL base del API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://18.207.42.217/apitest';

/**
 * Endpoints del API
 */
export const API_ENDPOINTS = {
    // Lecturas
    lecturas: {
        crear: `${API_BASE_URL}/api/lecturas/crear`,
        listar: `${API_BASE_URL}/api/lecturas`,
        obtener: (id: number) => `${API_BASE_URL}/api/lecturas/${id}`,
        actualizar: (id: number) => `${API_BASE_URL}/api/lecturas/${id}`,
        eliminar: (id: number) => `${API_BASE_URL}/api/lecturas/${id}`,
    },

    // Otros endpoints que puedas necesitar en el futuro
    // ciudades: {
    //   listar: `${API_BASE_URL}/api/ciudades`,
    // },
    // plantas: {
    //   listar: `${API_BASE_URL}/api/plantas`,
    // },
} as const;

/**
 * Configuración de headers comunes
 */
export const API_HEADERS = {
    'Content-Type': 'application/json',
} as const;

/**
 * Helper para hacer peticiones al API
 * @param url - URL del endpoint
 * @param options - Opciones de fetch
 */
export async function apiRequest<T = any>(
    url: string,
    options?: RequestInit
): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...API_HEADERS,
            ...options?.headers,
        },
    });

    const result = await response.json();
    return result;
}
