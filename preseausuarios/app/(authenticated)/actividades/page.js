// 'use client' se usa en Next.js para indicar que este componente debe ser renderizado en el cliente.
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../services/axiosConfig'; // Tu instancia de Axios
import styles from '../../../styles/actividades.module.css'; // Asegúrate de que esta ruta sea correcta para tus estilos

export default function Actividades() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [formVisible, setFormVisible] = useState(false); // Estado para controlar la visibilidad del formulario
  const [actividades, setActividades] = useState([]); // Actividades cargadas desde el backend
  const [actividad, setActividad] = useState({
    titulo: '',
    descripcion: '',
    archivo: null, // Guardará el objeto File para subir
  });
  const [mensaje, setMensaje] = useState(''); // Mensajes de éxito
  const [error, setError] = useState('');     // Mensajes de error

  // --- Efecto para cargar datos del usuario y actividades al inicio ---
  useEffect(() => {
    const loadData = async () => {
      setLoadingPage(true); // Indicar que la página está cargando
      try {
        // 1. Obtener usuario actual (id_aspirante) desde la API de autenticación
        const authResponse = await api.get('/auth/profile');
        // Si no hay datos de usuario o ID, redirigir al login
        if (!authResponse.data || !authResponse.data.id) {
          console.log("ActividadesPage: Usuario no autenticado, redirigiendo a /login.");
          router.push('/login');
          return; // Salir de la función si no hay usuario
        }
        const user = authResponse.data;
        setCurrentUser(user); // Establecer el usuario actual

        // 2. Obtener actividades existentes para el usuario autenticado
        await fetchActividades(user.id);

      } catch (err) {
        console.error("ActividadesPage: Error al cargar datos iniciales:", err);
        // Mostrar mensaje de error al usuario
        setError(`Error al cargar datos: ${err.response?.data?.message || err.message}`);
        // Si el error es 401 (No autorizado), redirigir al login
        if (err.response && err.response.status === 401) {
          router.push('/login');
        }
      } finally {
        setLoadingPage(false); // Finalizar el estado de carga
      }
    };

    loadData(); // Ejecutar la función de carga de datos
  }, [router]); // Dependencia: router para asegurar que se ejecuta cuando el router está listo

  // --- Función para obtener actividades desde el backend ---
  const fetchActividades = async (id_aspirante) => {
    try {
      const response = await api.get(`/actividades/${id_aspirante}`);
      setActividades(response.data.data); // Asume que el backend devuelve { data: [actividades] }
      console.log('ActividadesPage: Actividades cargadas:', response.data.data);
    } catch (err) {
      console.error('ActividadesPage: Error al obtener actividades:', err);
      // No es crítico si no hay actividades (ej. 404 esperado si no hay nada aún)
      if (err.response && err.response.status === 404) {
        setActividades([]); // Si no hay actividades, dejar el array vacío
      } else {
        setError(`Error al cargar actividades: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  // --- Manejadores de eventos de formulario ---
  const handleChange = (e) => {
    // Usamos e.target.id para los inputs de texto
    setActividad({ ...actividad, [e.target.id]: e.target.value });
  };

  const handleFileChange = (e) => {
    // Manejador específico para el input de tipo file
    setActividad({ ...actividad, archivo: e.target.files[0] });
  };

  const toggleFormulario = () => {
    setFormVisible(!formVisible); // Cambiar la visibilidad del formulario
    // Limpiar formulario y mensajes cuando se oculta
    if (formVisible) {
      setActividad({ titulo: '', descripcion: '', archivo: null });
      setMensaje('');
      setError('');
    }
  };

  const guardarActividad = async (e) => {
    e.preventDefault(); // Prevenir el comportamiento por defecto del formulario
    setMensaje(''); // Limpiar mensajes anteriores
    setError('');

    // Validar que todos los campos requeridos estén completos
    if (!actividad.titulo.trim() || !actividad.descripcion.trim() || !actividad.archivo) {
      setError('Por favor completa todos los campos (título, descripción y archivo).');
      return;
    }
    // Validar que se tiene el ID del usuario
    if (!currentUser || !currentUser.id) {
        setError("No se pudo obtener el ID del usuario para guardar la actividad.");
        return;
    }

    try {
      // Crear un objeto FormData para enviar datos y el archivo
      const dataToSend = new FormData();
      dataToSend.append('titulo', actividad.titulo);
      dataToSend.append('descripcion', actividad.descripcion);
      if (actividad.archivo) {
        // 'archivo' debe coincidir con el nombre del campo esperado por Multer en el backend
        dataToSend.append('archivo', actividad.archivo);
      }

      console.log('ActividadesPage: FormData a enviar:');
      for (let pair of dataToSend.entries()) {
        console.log(pair[0]+ ': ' + pair[1]);
      }

      // Realizar la solicitud POST a la API
      // La ruta para POST es /api/actividades/:id_aspirante
      const response = await api.post(`/actividades/${currentUser.id}`, dataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data', // Importante para el envío de archivos
        },
      });

      if (response.status === 201) { // 201 Created es el código para una creación exitosa
        setMensaje(response.data.message);
        // Actualizar la lista de actividades con la nueva actividad devuelta por el backend
        setActividades(prev => [...prev, response.data.data]);
        // Limpiar el formulario y ocultarlo después de guardar
        setActividad({ titulo: '', descripcion: '', archivo: null });
        setFormVisible(false);
      } else {
        setError(`Error al guardar actividad: ${response.data.message || 'Error desconocido'}`);
      }
    } catch (err) {
      console.error("ActividadesPage: Error al enviar el formulario:", err);
      setError(`Error del servidor: ${err.response?.data?.message || err.message || 'Error desconocido'}`);
    }
  };

  // --- Manejador para eliminar una actividad ---
  const eliminarActividad = async (id_actividad) => {
    setMensaje('');
    setError('');
    // Validar que se tiene el ID del usuario
    if (!currentUser || !currentUser.id) {
        setError("No se pudo obtener el ID del usuario para eliminar la actividad.");
        return;
    }
    // Confirmación al usuario antes de eliminar
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta actividad?')) {
      return; // El usuario canceló la eliminación
    }

    try {
      // Realizar la solicitud DELETE a la API
      const response = await api.delete(`/actividades/${currentUser.id}/${id_actividad}`);
      if (response.status === 200) {
        setMensaje(response.data.message);
        // Actualizar la lista de actividades filtrando la eliminada
        setActividades(prev => prev.filter(act => act.id !== id_actividad));
      } else {
        setError(`Error al eliminar actividad: ${response.data.message || 'Error desconocido'}`);
      }
    } catch (err) {
      console.error("ActividadesPage: Error al eliminar actividad:", err);
      setError(`Error del servidor al eliminar: ${err.response?.data?.message || err.message || 'Error desconocido'}`);
    }
  };

  // --- Renderizado Condicional ---
  // Si la página está cargando, mostrar un mensaje de carga
  if (loadingPage) {
    return (
      <div className={styles.container}>
        <h1>Cargando actividades...</h1>
        <p>Por favor, espera.</p>
      </div>
    );
  }

  // Si no hay usuario autenticado después de cargar, mostrar acceso denegado
  if (!currentUser) {
    return (
      <div className={styles.container}>
        <h1>Acceso Denegado</h1>
        <p>Necesitas iniciar sesión para ver tus actividades.</p>
        <button onClick={() => router.push('/login')}>Ir a Iniciar Sesión</button>
      </div>
    );
  }

  // Renderizado principal de la página de actividades
  return (
    <div className={styles.container}>
      {/* Mostrar mensajes de éxito o error si existen */}
      {mensaje && <p className={styles.successMessage}>{mensaje}</p>}
      {error && <p className={styles.errorMessage}>{error}</p>}

      <div className={styles.formSection}>
        <h2>Actividades Extra STEM</h2>
        {/* Botón para alternar la visibilidad del formulario */}
        <button className={styles.agregarBtn} onClick={toggleFormulario}>
          {formVisible ? '- Ocultar Formulario' : '+ Agregar Actividad'}
        </button>

        {/* Formulario para agregar nueva actividad, visible solo si formVisible es true */}
        {formVisible && (
          <form onSubmit={guardarActividad} className={styles.form}>
            <fieldset>
              <legend>Nueva Actividad</legend>

              <label htmlFor="titulo">Título</label>
              <input type="text" id="titulo" value={actividad.titulo} onChange={handleChange} required />

              <label htmlFor="descripcion">Descripción</label>
              <textarea id="descripcion" value={actividad.descripcion} onChange={handleChange} required maxLength="1000" />

              <label htmlFor="archivo">Archivo (PDF)</label>
              {/* Input de tipo file para seleccionar el PDF */}
              <input type="file" id="archivo" accept="application/pdf" onChange={handleFileChange} required />
            </fieldset>

            <button type="submit" className={styles.saveButton}>Guardar Actividad</button>
          </form>
        )}

        {/* Sección para mostrar la lista de actividades existentes */}
        <div className={styles.actividadesLista}>
          {actividades.length === 0 ? (
            <p>No hay actividades extra STEM registradas aún.</p>
          ) : (
            actividades.map((act, idx) => (
              // Cada actividad se renderiza como una tarjeta
              <div className={styles.tarjetaActividad} key={act.id || idx}>
                <h3>{act.titulo}</h3>
                <p>{act.descripcion}</p>
                {/* Mostrar un embed para el PDF si existe una URL */}
                {act.url && (
                  <div
                    className={styles.contenedorPdf} // Reutilizamos el estilo contenedorPdf
                    onClick={() => {
                      console.log('ActividadesPage: Click en contenedorPdf. Redirigiendo a PDF:', act.url);
                      window.open(act.url, '_blank'); // Abrir el PDF en una nueva pestaña
                    }}
                    role="button" // Mejora la accesibilidad (indica que es un elemento interactivo)
                    tabIndex="0" // Hace que sea enfocable con teclado
                  >
                    <embed
                      src={`${act.url}#toolbar=0&navpanes=0&scrollbar=0`} // Ocultar toolbar, paneles de navegación y scrollbar del PDF
                      type="application/pdf"
                      style={{
                        width: '100%',
                        height: '150px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        pointerEvents: 'none' // Evita que el embed capture el click directamente
                      }}
                    />
                    <div className={styles.textoPreview}>Ver PDF completo</div> {/* Reutilizamos textoPreview */}
                  </div>
                )}
                {/* Botón para eliminar la actividad */}
                <button
                  className={styles.eliminarBtn}
                  onClick={() => eliminarActividad(act.id)}
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
