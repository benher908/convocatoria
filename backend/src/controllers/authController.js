const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { deleteFileFromR2, getPublicUrl } = require('../utils/cloudflareUploader'); 

const jwtSecret = process.env.JWT_SECRET || 'supersecretjwtkey';


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



const registerUser = async (req, res) => {
    const {
        nombre, ap_paterno, ap_materno, curp, correo_contacto, password,
        id_region_procedencia, id_categoria, id_institucion,
    } = req.body;

    
    const fotoUrl = req.file ? getPublicUrl(req.file.key) : null; 

    let connection;
    try {
        connection = await pool.getConnection();


        if (
            !nombre || !ap_paterno || !curp || !correo_contacto || !password ||
            !id_region_procedencia || !id_categoria || !id_institucion
        ) {
            
            if (fotoUrl) {
                await deleteFileFromR2(fotoUrl);
            }
            return res.status(400).json({ message: 'Faltan campos obligatorios para el registro o son inválidos.' });
        }

        const [existingUsers] = await connection.execute(
            'SELECT id_aspirante FROM aspirante WHERE correo_contacto = ? OR curp = ? LIMIT 1',
            [correo_contacto, curp]
        );

        if (existingUsers.length > 0) {
            
            if (fotoUrl) {
                await deleteFileFromR2(fotoUrl);
            }
            return res.status(400).json({ message: 'El usuario ya existe con ese correo electrónico o CURP.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await connection.execute(
            `INSERT INTO aspirante (
                nombre, ap_paterno, ap_materno, curp, correo_contacto, password,
                id_region_procedencia, id_categoria, id_institucion, foto_perfil
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nombre,
                ap_paterno,
                ap_materno === undefined || ap_materno === null || ap_materno.trim() === '' ? null : ap_materno,
                curp,
                correo_contacto,
                hashedPassword,
                id_region_procedencia,
                id_categoria,
                id_institucion,
                fotoUrl 
            ]
        );

        const newUser = {
            id: result.insertId,
            nombre,
            correo_contacto,
        };

        if (newUser.id) {
            res.status(201).json({
                message: "Usuario registrado exitosamente",
                id: newUser.id,
                email: newUser.correo_contacto,
                nombre: newUser.nombre,
            });
        } else {
            res.status(400).json({ message: 'Datos de usuario inválidos o no se pudo crear el usuario.' });
        }
    } catch (error) {
        console.error('Error en el registro de usuario:', error);

        if (fotoUrl) {
            await deleteFileFromR2(fotoUrl);
        }
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'El CURP o correo electrónico ya están registrados.' });
        }
        res.status(500).json({ message: 'Error interno del servidor al registrar el usuario.' });
    } finally {
        if (connection) connection.release();
    }
};


const loginUser = async (req, res) => {
    const { email, password } = req.body;

    console.log('Login Backend: Email recibido:', email);

    let connection;
    try {
        connection = await pool.getConnection();

        const normalizedEmail = email ? email.toLowerCase().trim() : null;
        console.log('Login Backend: Email normalizado para la búsqueda:', normalizedEmail);

        const [users] = await connection.execute(
            'SELECT id_aspirante, nombre, ap_paterno, ap_materno, curp, correo_contacto, password, foto_perfil FROM aspirante WHERE correo_contacto = ? LIMIT 1',
            [normalizedEmail]
        );

        const user = users[0];

        if (!user) {
            console.log('Login Backend: Usuario NO encontrado en la base de datos.');
            return res.status(401).json({ message: 'Email o contraseña inválidos.' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const token = jwt.sign({ id: user.id_aspirante }, jwtSecret, { expiresIn: '1h' });

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 3600000,
                sameSite: 'Lax',
                path: '/',
            });

        
            const [perfilRows] = await connection.query('SELECT * FROM perfil_aspirante WHERE id_aspirante = ?', [user.id_aspirante]);
            const profileData = perfilRows.length > 0 ? perfilRows[0] : null;

            let redSocialData = null;
            if (profileData && profileData.id_red_social) {
                const [redSocialRows] = await connection.query('SELECT link_red_social FROM redes_sociales WHERE id_red_social = ?', [profileData.id_red_social]);
                redSocialData = redSocialRows.length > 0 ? redSocialRows[0] : null;
            }

            const isProfileComplete = checkProfileCompleteness(user, profileData, redSocialData);
            


            res.json({
                message: 'Inicio de sesión exitoso',
                id: user.id_aspirante,
                nombre: user.nombre,
                ap_paterno: user.ap_paterno,
                ap_materno: user.ap_materno,
                curp: user.curp,
                correo: user.correo_contacto,
                foto_perfil: user.foto_perfil || '/imagenes/default-avatar.png',
                isProfileComplete: isProfileComplete, // Envía el estado de completitud
                // Envía también los datos de perfil para evitar otra llamada
                telefono: profileData ? profileData.telefono_contacto : '',
                fechaNacimiento: profileData && profileData.fecha_nacimiento ? profileData.fecha_nacimiento.toISOString().split('T')[0] : '',
                correoOpcional: profileData ? profileData.correo_personal_opcional : '',
                sexo: profileData ? profileData.sexo : '',
                nacionalidad: profileData ? profileData.nacionalidad : '',
                resenaCurricular: profileData ? profileData.resenia_curricular : '',
                redSocial: redSocialData ? redSocialData.link_red_social : '', // Obtiene el enlace de redes_sociales
                videoUrl: profileData ? profileData.video_postulacion : '',
                evidenciaInstitucional: profileData ? profileData.evidencia_institucional : null,
                evidenciaIdentidad: profileData ? profileData.evidencia_identidad : null,
                cartaPostulacion: profileData ? profileData.evidencia_carta_postulacion : null,
            });
            console.log('Login Backend: Inicio de sesión exitoso, cookie establecida.');
        } else {
            console.log('Login Backend: bcrypt.compare() devolvió FALSE (contraseña no coincide).');
            res.status(401).json({ message: 'Email o contraseña inválidos.' });
        }
    } catch (error) {
        console.error('Login Backend: Error general en el login:', error);
        res.status(500).json({ message: 'Error interno del servidor al intentar iniciar sesión.' });
    } finally {
        if (connection) connection.release();
    }
};


const getUserProfile = async (req, res) => {
    
    const id_aspirante = req.user.id;

    let connection;
    try {
        connection = await pool.getConnection();

        // Obtener datos del aspirante
        const [aspiranteRows] = await connection.query('SELECT id_aspirante AS id, nombre, ap_paterno, ap_materno, curp, correo_contacto AS correo, foto_perfil FROM aspirante WHERE id_aspirante = ?', [id_aspirante]);
        if (aspiranteRows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        const userData = aspiranteRows[0];

    
        const [perfilRows] = await connection.query('SELECT * FROM perfil_aspirante WHERE id_aspirante = ?', [id_aspirante]);
        const profileData = perfilRows.length > 0 ? perfilRows[0] : null;

        let redSocialData = null;
        if (profileData && profileData.id_red_social) {
            const [redSocialRows] = await connection.query('SELECT link_red_social FROM redes_sociales WHERE id_red_social = ?', [profileData.id_red_social]);
            redSocialData = redSocialRows.length > 0 ? redSocialRows[0] : null;
        }

        const isProfileComplete = checkProfileCompleteness(userData, profileData, redSocialData);


        res.status(200).json({
            ...userData,
            foto_perfil: userData.foto_perfil || '/imagenes/default-avatar.png', 
            isProfileComplete: isProfileComplete,
            
            telefono: profileData ? profileData.telefono_contacto : '',
            fechaNacimiento: profileData && profileData.fecha_nacimiento ? profileData.fecha_nacimiento.toISOString().split('T')[0] : '',
            correoOpcional: profileData ? profileData.correo_personal_opcional : '',
            sexo: profileData ? profileData.sexo : '',
            nacionalidad: profileData ? profileData.nacionalidad : '',
            resenaCurricular: profileData ? profileData.resenia_curricular : '',
            redSocial: redSocialData ? redSocialData.link_red_social : '', 
            videoUrl: profileData ? profileData.video_postulacion : '',
            evidenciaInstitucional: profileData ? profileData.evidencia_institucional : null,
            evidenciaIdentidad: profileData ? profileData.evidencia_identidad : null,
            cartaPostulacion: profileData ? profileData.evidencia_carta_postulacion : null,
        });

    } catch (err) {
        console.error('Error al obtener el perfil de usuario:', err);
        res.status(500).json({ message: 'Error interno del servidor al obtener el perfil.' });
    } finally {
        if (connection) connection.release();
    }
};

// @desc    Cerrar sesión (eliminar cookie)
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0), 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        path: '/',
    });
    res.status(200).json({ message: 'Sesión cerrada exitosamente.' });
    console.log('Logout Backend: Cookie de token eliminada.');
};


module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    logoutUser,
};
