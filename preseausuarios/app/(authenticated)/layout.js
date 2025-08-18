// frontend/app/(authenticated)/layout.js
"use client"; // ¡Importante para que sea un Client Component y use hooks!

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../services/axiosConfig'; // Tu instancia de Axios
import '../../styles/globals.css';
import LayoutComponent from '../../components/Layout'; // Tu Layout principal (que contiene Header y Sidebar)

// Importa los estilos que necesita este layout (para Header y Sidebar)
import '../../styles/layout.module.css';

export default function AuthenticatedLayout({ children }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Función para verificar el perfil del usuario (similar a HomePage)
  const checkUserProfile = async () => {
    console.log('AuthenticatedLayout: [DEBUG] INICIANDO checkUserProfile...');
    setLoading(true);

    try {
      console.log('AuthenticatedLayout: [DEBUG] Intentando hacer GET a /auth/profile...');
      const response = await api.get('/auth/profile');
      
      console.log('AuthenticatedLayout: [DEBUG] Petición /auth/profile COMPLETA. Status:', response.status);
      console.log('AuthenticatedLayout: [DEBUG] Datos recibidos:', response.data);

      
      if (response.data && response.data.id) { // <-- ¡CAMBIO AQUÍ! De id_aspirante a id
          setIsAuthenticated(true);
          setUser({ // Mapear los datos del backend
              id: response.data.id, // <-- ¡CAMBIO AQUÍ! De id_aspirante a id
              nombre: response.data.nombre,
              email: response.data.email, // Tu backend devuelve 'email', no 'correo_contacto' aquí
              curp: response.data.curp,
              foto_perfil: response.data.foto_perfil
          });
          console.log('...Estado de autenticación ACTUALIZADO a TRUE.');
      } else {
          console.log('...Respuesta de /auth/profile exitosa, pero datos de usuario incompletos o inesperados.');
          setIsAuthenticated(false);
          setUser(null);
      }

    } catch (error) {
      console.log('AuthenticatedLayout: [DEBUG] ERROR en checkUserProfile (catch block).');
      console.error("AuthenticatedLayout: [DEBUG] Detalles del error:", error);
      if (error.response) {
          console.error("AuthenticatedLayout: [DEBUG] Error de respuesta del servidor:", error.response.status, error.response.data);
      }
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      console.log('AuthenticatedLayout: [DEBUG] checkUserProfile ha terminado (finally block).');
      setLoading(false); // Siempre desactiva loading
    }
  };

  // useEffect para disparar la verificación al montar el componente
  useEffect(() => {
    console.log('AuthenticatedLayout: [DEBUG] useEffect principal disparado. Llamando checkUserProfile...');
    checkUserProfile();
  }, []); // Se ejecuta una sola vez al montar

  // useEffect para la lógica de redirección
  useEffect(() => {
    console.log('AuthenticatedLayout: Estado de autenticación actual para redirección:', { isAuthenticated, loading });
    if (!loading) { // Solo redirigir una vez que la carga ha terminado
      if (!isAuthenticated) { // Si no está autenticado, redirige al login
        console.log('AuthenticatedLayout: Usuario no autenticado, redirigiendo a /login');
        router.push('../(public)/login');
      }
    }
  }, [isAuthenticated, loading, router]); // Dependencias del efecto de redirección

  if (loading) {
    console.log('AuthenticatedLayout: Mostrando estado de carga...');
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontSize: '1.5em', color: '#555' }}>
        Cargando aplicación...
      </div>
    );
  }

  if (!isAuthenticated) {
    // Si no está autenticado y ya terminó de cargar, no renderiza nada aquí,
    // ya que el useEffect ya habrá redirigido.
    return null;
  }

  // Si está autenticado y cargado, renderiza el Layout principal
  console.log('AuthenticatedLayout: Usuario autenticado, renderizando LayoutComponent.');
  return (
    <LayoutComponent isAuthenticated={isAuthenticated} user={user}> {/* Pasa props a LayoutComponent */}
      {children} {/* Aquí se renderizarán las páginas protegidas */}
    </LayoutComponent>
  );
}