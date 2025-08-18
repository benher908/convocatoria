// frontend/app/(authenticated)/perfil/page.jsx
"use client";

import React, { useState, useEffect } from 'react';
import styles from '../../../styles/perfil.module.css';
import api from '../../../services/axiosConfig';
import { useRouter } from 'next/navigation';

export default function Perfil() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState(null);
    const [loadingPage, setLoadingPage] = useState(true);

    const [fotoSrc, setFotoSrc] = useState('/imagenes/default-avatar.png');
    const [mostrarVista, setMostrarVista] = useState(false);
    const [profileData, setProfileData] = useState({
        nombre: '', ap_paterno: '', ap_materno: '', curp: '', correo_contacto: '',
        telefono: '', fechaNacimiento: '', correoOpcional: '', sexo: '', nacionalidad: '',
        resenaCurricular: '', redSocial: '', videoUrl: '',
        evidenciaInstitucional: null,
        evidenciaIdentidad: null,
        cartaPostulacion: null,
        foto: null,
    });
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const loadUserData = async () => {
            setLoadingPage(true);
            try {
                const authResponse = await api.get('/auth/profile');
                if (authResponse.data && authResponse.data.id) {
                    const userFromAuth = authResponse.data;
                    setCurrentUser(userFromAuth);

                    setProfileData(prev => ({
                        ...prev,
                        nombre: userFromAuth.nombre || '',
                        ap_paterno: userFromAuth.ap_paterno || '',
                        ap_materno: userFromAuth.ap_materno || '',
                        curp: userFromAuth.curp || '',
                        correo_contacto: userFromAuth.correo || '',
                        telefono: userFromAuth.telefono || '',
                        fechaNacimiento: userFromAuth.fechaNacimiento || '',
                        correoOpcional: userFromAuth.correoOpcional || '',
                        sexo: userFromAuth.sexo || '',
                        nacionalidad: userFromAuth.nacionalidad || '',
                        resenaCurricular: userFromAuth.resenaCurricular || '',
                        redSocial: userFromAuth.redSocial || '',
                        videoUrl: userFromAuth.videoUrl || '',
                        evidenciaInstitucional: userFromAuth.evidenciaInstitucional || null,
                        evidenciaIdentidad: userFromAuth.evidenciaIdentidad || null,
                        cartaPostulacion: userFromAuth.cartaPostulacion || null,
                    }));

                    if (userFromAuth.foto_perfil) {
                        setFotoSrc(userFromAuth.foto_perfil);
                    }
                    setMostrarVista(userFromAuth.isProfileComplete);
                } else {
                    router.push('/login');
                }
            } catch (err) {
                console.error("PerfilPage: Error loading authentication or profile data:", err);
                setError("Error loading your profile. Please try logging in again.");
                router.push('/login');
            } finally {
                setLoadingPage(false);
            }
        };
        loadUserData();
    }, [router]);

    const mostrarFoto = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setFotoSrc(e.target.result);
                setProfileData(prev => ({ ...prev, foto: file }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            setProfileData(prev => ({ ...prev, [name]: files[0] }));
        }
    };

    const vistaArchivo = (fileUrl) => {
        if (!fileUrl || typeof fileUrl !== 'string') {
            return null;
        }

        const fileName = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
        const isImage = /\.(jpeg|jpg|png|gif|svg)$/i.test(fileUrl);
        const isPdf = /\.pdf$/i.test(fileUrl);

        return (
            <div className={styles['preview-container']}>
                {isImage && (
                    <img
                        src={fileUrl}
                        alt="Preview"
                        className={styles['preview-image']}
                        onError={(e) => { e.target.onerror = null; e.target.src = '/imagenes/file-icon.png'; }}
                    />
                )}
                {isPdf && (
                    <iframe
                        src={fileUrl}
                        className={styles['preview-iframe']}
                        title="Ver Archivo"
                    ></iframe>
                )}
                {!isImage && !isPdf && (
                    <p className={styles['unsupported-file-type']}>Tipo de archivo no soportado para previsualización.</p>
                )}
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className={styles['view-file-link']}>
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
            setError("Could not get user ID to save profile.");
            return;
        }

        try {
            const dataToSend = new FormData();
            dataToSend.append('telefono', profileData.telefono || '');
            dataToSend.append('fechaNacimiento', profileData.fechaNacimiento || '');
            dataToSend.append('correoOpcional', profileData.correoOpcional || '');
            dataToSend.append('sexo', profileData.sexo || '');
            dataToSend.append('nacionalidad', profileData.nacionalidad || '');
            dataToSend.append('resenaCurricular', profileData.resenaCurricular || '');
            dataToSend.append('redSocial', profileData.redSocial || '');
            dataToSend.append('videoUrl', profileData.videoUrl || '');

            if (profileData.foto instanceof File) dataToSend.append('foto', profileData.foto);
            if (profileData.evidenciaInstitucional instanceof File) dataToSend.append('evidenciaInstitucional', profileData.evidenciaInstitucional);
            if (profileData.evidenciaIdentidad instanceof File) dataToSend.append('evidenciaIdentidad', profileData.evidenciaIdentidad);
            if (profileData.cartaPostulacion instanceof File) dataToSend.append('cartaPostulacion', profileData.cartaPostulacion);

            const response = await api.put(`/profile/${currentUser.id}`, dataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 200) {
                setMensaje("Profile updated successfully.");
                setProfileData(prev => ({
                    ...prev,
                    ...response.data.profile,
                    foto: null,
                    evidenciaInstitucional: null,
                    evidenciaIdentidad: null,
                    cartaPostulacion: null,
                }));

                if (response.data.profile.foto_perfil) {
                    setFotoSrc(response.data.profile.foto_perfil);
                }
                setMostrarVista(true);
            } else {
                setError(`Error saving profile: ${response.data.message || 'Unknown error'}`);
            }
        } catch (err) {
            console.error("PerfilPage: Error submitting profile form:", err);
            setError(`Server error: ${err.response?.data?.message || err.message || 'Unknown error'}`);
        }
    };

    if (loadingPage) {
        return (
            <div className={styles.container}>
                <h1>Loading profile...</h1>
                <p>Please wait.</p>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className={styles.container}>
                <h1>Access Denied</h1>
                <p>You need to log in to view your profile.</p>
                <button onClick={() => router.push('/login')}>Go to Login</button>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {mensaje && <p className={styles.successMessage}>{mensaje}</p>}
            {error && <p className={styles.errorMessage}>{error}</p>}

            <div className={styles.toggleButtons}>
                <button className={!mostrarVista ? styles.activeTab : ''} onClick={() => setMostrarVista(false)}>Editar Perfil</button>
                <button className={mostrarVista ? styles.activeTab : ''} onClick={() => setMostrarVista(true)}>Ver Perfil</button>
            </div>

            <div className={styles['form-section']} style={{ display: mostrarVista ? 'none' : 'block' }}>
                <h2>Editar Perfil</h2>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles['foto-perfil-container']}>
                        <img src={fotoSrc} alt="Profile Photo" className={styles['foto-perfil']} id="previewFoto" />
                        <label htmlFor="foto" className={styles['subir-foto-label']}>Foto de perfil</label>
                        <input
                            type="file"
                            id="foto"
                            name="foto"
                            accept="image/*"
                            className={styles['subir-foto-input']}
                            onChange={mostrarFoto}
                        />
                    </div>
                    <fieldset>
                        <legend>Informacion Personal </legend>
                        <label>Nombre</label>
                        <input type="text" name="nombre" value={currentUser.nombre} disabled className={styles.formInputDisabled} />
                        <label>Apellido Paterno</label>
                        <input type="text" name="ap_paterno" value={currentUser.ap_paterno} disabled className={styles.formInputDisabled} />
                        <label>Apellido Materno</label>
                        <input type="text" name="ap_materno" value={currentUser.ap_materno} disabled className={styles.formInputDisabled} />
                        <label>CURP</label>
                        <input type="text" name="curp" maxLength="18" value={currentUser.curp} disabled className={styles.formInputDisabled} />
                        <label>Correo de Contacto</label>
                        <input type="email" name="correo_contacto" value={currentUser.correo} disabled className={styles.formInputDisabled} />
                        <label htmlFor="telefono">Numero de Telefono </label>
                        <input type="tel" id="telefono" name="telefono" value={profileData.telefono} onChange={handleChange} />
                        <label htmlFor="fechaNacimiento">Fecha de Nacimiento</label>
                        <input type="date" id="fechaNacimiento" name="fechaNacimiento" value={profileData.fechaNacimiento} onChange={handleChange} />
                        <label htmlFor="correoOpcional">Correo Adicional</label>
                        <input type="email" id="correoOpcional" name="correoOpcional" value={profileData.correoOpcional} onChange={handleChange} />
                        <label htmlFor="sexo">Sexo</label>
                        <select id="sexo" name="sexo" value={profileData.sexo} onChange={handleChange}>
                            <option value="">Seleccionar</option>
                            <option value="Femenino">Femenino</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Otro">Otro</option>
                        </select>
                        <label htmlFor="nacionalidad">Nacionalidad</label>
                        <input type="text" id="nacionalidad" name="nacionalidad" value={profileData.nacionalidad} onChange={handleChange} />
                    </fieldset>
                    <fieldset>
                        <legend>Información Adicional</legend>
                        <label htmlFor="resenaCurricular">Reseña Curricular</label>
                        <textarea id="resenaCurricular" name="resenaCurricular" maxLength="1000" value={profileData.resenaCurricular} onChange={handleChange}></textarea>
                        <label htmlFor="redSocial">Red Social (URL)</label>
                        <input type="text" id="redSocial" name="redSocial" value={profileData.redSocial} onChange={handleChange} />
                        <label htmlFor="videoUrl">Video (URL)</label>
                        <input type="text" id="videoUrl" name="videoUrl" value={profileData.videoUrl} onChange={handleChange} />
                    </fieldset>
                    <fieldset>
                        <legend>Evidencias</legend>
                        <label htmlFor="evidenciaInstitucional">Evidencia Institucional {profileData.evidenciaInstitucional && '(File uploaded)'}</label>
                        <input type="file" id="evidenciaInstitucional" name="evidenciaInstitucional" accept="image/*,application/pdf" onChange={handleFileChange} />
                        <label htmlFor="evidenciaIdentidad">Evidencia de Indentidad {profileData.evidenciaIdentidad && '(File uploaded)'}</label>
                        <input type="file" id="evidenciaIdentidad" name="evidenciaIdentidad" accept="image/*,application/pdf" onChange={handleFileChange} />
                        <label htmlFor="cartaPostulacion">Carta de Postulacion {profileData.cartaPostulacion && '(File uploaded)'}</label>
                        <input type="file" id="cartaPostulacion" name="cartaPostulacion" accept="image/*,application/pdf" onChange={handleFileChange} />
                    </fieldset>
                    <button type="submit" className={styles.saveButton}>Guardar Perfil</button>
                </form>
            </div>
            <div className={styles['vista-perfil']} style={{ display: mostrarVista ? 'flex' : 'none' }}>
                <h2>Perfil</h2>
                <img className={styles['foto-perfil-view']} src={fotoSrc} alt="Profile Photo" />
                <div className={styles['nombre-aspirante']}>{profileData.nombre} {profileData.ap_paterno} {profileData.ap_materno}</div>
                <div className={styles['tarjeta-perfil']}>
                    <h3>Información General</h3>
                    <div className={styles.campo}><label>Numero de Telefono:</label><p>{profileData.telefono || 'N/A'}</p></div>
                    <div className={styles.campo}><label>Correo Adicional:</label><p>{profileData.correoOpcional || 'N/A'}</p></div>
                    <div className={styles.campo}><label>Fecha de Nacimiento:</label><p>{profileData.fechaNacimiento || 'N/A'}</p></div>
                    <div className={styles.campo}><label>Sexo:</label><p>{profileData.sexo || 'N/A'}</p></div>
                    <div className={styles.campo}><label>Nacionalidad:</label><p>{profileData.nacionalidad || 'N/A'}</p></div>
                    <div className={styles.campo}><label>CURP:</label><p>{currentUser.curp || 'N/A'}</p></div>
                </div>
                <div className={styles['tarjeta-perfil']}>
                    <h3>Redes Sociales y Video</h3>
                    <div className={styles.campo}><label>Red Social</label><p className={styles['link-text']}>{profileData.redSocial ? <a href={profileData.redSocial} target="_blank" rel="noopener noreferrer">{profileData.redSocial}</a> : 'N/A'}</p></div>
                    <div className={styles.campo}><label>Video:</label><p className={styles['link-text']}>{profileData.videoUrl ? <a href={profileData.videoUrl} target="_blank" rel="noopener noreferrer">{profileData.videoUrl}</a> : 'N/A'}</p></div>
                </div>
                <div className={styles['tarjeta-perfil']}>
                    <h3>Reseña Curricular</h3>
                    <div className={styles.campo}><p className={styles['resena-text']}>{profileData.resenaCurricular || 'N/A'}</p></div>
                </div>
                <div className={styles['tarjeta-perfil']}>
                    <h3>Archivos para subir</h3>
                    <div className={styles.campo}>
                        <label>Evidencia institucional:</label>
                        {vistaArchivo(profileData.evidenciaInstitucional)}
                    </div>
                    <div className={styles.campo}>
                        <label>Evidencia de Identidad:</label>
                        {vistaArchivo(profileData.evidenciaIdentidad)}
                    </div>
                    <div className={styles.campo}>
                        <label>Carta Postulacion:</label>
                        {vistaArchivo(profileData.cartaPostulacion)}
                    </div>
                </div>
                <button onClick={() => setMostrarVista(false)} className={styles.editButton}>Edit Profile</button>
            </div>
        </div>
    );
}