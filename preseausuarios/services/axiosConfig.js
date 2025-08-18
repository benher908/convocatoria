import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ¡CRÍTICO para cookies HttpOnly! Permite el envío y recepción de cookies
});

// Interceptor para manejar errores de respuesta (opcional pero recomendado para depuración)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('Axios Interceptor: Error en la respuesta del backend:', error.response.status, error.response.data);
      if (error.response.status === 401) {
        console.error('Axios Interceptor: Sesión no autorizada o expirada. La cookie puede ser inválida.');
        // Aquí no hay un store global, así que la redirección/limpieza de estado
        // debe ser manejada por los componentes que consumen la API.
      }
    } else if (error.request) {
      console.error('Axios Interceptor: No se recibió respuesta del backend. Posiblemente el backend no está corriendo o hay un problema de CORS.', error.message);
    } else {
      console.error('Axios Interceptor: Error al configurar la solicitud:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
