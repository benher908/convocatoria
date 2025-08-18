// 'use client' se usa en Next.js para indicar que este componente debe ser renderizado en el cliente.
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../services/axiosConfig'; 
import styles from '../../../styles/logros.module.css'; 

export default function Logros() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [logros, setLogros] = useState([]); 
  const [datosLogro, setDatosLogro] = useState({
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
        
        const authResponse = await api.get('/api/auth/profile');
        
        if (!authResponse.data || !authResponse.data.id) {
          console.log("LogrosPage: Usuario no autenticado, redirigiendo a /login.");
          router.push('/login');
          return; 
        }
        const user = authResponse.data;
        setCurrentUser(user); 

        
        await fetchLogros(user.id);

      } catch (err) {
        console.error("LogrosPage: Error al cargar datos iniciales:", err);
        
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


  const fetchLogros = async (id_aspirante) => {
    try {
      const response = await api.get(`/api/logros/${id_aspirante}`);
      setLogros(response.data.data);
      console.log('LogrosPage: Logros cargados:', response.data.data);
    } catch (err) {
      console.error('LogrosPage: Error al obtener logros:', err);
    
      if (err.response && err.response.status === 404) {
        setLogros([]); 
      } else {
        setError(`Error al cargar logros: ${err.response?.data?.message || err.message}`);
      }
    }
  };


  const handleChange = (e) => {
    const { id, value, files } = e.target;
    if (id === 'evidencia_file') {
      setDatosLogro((prev) => ({ ...prev, evidencia_file: files[0] })); 
    } else {
      setDatosLogro((prev) => ({ ...prev, [id]: value })); 
    }
  };

  const toggleFormulario = () => {
    setMostrarFormulario(!mostrarFormulario); 
    
    if (mostrarFormulario) {
      setDatosLogro({ titulo: '', descripcion: '', evidencia_file: null });
      setMensaje('');
      setError('');
    }
  };

  const guardarLogro = async (e) => {
    e.preventDefault(); 
    setMensaje('');
    setError('');

    
    if (!datosLogro.titulo.trim() || !datosLogro.descripcion.trim() || !datosLogro.evidencia_file) {
      setError('Por favor completa todos los campos (título, descripción y archivo de evidencia).');
      return;
    }
  
    if (!currentUser || !currentUser.id) {
        setError("No se pudo obtener el ID del usuario para guardar el logro.");
        return;
    }

    try {
    
      const dataToSend = new FormData();
      dataToSend.append('titulo', datosLogro.titulo);
      dataToSend.append('descripcion', datosLogro.descripcion);
      if (datosLogro.evidencia_file) {
      
        dataToSend.append('evidencia_file', datosLogro.evidencia_file);
      }

      console.log('LogrosPage: FormData a enviar:');
      for (let pair of dataToSend.entries()) {
        console.log(pair[0]+ ': ' + pair[1]);
      }

    
      const response = await api.post(`/api/logros/${currentUser.id}`, dataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data', 
        },
      });

      if (response.status === 201) { 
        setMensaje(response.data.message);
        
        setLogros(prev => [...prev, response.data.data]);
        
        setDatosLogro({ titulo: '', descripcion: '', evidencia_file: null });
        setMostrarFormulario(false);
      } else {
        setError(`Error al guardar logro: ${response.data.message || 'Error desconocido'}`);
      }
    } catch (err) {
      console.error("LogrosPage: Error al enviar el formulario:", err);
      setError(`Error del servidor: ${err.response?.data?.message || err.message || 'Error desconocido'}`);
    }
  };


  const eliminarLogro = async (id_logro) => {
    setMensaje('');
    setError('');
  
    if (!currentUser || !currentUser.id) {
        setError("No se pudo obtener el ID del usuario para eliminar el logro.");
        return;
    }
  
    if (!window.confirm('¿Estás seguro de que quieres eliminar este logro?')) {
      return; 
    }

    try {
    
      const response = await api.delete(`/api/logros/${currentUser.id}/${id_logro}`);
      if (response.status === 200) {
        setMensaje(response.data.message);
        
        setLogros(prev => prev.filter(logro => logro.id !== id_logro));
      } else {
        setError(`Error al eliminar logro: ${response.data.message || 'Error desconocido'}`);
      }
    } catch (err) {
      console.error("LogrosPage: Error al eliminar logro:", err);
      setError(`Error del servidor al eliminar: ${err.response?.data?.message || err.message || 'Error desconocido'}`);
    }
  };

  
  if (loadingPage) {
    return (
      <div className={styles.container}>
        <h1>Cargando logros...</h1>
        <p>Por favor, espera.</p>
      </div>
    );
  }


  if (!currentUser) {
    return (
      <div className={styles.container}>
        <h1>Acceso Denegado</h1>
        <p>Necesitas iniciar sesión para ver tus logros.</p>
        <button onClick={() => router.push('/login')}>Ir a Iniciar Sesión</button>
      </div>
    );
  }


  return (
    <div className={styles.container}>

      {mensaje && <p className={styles.successMessage}>{mensaje}</p>}
      {error && <p className={styles.errorMessage}>{error}</p>}

      <div className={styles.formSection}>
        <h2>Logros</h2>
      
        <button className={styles.agregarBtn} onClick={toggleFormulario}>
          {mostrarFormulario ? '- Ocultar Formulario' : '+ Agregar Logro'}
        </button>

      
        {mostrarFormulario && (
          <form onSubmit={guardarLogro} className={styles.form}>
            <fieldset>
              <legend>Nuevo Logro</legend>

              <label htmlFor="titulo">Título del Logro</label>
              <input type="text" id="titulo" value={datosLogro.titulo} onChange={handleChange} required />

              <label htmlFor="descripcion">Descripción</label>
              <textarea id="descripcion" value={datosLogro.descripcion} onChange={handleChange} required maxLength="1000" />

              <label htmlFor="evidencia_file">Evidencia (PDF)</label>
              {/* Input de tipo file para seleccionar el PDF */}
              <input type="file" id="evidencia_file" accept="application/pdf" onChange={handleChange} required />
            </fieldset>

            <button type="submit" className={styles.saveButton}>Guardar Logro</button>
          </form>
        )}

      
        <div className={styles.logrosLista}>
          {logros.length === 0 ? (
            <p>No hay logros registrados aún.</p>
          ) : (
            logros.map((logro, idx) => (
              // Cada logro se renderiza como una tarjeta
              <div className={styles.logroCard} key={logro.id || idx}>
                <h3>{logro.titulo}</h3>
                <p>{logro.descripcion}</p>
                
                {logro.url && (
                  <div
                    className={styles.contenedorPdf} 
                    onClick={() => {
                      console.log('LogrosPage: Click en contenedorPdf. Redirigiendo a PDF:', logro.url);
                      window.open(logro.url, '_blank'); 
                    }}
                    role="button" 
                    tabIndex="0" 
                  >
                    <embed
                      src={`${logro.url}#toolbar=0&navpanes=0&scrollbar=0`} 
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
                  onClick={() => eliminarLogro(logro.id)}
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