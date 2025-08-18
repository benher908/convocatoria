// 'use client' se usa en Next.js para indicar que este componente debe ser renderizado en el cliente.
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../services/axiosConfig'; 
import styles from '../../../styles/investigacion.module.css'; 

export default function Investigacion() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [investigaciones, setInvestigaciones] = useState([]); 
  const [datosInvestigacion, setDatosInvestigacion] = useState({
    titulo: '',
    descripcion: '',
    evidencia_file: null, 
  });
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');   

  useEffect(() => {
    const loadData = async () => {
      setLoadingPage(true); 
      try {
        
        const authResponse = await api.get('/auth/profile');
        
        if (!authResponse.data || !authResponse.data.id) {
          console.log("InvestigacionPage: Usuario no autenticado, redirigiendo a /login.");
          router.push('/login');
          return; 
        }
        const user = authResponse.data;
        setCurrentUser(user); 

        
        await fetchInvestigaciones(user.id);

      } catch (err) {
        console.error("InvestigacionPage: Error al cargar datos iniciales:", err);
        
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

  
  const fetchInvestigaciones = async (id_aspirante) => {
    try {
      const response = await api.get(`/investigaciones/${id_aspirante}`);
      setInvestigaciones(response.data.data); 
      console.log('InvestigacionPage: Investigaciones cargadas:', response.data.data);
    } catch (err) {
      console.error('InvestigacionPage: Error al obtener investigaciones:', err);
      
      if (err.response && err.response.status === 404) {
        setInvestigaciones([]); 
      } else {
        setError(`Error al cargar investigaciones: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'evidencia_file') { 
      setDatosInvestigacion((prev) => ({ ...prev, evidencia_file: files[0] })); 
    } else {
      setDatosInvestigacion((prev) => ({ ...prev, [name]: value })); 
    }
  };

  const toggleFormulario = () => {
    setMostrarFormulario(!mostrarFormulario); 
    if (mostrarFormulario) {
      setDatosInvestigacion({ titulo: '', descripcion: '', evidencia_file: null });
      setMensaje('');
      setError('');
    }
  };

  const guardarInvestigacion = async (e) => {
    e.preventDefault(); 
    setMensaje(''); 
    setError('');

    
    if (!datosInvestigacion.titulo.trim() || !datosInvestigacion.descripcion.trim() || !datosInvestigacion.evidencia_file) {
      setError('Por favor completa todos los campos (título, descripción y archivo de evidencia).');
      return;
    }
    
    if (!currentUser || !currentUser.id) {
        setError("No se pudo obtener el ID del usuario para guardar la investigación.");
        return;
    }

    try {
     
      const dataToSend = new FormData();
      dataToSend.append('titulo', datosInvestigacion.titulo);
      dataToSend.append('descripcion', datosInvestigacion.descripcion);
      if (datosInvestigacion.evidencia_file) {
      
        dataToSend.append('evidencia_file', datosInvestigacion.evidencia_file);
      }

      console.log('InvestigacionPage: FormData a enviar:');
      for (let pair of dataToSend.entries()) {
        console.log(pair[0]+ ': ' + pair[1]);
      }
    
      const response = await api.post(`/investigaciones/${currentUser.id}`, dataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201) { 
        setMensaje(response.data.message);
      
        setInvestigaciones(prev => [...prev, response.data.data]);
      
        setDatosInvestigacion({ titulo: '', descripcion: '', evidencia_file: null });
        setMostrarFormulario(false);
      } else {
        setError(`Error al guardar investigación: ${response.data.message || 'Error desconocido'}`);
      }
    } catch (err) {
      console.error("InvestigacionPage: Error al enviar el formulario:", err);
      setError(`Error del servidor: ${err.response?.data?.message || err.message || 'Error desconocido'}`);
    }
  };

  
  const eliminarInvestigacion = async (id_investigacion) => {
    setMensaje('');
    setError('');

    if (!currentUser || !currentUser.id) {
        setError("No se pudo obtener el ID del usuario para eliminar la investigación.");
        return;
    }
    
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta investigación?')) {
      return; 
    }

    try {
      
      const response = await api.delete(`/investigaciones/${currentUser.id}/${id_investigacion}`);
      if (response.status === 200) {
        setMensaje(response.data.message);
      
        setInvestigaciones(prev => prev.filter(inv => inv.id !== id_investigacion));
      } else {
        setError(`Error al eliminar investigación: ${response.data.message || 'Error desconocido'}`);
      }
    } catch (err) {
      console.error("InvestigacionPage: Error al eliminar investigación:", err);
      setError(`Error del servidor al eliminar: ${err.response?.data?.message || err.message || 'Error desconocido'}`);
    }
  };

  
  if (loadingPage) {
    return (
      <div className={styles.container}>
        <h1>Cargando investigaciones...</h1>
        <p>Por favor, espera.</p>
      </div>
    );
  }


  if (!currentUser) {
    return (
      <div className={styles.container}>
        <h1>Acceso Denegado</h1>
        <p>Necesitas iniciar sesión para ver tus investigaciones.</p>
        <button onClick={() => router.push('/login')}>Ir a Iniciar Sesión</button>
      </div>
    );
  }


  return (
    <div className={styles.container}>
      {/* Mostrar mensajes de éxito o error si existen */}
      {mensaje && <p className={styles.successMessage}>{mensaje}</p>}
      {error && <p className={styles.errorMessage}>{error}</p>}

      <div className={styles.formSection}>
        <h2>Investigaciones</h2>
        {/* Botón para alternar la visibilidad del formulario */}
        <button className={styles.agregarBtn} onClick={toggleFormulario}>
          {mostrarFormulario ? '- Ocultar Formulario' : '+ Agregar Investigación'}
        </button>

      
        {mostrarFormulario && (
          <form onSubmit={guardarInvestigacion} className={styles.form}>
            <fieldset>
              <legend>Nueva Investigación</legend>

              <label htmlFor="titulo">Título Investigación</label>
              <input type="text" id="titulo" name="titulo" value={datosInvestigacion.titulo} onChange={handleChange} required />

              <label htmlFor="descripcion">Descripción</label>
              <textarea id="descripcion" name="descripcion" value={datosInvestigacion.descripcion} onChange={handleChange} required maxLength="1000" />

              <label htmlFor="evidencia_file">Evidencia (PDF)</label>
              
              <input type="file" id="evidencia_file" name="evidencia_file" accept="application/pdf" onChange={handleChange} required />
            </fieldset>

            <button type="submit" className={styles.saveButton}>Guardar Investigación</button>
          </form>
        )}

        
        <div className={styles.investigacionesLista}>
          {investigaciones.length === 0 ? (
            <p>No hay investigaciones registradas aún.</p>
          ) : (
            investigaciones.map((inv, idx) => (
              
              <div className={styles.investigacionCard} key={inv.id || idx}>
                <h3>{inv.titulo}</h3>
                <p>{inv.descripcion}</p>
                
                {inv.url && (
                  <div
                    className={styles.contenedorPdf}
                    onClick={() => {
                      console.log('InvestigacionPage: Click en contenedorPdf. Redirigiendo a PDF:', inv.url);
                      window.open(inv.url, '_blank'); // Abrir el PDF en una nueva pestaña
                    }}
                    role="button" 
                    tabIndex="0" 
                  >
                    <embed
                      src={`${inv.url}#toolbar=0&navpanes=0&scrollbar=0`}
                      type="application/pdf"
                      style={{
                        width: '100%',
                        height: '150px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        pointerEvents: 'none' 
                      }}
                    />
                    <div className={styles.textoPreview}>Ver PDF completo</div>
                  </div>
                )}
                
                <button
                  className={styles.eliminarBtn}
                  onClick={() => eliminarInvestigacion(inv.id)}
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
