'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../services/axiosConfig'; 
import styles from '../../../styles/habilidades.module.css';

export default function Habilidades() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [habilidades, setHabilidades] = useState([]); 
  const [datosHabilidad, setDatosHabilidad] = useState({
    titulo: '',
    descripcion: '',
    porcentaje: 0,
  });
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

 
  useEffect(() => {
    const loadData = async () => {
      setLoadingPage(true);
      try {
        
        const authResponse = await api.get('/api/auth/profile');
        if (!authResponse.data || !authResponse.data.id) {
          console.log("HabilidadesPage: Usuario no autenticado, redirigiendo a /login.");
          router.push('/login');
          return;
        }
        const user = authResponse.data;
        setCurrentUser(user);

        
        await fetchHabilidades(user.id);

      } catch (err) {
        console.error("HabilidadesPage: Error al cargar datos iniciales:", err);
        setError(`Error al cargar datos: ${err.response?.data?.message || err.message}`);
        if (err.response && err.response.status === 401) {
          router.push('/login'); 
        }
      } finally {
        setLoadingPage(false);
      }
    };

    loadData();
  }, [router]);

 
  const fetchHabilidades = async (id_aspirante) => {
    try {
      const response = await api.get(`/api/habilidades/${id_aspirante}`);
      setHabilidades(response.data.data); 
      console.log('HabilidadesPage: Habilidades cargadas:', response.data.data);
    } catch (err) {
      console.error('HabilidadesPage: Error al obtener habilidades:', err);
    
      if (err.response && err.response.status === 404) {
        setHabilidades([]);
      } else {
        setError(`Error al cargar habilidades: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatosHabilidad((prev) => ({ ...prev, [name]: value }));
  };

  const toggleFormulario = () => {
    setMostrarFormulario(!mostrarFormulario);
    
    if (mostrarFormulario) {
      setDatosHabilidad({ titulo: '', descripcion: '', porcentaje: 0 });
      setMensaje('');
      setError('');
    }
  };

  const guardarHabilidad = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    if (!datosHabilidad.titulo.trim() || !datosHabilidad.descripcion.trim() || datosHabilidad.porcentaje === undefined || datosHabilidad.porcentaje === null) {
      setError('Por favor completa todos los campos (título, descripción y porcentaje).');
      return;
    }
    if (!currentUser || !currentUser.id) {
        setError("No se pudo obtener el ID del usuario para guardar la habilidad.");
        return;
    }

    try {
      
      const response = await api.post(`/api/habilidades/${currentUser.id}`, datosHabilidad); 

      if (response.status === 201) { 
        setMensaje(response.data.message);
        
        setHabilidades(prev => [...prev, response.data.data]);
        setDatosHabilidad({ titulo: '', descripcion: '', porcentaje: 0 }); 
        setMostrarFormulario(false); 
      } else {
        setError(`Error al guardar habilidad: ${response.data.message || 'Error desconocido'}`);
      }
    } catch (err) {
      console.error("HabilidadesPage: Error al enviar el formulario:", err);
      setError(`Error del servidor: ${err.response?.data?.message || err.message || 'Error desconocido'}`);
    }
  };

  
  const eliminarHabilidad = async (id_habilidad) => {
    setMensaje('');
    setError('');
    if (!currentUser || !currentUser.id) {
        setError("No se pudo obtener el ID del usuario para eliminar la habilidad.");
        return;
    }
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta habilidad?')) {
      return; 
    }

    try {
      const response = await api.delete(`/api/habilidades/${currentUser.id}/${id_habilidad}`);
      if (response.status === 200) {
        setMensaje(response.data.message);
    
        setHabilidades(prev => prev.filter(hab => hab.id !== id_habilidad));
      } else {
        setError(`Error al eliminar habilidad: ${response.data.message || 'Error desconocido'}`);
      }
    } catch (err) {
      console.error("HabilidadesPage: Error al eliminar habilidad:", err);
      setError(`Error del servidor al eliminar: ${err.response?.data?.message || err.message || 'Error desconocido'}`);
    }
  };

  
  if (loadingPage) {
    return (
      <div className={styles.container}>
        <h1>Cargando habilidades...</h1>
        <p>Por favor, espera.</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className={styles.container}>
        <h1>Acceso Denegado</h1>
        <p>Necesitas iniciar sesión para ver tus habilidades.</p>
        <button onClick={() => router.push('/login')}>Ir a Iniciar Sesión</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {mensaje && <p className={styles.successMessage}>{mensaje}</p>}
      {error && <p className={styles.errorMessage}>{error}</p>}

      <div className={styles.formSection}>
        <h2>Habilidades Registradas</h2>

        <button className={styles.agregarBtn} onClick={toggleFormulario}>
          {mostrarFormulario ? '- Ocultar Formulario' : '+ Agregar Habilidad'}
        </button>

        {mostrarFormulario && (
          <form onSubmit={guardarHabilidad} className={styles.form}>
            <fieldset>
              <legend>Agregar Habilidad</legend>

              <label htmlFor="titulo">Título Habilidad</label>
              <input type="text" id="titulo" name="titulo" value={datosHabilidad.titulo} onChange={handleChange} required />

              <label htmlFor="descripcion">Descripción</label>
              <textarea id="descripcion" name="descripcion" value={datosHabilidad.descripcion} onChange={handleChange} required maxLength="1000" />

              <label htmlFor="porcentaje">Porcentaje</label>
              <input type="number" id="porcentaje" name="porcentaje" min="0" max="100" value={datosHabilidad.porcentaje} onChange={handleChange} required />
            </fieldset>

            <button type="submit" className={styles.saveButton}>Guardar Habilidad</button>
          </form>
        )}

        <div className={styles.habilidadesLista}>
          {habilidades.length === 0 ? (
            <p>No hay habilidades registradas aún.</p>
          ) : (
            habilidades.map((habilidad) => (
              <div key={habilidad.id} className={styles.habilidadCard}>
                <h3>{habilidad.titulo}</h3>
                <p>{habilidad.descripcion}</p>
                <div className={styles.progressBarContainer}>
                  <div className={styles.progressBar} style={{ width: `${habilidad.porcentaje}%` }}>
                    {habilidad.porcentaje}%
                  </div>
                </div>
                <button
                  className={styles.eliminarBtn}
                  onClick={() => eliminarHabilidad(habilidad.id)}
                >
                  Eliminar
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
