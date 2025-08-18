// backend/controllers/profileController.js
const { pool } = require('../config/db');
const { deleteFileFromR2, getPublicUrl } = require('../utils/cloudflareUploader'); 


const checkProfileCompleteness = (aspiranteData, profileData, redSocialData) => {
    const requiredProfileFields = [
        'telefono_contacto', 'fecha_nacimiento', 'correo_personal_opcional', 'sexo',
        'nacionalidad', 'resenia_curricular', 'video_postulacion',
        'evidencia_institucional', 'evidencia_identidad', 'evidencia_carta_postulacion'
    ];

    let isComplete = true;

    
    if (!profileData) {
        return false;
    }

    
    for (const field of requiredProfileFields) {
        if (!profileData[field] || (typeof profileData[field] === 'string' && profileData[field].trim() === '')) {
            isComplete = false;
            break;
        }
    }

    
    if (isComplete && (!aspiranteData.foto_perfil || (typeof aspiranteData.foto_perfil === 'string' && aspiranteData.foto_perfil.trim() === ''))) {
        isComplete = false;
    }

    
    if (isComplete && (!redSocialData || !redSocialData.link_red_social || redSocialData.link_red_social.trim() === '')) {
        isComplete = false;
    }

    return isComplete;
};


const getFullUserProfile = async (req, res) => {
    const id_aspirante = req.params.id; 

    if (req.user.id !== parseInt(id_aspirante)) {
        return res.status(403).json({ message: 'No tienes permiso para acceder a este perfil.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();

    
        const [aspiranteRows] = await connection.query('SELECT id_aspirante AS id, nombre, ap_paterno, ap_materno, curp, correo_contacto AS correo, foto_perfil FROM aspirante WHERE id_aspirante = ?', [id_aspirante]);
        if (aspiranteRows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        const userData = aspiranteRows[0];

        
        const [perfilRows] = await connection.query('SELECT * FROM perfil_aspirante WHERE id_aspirante = ?', [id_aspirante]);
        const profileData = perfilRows.length > 0 ? perfilRows[0] : null;

        let redSocialData = null;
        if (profileData && profileData.id_red_social) {
            const [redSocialRows] = await connection.query('SELECT nombre_red_social, link_red_social FROM redes_sociales WHERE id_red_social = ?', [profileData.id_red_social]);
            redSocialData = redSocialRows.length > 0 ? redSocialRows[0] : null;
        }

        
        const isProfileComplete = checkProfileCompleteness(userData, profileData, redSocialData);

        
        const mappedProfileData = {
            telefono: profileData ? (profileData.telefono_contacto || '') : '',
            fechaNacimiento: profileData && profileData.fecha_nacimiento ? profileData.fecha_nacimiento.toISOString().split('T')[0] : '',
            correoOpcional: profileData ? (profileData.correo_personal_opcional || '') : '',
            sexo: profileData ? (profileData.sexo || '') : '',
            nacionalidad: profileData ? (profileData.nacionalidad || '') : '',
            resenaCurricular: profileData ? (profileData.resenia_curricular || '') : '',
            redSocial: redSocialData ? (redSocialData.link_red_social || '') : '', // Obtiene el enlace de redes_sociales
            videoUrl: profileData ? (profileData.video_postulacion || '') : '',
            evidenciaInstitucional: profileData ? (profileData.evidencia_institucional || null) : null, // URL de R2
            evidenciaIdentidad: profileData ? (profileData.evidencia_identidad || null) : null, // URL de R2
            cartaPostulacion: profileData ? (profileData.evidencia_carta_postulacion || null) : null, // URL de R2
        };



        res.status(200).json({
            ...userData,
            ...mappedProfileData,
            foto_perfil: userData.foto_perfil || '/imagenes/default-avatar.png', 
            isProfileComplete: isProfileComplete 
        });

    } catch (err) {
        console.error('Error al obtener el perfil de usuario:', err);
        res.status(500).json({ message: 'Error interno del servidor al obtener el perfil.', error: err.message });
    } finally {
        if (connection) connection.release();
    }
};



const updateUserProfile = async (req, res) => {
    const id_aspirante = req.params.id;


    if (req.user.id !== parseInt(id_aspirante)) {
        return res.status(403).json({ message: 'No tienes permiso para actualizar este perfil.' });
    }

    const {
        telefono,
        fechaNacimiento,
        correoOpcional,
        sexo,
        nacionalidad,
        resenaCurricular,
        redSocial, 
        videoUrl,
    } = req.body;


    const fotoUrl = req.files && req.files['foto'] ? getPublicUrl(req.files['foto'][0].key) : null;
    const evidenciaInstitucionalUrl = req.files && req.files['evidenciaInstitucional'] ? getPublicUrl(req.files['evidenciaInstitucional'][0].key) : null;
    const evidenciaIdentidadUrl = req.files && req.files['evidenciaIdentidad'] ? getPublicUrl(req.files['evidenciaIdentidad'][0].key) : null;
    const cartaPostulacionUrl = req.files && req.files['cartaPostulacion'] ? getPublicUrl(req.files['cartaPostulacion'][0].key) : null;



    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        
        const [currentAspiranteRows] = await connection.query(
            'SELECT foto_perfil FROM aspirante WHERE id_aspirante = ?',
            [id_aspirante]
        );
        const currentAspiranteFoto = currentAspiranteRows.length > 0 ? currentAspiranteRows[0].foto_perfil : null;

        const [currentProfileRows] = await connection.query(
            'SELECT * FROM perfil_aspirante WHERE id_aspirante = ?',
            [id_aspirante]
        );
        const currentProfile = currentProfileRows.length > 0 ? currentProfileRows[0] : null;

        let currentRedSocialData = null;
        if (currentProfile && currentProfile.id_red_social) {
            const [redSocialRows] = await connection.query('SELECT * FROM redes_sociales WHERE id_red_social = ?', [currentProfile.id_red_social]);
            currentRedSocialData = redSocialRows.length > 0 ? redSocialRows[0] : null;
        }

        
        let id_red_social_fk = null;
        if (redSocial && redSocial.trim() !== '') {
            
            let inferredSocialName = 'Enlace Personal';
            if (redSocial.includes('facebook.com')) inferredSocialName = 'Facebook';
            else if (redSocial.includes('linkedin.com')) inferredSocialName = 'LinkedIn';
            else if (redSocial.includes('twitter.com') || redSocial.includes('x.com')) inferredSocialName = 'Twitter/X';
            else if (redSocial.includes('instagram.com')) inferredSocialName = 'Instagram';
            else if (redSocial.includes('github.com')) inferredSocialName = 'GitHub';

            
            const [existingRedSocial] = await connection.query(
                'SELECT id_red_social FROM redes_sociales WHERE id_aspirante = ? AND link_red_social = ?',
                [id_aspirante, redSocial]
            );

            if (existingRedSocial.length > 0) {
                
                id_red_social_fk = existingRedSocial[0].id_red_social;
                
                await connection.query(
                    'UPDATE redes_sociales SET nombre_red_social = ? WHERE id_red_social = ?',
                    [inferredSocialName, id_red_social_fk]
                );
            } else {
                
                const [insertResult] = await connection.query(
                    'INSERT INTO redes_sociales (id_aspirante, nombre_red_social, link_red_social) VALUES (?, ?, ?)',
                    [id_aspirante, inferredSocialName, redSocial]
                );
                id_red_social_fk = insertResult.insertId;
            }
        } else {
        
            id_red_social_fk = null;
        }

        const profileFields = {
            telefono_contacto: telefono || null,
            fecha_nacimiento: fechaNacimiento || null,
            correo_personal_opcional: correoOpcional || null,
            sexo: sexo || null,
            nacionalidad: nacionalidad || null,
            resenia_curricular: resenaCurricular || null,
            video_postulacion: videoUrl || null,
            id_red_social: id_red_social_fk, 
        };

        
        if (evidenciaInstitucionalUrl) {
            if (currentProfile && currentProfile.evidencia_institucional) {
                await deleteFileFromR2(currentProfile.evidencia_institucional);
            }
            profileFields.evidencia_institucional = evidenciaInstitucionalUrl;
        }
        if (evidenciaIdentidadUrl) {
            if (currentProfile && currentProfile.evidencia_identidad) {
                await deleteFileFromR2(currentProfile.evidencia_identidad);
            }
            profileFields.evidencia_identidad = evidenciaIdentidadUrl;
        }
        if (cartaPostulacionUrl) {
            if (currentProfile && currentProfile.evidencia_carta_postulacion) {
                await deleteFileFromR2(currentProfile.evidencia_carta_postulacion);
            }
            profileFields.evidencia_carta_postulacion = cartaPostulacionUrl;
        }

    
        if (fotoUrl) {
            if (currentAspiranteFoto) {
                await deleteFileFromR2(currentAspiranteFoto);
            }
            await connection.query(
                'UPDATE aspirante SET foto_perfil = ? WHERE id_aspirante = ?',
                [fotoUrl, id_aspirante]
            );
        }

        if (currentProfile) {
            
            const updateFields = Object.keys(profileFields)
                .map(key => `${key} = ?`)
                .join(', ');
            const updateValues = Object.values(profileFields);
            updateValues.push(id_aspirante);

            if (updateFields) {
                await connection.query(
                    `UPDATE perfil_aspirante SET ${updateFields} WHERE id_aspirante = ?`,
                    updateValues
                );
                console.log(`Perfil actualizado para aspirante ${id_aspirante}`);
            }

        } else {
        
            const insertFields = Object.keys(profileFields);
            const insertValues = Object.values(profileFields);

            insertFields.unshift('id_aspirante');
            insertValues.unshift(id_aspirante);

            await connection.query(
                `INSERT INTO perfil_aspirante (${insertFields.join(', ')}) VALUES (${insertValues.map(() => '?').join(', ')})`,
                insertValues
            );
            console.log(`Nuevo perfil creado para aspirante ${id_aspirante}`);
        }

        await connection.commit();

        
        const [updatedAspiranteData] = await connection.query('SELECT id_aspirante AS id, nombre, ap_paterno, ap_materno, curp, correo_contacto AS correo, foto_perfil FROM aspirante WHERE id_aspirante = ?', [id_aspirante]);
        const [updatedPerfilData] = await connection.query('SELECT * FROM perfil_aspirante WHERE id_aspirante = ?', [id_aspirante]);

        const fullAspirante = updatedAspiranteData[0];
        const fullProfile = updatedPerfilData[0];

        let updatedRedSocialData = null;
        if (fullProfile && fullProfile.id_red_social) {
            const [redSocialRows] = await connection.query('SELECT nombre_red_social, link_red_social FROM redes_sociales WHERE id_red_social = ?', [fullProfile.id_red_social]);
            updatedRedSocialData = redSocialRows.length > 0 ? redSocialRows[0] : null;
        }

        
        const isProfileComplete = checkProfileCompleteness(fullAspirante, fullProfile, updatedRedSocialData);


        const responseProfile = {
            id: fullAspirante.id,
            nombre: fullAspirante.nombre,
            ap_paterno: fullAspirante.ap_paterno,
            ap_materno: fullAspirante.ap_materno,
            curp: fullAspirante.curp,
            correo: fullAspirante.correo,
            foto_perfil: fullAspirante.foto_perfil || '/imagenes/default-avatar.png',
            telefono: fullProfile ? fullProfile.telefono_contacto : '',
            fechaNacimiento: fullProfile && fullProfile.fecha_nacimiento ? fullProfile.fecha_nacimiento.toISOString().split('T')[0] : '',
            correoOpcional: fullProfile ? fullProfile.correo_personal_opcional : '',
            sexo: fullProfile ? fullProfile.sexo : '',
            nacionalidad: fullProfile ? fullProfile.nacionalidad : '',
            resenaCurricular: fullProfile ? fullProfile.resenia_curricular : '',
            redSocial: updatedRedSocialData ? updatedRedSocialData.link_red_social : '', // Obtiene el enlace de redes_sociales
            videoUrl: fullProfile ? fullProfile.video_postulacion : '',
            evidenciaInstitucional: fullProfile ? fullProfile.evidencia_institucional : null,
            evidenciaIdentidad: fullProfile ? fullProfile.evidencia_identidad : null,
            cartaPostulacion: fullProfile ? fullProfile.evidencia_carta_postulacion : null,
            isProfileComplete: isProfileComplete, // Envía el estado de completitud actualizado
        };



        res.status(200).json({
            message: 'Profile saved successfully.',
            profile: responseProfile
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error al guardar el perfil:', error);
        
        if (fotoUrl) await deleteFileFromR2(fotoUrl);
        if (evidenciaInstitucionalUrl) await deleteFileFromR2(evidenciaInstitucionalUrl);
        if (evidenciaIdentidadUrl) await deleteFileFromR2(evidenciaIdentidadUrl);
        if (cartaPostulacionUrl) await deleteFileFromR2(cartaPostulacionUrl);

        res.status(500).json({ message: 'Error interno del servidor al guardar el perfil.', error: error.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

module.exports = {
    getFullUserProfile,
    updateUserProfile,
};