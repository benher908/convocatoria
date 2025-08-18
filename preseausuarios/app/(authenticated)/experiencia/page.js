// 'use client' se usa en Next.js para indicar que este componente debe ser renderizado en el cliente.
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../services/axiosConfig';
import styles from '../../../styles/experiencia.module.css'; 

export default function Experiencia() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [experiencias, setExperiencias] = useState([]); 
  const [datosExperiencia, setDatosExperiencia] = useState({
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
          console.log("ExperienciaPage: Usuario no autenticado, redirigiendo a /login.");
          router.push('/login');
          return; 
        }
        const user = authResponse.data;
        setCurrentUser(user);

        
        await fetchExperiencias(user.id);

      } catch (err) {
        console.error("ExperienciaPage: Error al cargar datos iniciales:", err);
        
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

  
  const fetchExperiencias = async (id_aspirante) => {
    try {
      const response = await api.get(`/experiencias/${id_aspirante}`);
      setExperiencias(response.data.data); 
      console.log('ExperienciaPage: Experiencias cargadas:', response.data.data);
    } catch (err) {
      console.error('ExperienciaPage: Error al obtener experiencias:', err);
    
      if (err.response && err.response.status === 404) {
        setExperiencias([]); 
      } else {
        setError(`Error al cargar experiencias: ${err.response?.data?.message || err.message}`);
      }
    }
  };


  const handleChange = (e) => {
    const { name, value, files } = e.target; 
    if (name === 'evidencia_file') { 
      setDatosExperiencia((prev) => ({ ...prev, evidencia_file: files[0] })); 
    } else {
      setDatosExperiencia((prev) => ({ ...prev, [name]: value })); 
    }
  };

  const toggleFormulario = () => {
    setMostrarFormulario(!mostrarFormulario); 
    
    if (mostrarFormulario) {
      setDatosExperiencia({ titulo: '', descripcion: '', evidencia_file: null });
      setMensaje('');
      setError('');
    }
  };

  const guardarExperiencia = async (e) => {
    e.preventDefault(); 
    setMensaje(''); 
    setError('');

    
    if (!datosExperiencia.titulo.trim() || !datosExperiencia.descripcion.trim() || !datosExperiencia.evidencia_file) {
      setError('Por favor completa todos los campos (título, descripción y archivo de evidencia).');
      return;
    }
    
    if (!currentUser || !currentUser.id) {
        setError("No se pudo obtener el ID del usuario para guardar la experiencia.");
        return;
    }

    try {
      
      const dataToSend = new FormData();
      dataToSend.append('titulo', datosExperiencia.titulo);
      dataToSend.append('descripcion', datosExperiencia.descripcion);
      if (datosExperiencia.evidencia_file) {
        
        dataToSend.append('evidencia_file', datosExperiencia.evidencia_file);
      }

      console.log('ExperienciaPage: FormData a enviar:');
      for (let pair of dataToSend.entries()) {
        console.log(pair[0]+ ': ' + pair[1]);
      }

      
      const response = await api.post(`/experiencias/${currentUser.id}`, dataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data', 
        },
      });

      if (response.status === 201) { 
        setMensaje(response.data.message);
        
        setExperiencias(prev => [...prev, response.data.data]);
        
        setDatosExperiencia({ titulo: '', descripcion: '', evidencia_file: null });
        setMostrarFormulario(false);
      } else {
        setError(`Error al guardar experiencia: ${response.data.message || 'Error desconocido'}`);
      }
    } catch (err) {
      console.error("ExperienciaPage: Error al enviar el formulario:", err);
      setError(`Error del servidor: ${err.response?.data?.message || err.message || 'Error desconocido'}`);
    }
  };

  const eliminarExperiencia = async (id_experiencia) => {
    setMensaje('');
    setError('');
    
    if (!currentUser || !currentUser.id) {
        setError("No se pudo obtener el ID del usuario para eliminar la experiencia.");
        return;
    }
    
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta experiencia laboral?')) {
      return; 
    }

    try {
      
      const response = await api.delete(`/experiencias/${currentUser.id}/${id_experiencia}`);
      if (response.status === 200) {
        setMensaje(response.data.message);
        
        setExperiencias(prev => prev.filter(exp => exp.id !== id_experiencia));
      } else {
        setError(`Error al eliminar experiencia: ${response.data.message || 'Error desconocido'}`);
      }
    } catch (err) {
      console.error("ExperienciaPage: Error al eliminar experiencia:", err);
      setError(`Error del servidor al eliminar: ${err.response?.data?.message || err.message || 'Error desconocido'}`);
    }
  };


  if (loadingPage) {
    return (
      <div className={styles.container}>
        <h1>Cargando experiencias...</h1>
        <p>Por favor, espera.</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className={styles.container}>
        <h1>Acceso Denegado</h1>
        <p>Necesitas iniciar sesión para ver tus experiencias.</p>
        <button onClick={() => router.push('/login')}>Ir a Iniciar Sesión</button>
      </div>
    );
  }


  return (
    <div className={styles.container}>
      
      {mensaje && <p className={styles.successMessage}>{mensaje}</p>}
      {error && <p className={styles.errorMessage}>{error}</p>}

      <div className={styles.formSection}>
        <h2>Experiencia Laboral</h2>
      
        <button className={styles.agregarBtn} onClick={toggleFormulario}>
          {mostrarFormulario ? '- Ocultar Formulario' : '+ Agregar Experiencia'}
        </button>

        
        {mostrarFormulario && (
          <form onSubmit={guardarExperiencia} className={styles.form}>
            <fieldset>
              <legend>Nueva Experiencia</legend>
              <label htmlFor="titulo">Título</label>
              <input type="text" id="titulo" name="titulo" value={datosExperiencia.titulo} onChange={handleChange} required />
              <label htmlFor="descripcion">Descripción</label>
              <textarea id="descripcion" name="descripcion" value={datosExperiencia.descripcion} onChange={handleChange} required maxLength="400" />
              <label htmlFor="evidencia_file">Evidencia (PDF)</label>
              
              <input type="file" id="evidencia_file" name="evidencia_file" accept="application/pdf" onChange={handleChange} required />
            </fieldset>
            <button type="submit" className={styles.saveButton}>Guardar Experiencia</button>
          </form>
        )}

        
        <div className={styles.experienciasLista}> 
          {experiencias.length === 0 ? (
            <p>No hay experiencias laborales registradas aún.</p>
          ) : (
            experiencias.map((exp, idx) => (
              
              <div className={styles.experienciaCard} key={exp.id || idx}> 
                <h3>{exp.titulo}</h3>
                <p>{exp.descripcion}</p>
                
                {exp.url && (
                  <div
                    className={styles.contenedorPdf} 
                    onClick={() => {
                      console.log('ExperienciaPage: Click en contenedorPdf. Redirigiendo a PDF:', exp.url);
                      window.open(exp.url, '_blank'); 
                    }}
                    role="button" 
                    tabIndex="0" 
                  >
                    <embed
                      src={`${exp.url}#toolbar=0&navpanes=0&scrollbar=0`} 
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
                  onClick={() => eliminarExperiencia(exp.id)}
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