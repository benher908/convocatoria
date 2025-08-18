// frontend/app/(authenticated)/layout.js
"use client"; 

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../services/axiosConfig'; 
import '../../styles/globals.css';
import LayoutComponent from '../../components/Layout'; 


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
      const response = await api.get('api/auth/profile');
      
      
      if (response.data && response.data.id) { 
          setIsAuthenticated(true);
          setUser({ 
              id: response.data.id, 
              nombre: response.data.nombre,
              email: response.data.email, 
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


  useEffect(() => {
    console.log('AuthenticatedLayout: [DEBUG] useEffect principal disparado. Llamando checkUserProfile...');
    checkUserProfile();
  }, []); 


  useEffect(() => {
    console.log('AuthenticatedLayout: Estado de autenticación actual para redirección:', { isAuthenticated, loading });
    if (!loading) { 
      if (!isAuthenticated) { 
        console.log('AuthenticatedLayout: Usuario no autenticado, redirigiendo a /login');
        router.push('/login');
      }
    }
  }, [isAuthenticated, loading, router]); 

  if (loading) {
    console.log('AuthenticatedLayout: Mostrando estado de carga...');
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontSize: '1.5em', color: '#555' }}>
        Cargando aplicación...
      </div>
    );
  }

  if (!isAuthenticated) {
   
    return null;
  }


  console.log('AuthenticatedLayout: Usuario autenticado, renderizando LayoutComponent.');
  return (
    <LayoutComponent isAuthenticated={isAuthenticated} user={user}> 
      {children} 
    </LayoutComponent>
  );
}