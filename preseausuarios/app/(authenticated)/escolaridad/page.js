// frontend/app/(authenticated)/escolaridad/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../services/axiosConfig';
import styles from '../../../styles/escolaridad.module.css';

export default function Escolaridad() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState(null);
    const [loadingPage, setLoadingPage] = useState(true);
    const [vistaActiva, setVistaActiva] = useState(false);

    const [instituciones, setInstituciones] = useState([]);
    const [showAddInstitution, setShowAddInstitution] = useState(false);
    const [newInstitutionName, setNewInstitutionName] = useState('');

    const [datosEscolaridad, setDatosEscolaridad] = useState({
        id_escolaridad: null,
        id_aspirante: '',
        institucion: '',
        id_institucion: '',
        nivel: '',
        titulo_obtenido: '',
        estado: '',
        cedula_profesional: '',
        fecha: '',
        constanciaUrl: null,
        tituloUrl: null,
        cedulaUrl: null,
        constancia_file: null,
        titulo_file: null,
        cedula_file: null,
    });

    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const loadData = async () => {
            setLoadingPage(true);
            try {
                const authResponse = await api.get('/auth/profile');
                if (!authResponse.data || !authResponse.data.id) {
                    router.push('/login');
                    return;
                }
                const user = authResponse.data;
                setCurrentUser(user);

                const instResponse = await api.get('/institutions');
                setInstituciones(instResponse.data);

                let escolaridadData = {};
                try {
                    const escolaridadResponse = await api.get(`/escolaridad/${user.id}`);
                    escolaridadData = escolaridadResponse.data.data;

                    setDatosEscolaridad(prev => ({
                        ...prev,
                        id_aspirante: user.id,
                        id_escolaridad: escolaridadData.id_escolaridad,
                        institucion: escolaridadData.institucion,
                        id_institucion: escolaridadData.id_institucion,
                        nivel: escolaridadData.nivel,
                        titulo_obtenido: escolaridadData.titulo_obtenido || '',
                        estado: escolaridadData.estado,
                        cedula_profesional: escolaridadData.cedula_profesional || '',
                        fecha: escolaridadData.fecha,
                        constanciaUrl: escolaridadData.constanciaUrl,
                        tituloUrl: escolaridadData.tituloUrl,
                        cedulaUrl: escolaridadData.cedulaUrl,
                    }));
                    
                    setVistaActiva(escolaridadData.isComplete);

                } catch (err) {
                    if (err.response && err.response.status === 404) {
                        setDatosEscolaridad(prev => ({ ...prev, id_aspirante: user.id }));
                        setVistaActiva(false);
                        setMensaje("No se encontraron datos de escolaridad existentes. Por favor, completa el formulario.");
                    } else {
                        throw err;
                    }
                }
            } catch (err) {
                console.error("EscolaridadPage: Error al cargar datos:", err);
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

    const handleChange = (e) => {
        const { id, value } = e.target;
        setDatosEscolaridad(prev => ({ ...prev, [id]: value }));
        if (id === 'id_institucion' && value !== 'add_new') {
            setShowAddInstitution(false);
            setNewInstitutionName('');
        } else if (id === 'id_institucion' && value === 'add_new') {
            setShowAddInstitution(true);
        }
    };

    const handleFileChange = (e) => {
        const { id, files } = e.target;
        if (files && files[0]) {
            setDatosEscolaridad(prev => ({ ...prev, [id]: files[0] }));
        }
    };

    const handleNewInstitutionNameChange = (e) => {
        setNewInstitutionName(e.target.value);
    };


    const vistaArchivo = (fileOrUrl, isUrl = false) => {
        if (!fileOrUrl) return null;
        const src = isUrl ? fileOrUrl : URL.createObjectURL(fileOrUrl);
        const isImage = isUrl ? /\.(jpeg|jpg|png|gif|svg)$/i.test(fileOrUrl) : (fileOrUrl.type && fileOrUrl.type.startsWith('image/'));
        const isPdf = isUrl ? /\.pdf$/i.test(fileOrUrl) : (fileOrUrl.type && fileOrUrl.type === 'application/pdf');

        return (
            <div className={styles['preview-container']}>
                {isImage && (
                    <img
                        src={src}
                        alt="Preview"
                        className={styles['preview-image']}
                        onError={(e) => { e.target.onerror = null; e.target.src = '/imagenes/file-icon.png'; }}
                    />
                )}
                {isPdf && (
                    <iframe
                        src={src}
                        className={styles['preview-iframe']}
                        title="Ver Archivo"
                    ></iframe>
                )}
                {!isImage && !isPdf && (
                    <p className={styles['unsupported-file-type']}>Tipo de archivo no soportado para previsualización.</p>
                )}
                <a href={src} target="_blank" rel="noopener noreferrer" className={styles['view-file-link']}>
                    Ver Archivo
                </a>
            </div>
        );
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje('');
        setError('');

        if (!currentUser || !currentUser.id) {
            setError("No se pudo obtener el ID del usuario para guardar la escolaridad.");
            return;
        }

        if (datosEscolaridad.id_institucion === 'add_new' && !newInstitutionName.trim()) {
            setError("Por favor, ingresa el nombre de la nueva institución.");
            return;
        }

        if (!datosEscolaridad.id_institucion) {
            setError("Por favor, selecciona una institución.");
            return;
        }

        const requiredFields = ['nivel', 'estado', 'fecha'];
        for (const field of requiredFields) {
            if (!datosEscolaridad[field]) {
                setError(`El campo '${field}' es obligatorio.`);
                return;
            }
        }

        try {
            const dataToSend = new FormData();
            dataToSend.append('id_aspirante', currentUser.id);

            if (datosEscolaridad.id_institucion === 'add_new') {
                dataToSend.append('newInstitutionName', newInstitutionName.trim());
            } else {
                dataToSend.append('id_institucion', datosEscolaridad.id_institucion);
            }

            dataToSend.append('nivel_estudios', datosEscolaridad.nivel);
            dataToSend.append('titulo_obtenido', datosEscolaridad.titulo_obtenido);
            dataToSend.append('estado_grado', datosEscolaridad.estado);
            dataToSend.append('cedula_profesional', datosEscolaridad.cedula_profesional);
            dataToSend.append('fecha_emision', datosEscolaridad.fecha);

            if (datosEscolaridad.constancia_file instanceof File) dataToSend.append('constancia_file', datosEscolaridad.constancia_file);
            if (datosEscolaridad.titulo_file instanceof File) dataToSend.append('titulo_file', datosEscolaridad.titulo_file);
            if (datosEscolaridad.cedula_file instanceof File) dataToSend.append('cedula_file', datosEscolaridad.cedula_file);

            const response = await api.post(`/escolaridad/${currentUser.id}`, dataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 200 || response.status === 201) {
                setMensaje(response.data.message);
                const updatedData = response.data.data;
                setDatosEscolaridad(prev => ({
                    ...prev,
                    id_escolaridad: updatedData.id_escolaridad,
                    institucion: updatedData.institucion,
                    id_institucion: updatedData.id_institucion,
                    nivel: updatedData.nivel,
                    titulo_obtenido: updatedData.titulo_obtenido,
                    estado: updatedData.estado,
                    cedula_profesional: updatedData.cedula_profesional,
                    fecha: updatedData.fecha,
                    constanciaUrl: updatedData.constanciaUrl,
                    tituloUrl: updatedData.tituloUrl,
                    cedulaUrl: updatedData.cedulaUrl,
                    constancia_file: null,
                    titulo_file: null,
                    cedula_file: null,
                }));
                setVistaActiva(true);
                setShowAddInstitution(false);
                setNewInstitutionName('');
            } else {
                setError(`Error al guardar escolaridad: ${response.data.message || 'Error desconocido'}`);
            }
        } catch (err) {
            console.error("EscolaridadPage: Error al enviar el formulario:", err);
            setError(`Error del servidor: ${err.response?.data?.message || err.message || 'Error desconocido'}`);
        }
    };

    if (loadingPage) {
        return (
            <div className={styles.container}>
                <h1>Cargando datos de escolaridad...</h1>
                <p>Por favor, espera.</p>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className={styles.container}>
                <h1>Acceso Denegado</h1>
                <p>Necesitas iniciar sesión para ver tu escolaridad.</p>
                <button onClick={() => router.push('/login')}>Ir a Iniciar Sesión</button>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {mensaje && <p className={styles.successMessage}>{mensaje}</p>}
            {error && <p className={styles.errorMessage}>{error}</p>}

            <div className={styles.toggleButtons}>
                <button className={!vistaActiva ? styles.activeTab : ''} onClick={() => setVistaActiva(false)}>Editar Escolaridad</button>
                <button className={vistaActiva ? styles.activeTab : ''} onClick={() => setVistaActiva(true)}>Ver Escolaridad</button>
            </div>

            {!vistaActiva ? (
                <div className={styles['form-section']} id="formulario">
                    <h2>Editar Escolaridad</h2>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <fieldset>
                            <legend>Detalles Académicos</legend>
                            <label htmlFor="id_institucion">Institución</label>
                            <select id="id_institucion" value={datosEscolaridad.id_institucion} onChange={handleChange} required>
                                <option value="">Selecciona una institución</option>
                                {instituciones.map((inst) => (
                                    <option key={inst.id_institucion} value={inst.id_institucion}>
                                        {inst.nombre_institucion}
                                    </option>
                                ))}
                                <option value="add_new">-- Agregar nueva institución --</option>
                            </select>

                            {showAddInstitution && (
                                <div className={styles['add-institution-section']}>
                                    <label htmlFor="newInstitutionName">Nombre de la Nueva Institución</label>
                                    <input
                                        type="text"
                                        id="newInstitutionName"
                                        value={newInstitutionName}
                                        onChange={handleNewInstitutionNameChange}
                                        required
                                    />
                                </div>
                            )}

                            <label htmlFor="nivel">Nivel de Estudios</label>
                            <select id="nivel" value={datosEscolaridad.nivel} onChange={handleChange} required>
                                <option value="">Selecciona un nivel</option>
                                <option value="tecnico superior universitario">Técnico Superior Universitario</option>
                                <option value="licenciatura">Licenciatura</option>
                                <option value="posgrado">Posgrado</option>
                            </select>

                            <label htmlFor="titulo_obtenido">Título Obtenido </label>
                            <input type="text" id="titulo_obtenido" value={datosEscolaridad.titulo_obtenido} onChange={handleChange} />

                            <label htmlFor="estado">Estado del Grado</label>
                            <select id="estado" value={datosEscolaridad.estado} onChange={handleChange} required>
                                <option value="">Selecciona un estado</option>
                                <option value="cursando">Cursando</option>
                                <option value="concluido">Concluido</option>
                            </select>

                            <label htmlFor="cedula_profesional">Cédula Profesional (Texto)</label>
                            <input type="text" id="cedula_profesional" value={datosEscolaridad.cedula_profesional} onChange={handleChange} />

                            <label htmlFor="fecha">Fecha de Emisión </label>
                            <input type="date" id="fecha" value={datosEscolaridad.fecha} onChange={handleChange} required />
                        </fieldset>

                        <fieldset>
                            <legend>Archivos de Evidencia</legend>
                            <label htmlFor="constancia_file">Constancia de Estudios {datosEscolaridad.constanciaUrl && '(Archivo Subido)'}</label>
                            <input type="file" id="constancia_file" accept="image/*,application/pdf" onChange={handleFileChange} />

                            <label htmlFor="titulo_file">Título Obtenido  {datosEscolaridad.tituloUrl && '(Archivo Subido)'}</label>
                            <input type="file" id="titulo_file" accept="image/*,application/pdf" onChange={handleFileChange} />

                            <label htmlFor="cedula_file">Cédula Profesional  {datosEscolaridad.cedulaUrl && '(Archivo Subido)'}</label>
                            <input type="file" id="cedula_file" accept="image/*,application/pdf" onChange={handleFileChange} />
                        </fieldset>
                        <button type="submit" className={styles.saveButton}>Guardar Escolaridad</button>
                    </form>
                </div>
            ) : (
                <div className={styles['vista-escolaridad']} id="vistaEscolaridad">
                    <h2>Mi Escolaridad</h2>
                    <div className={styles['tarjeta-perfil']}>
                        <h3>Detalles Académicos</h3>
                        <div className={styles.campo}>
                            <label>Institución:</label>
                            <p>{datosEscolaridad.institucion || 'N/A'}</p>
                        </div>
                        <div className={styles.campo}>
                            <label>Nivel de Estudios:</label>
                            <p>{datosEscolaridad.nivel || 'N/A'}</p>
                        </div>
                        <div className={styles.campo}>
                            <label>Título Obtenido :</label>
                            <p>{datosEscolaridad.titulo_obtenido || 'N/A'}</p>
                        </div>
                        <div className={styles.campo}>
                            <label>Estado del Grado:</label>
                            <p>{datosEscolaridad.estado || 'N/A'}</p>
                        </div>
                        <div className={styles.campo}>
                            <label>Cédula Profesional :</label>
                            <p>{datosEscolaridad.cedula_profesional || 'N/A'}</p>
                        </div>
                        <div className={styles.campo}>
                            <label>Fecha de Emisión:</label>
                            <p>{datosEscolaridad.fecha || 'N/A'}</p>
                        </div>
                    </div>

                    <div className={styles['tarjeta-perfil']}>
                        <h3>Archivos de Evidencia</h3>
                        <div className={styles.campo}>
                            <label>Constancia de Estudios:</label>
                            {vistaArchivo(datosEscolaridad.constanciaUrl, true)}
                        </div>
                        <div className={styles.campo}>
                            <label>Título Obtenido :</label>
                            {vistaArchivo(datosEscolaridad.tituloUrl, true)}
                        </div>
                        <div className={styles.campo}>
                            <label>Cédula Profesional :</label>
                            {vistaArchivo(datosEscolaridad.cedulaUrl, true)}
                        </div>
                    </div>
                    <button onClick={() => setVistaActiva(false)} className={styles.editButton}>Editar Escolaridad</button>
                </div>
            )}
        </div>
    );
}