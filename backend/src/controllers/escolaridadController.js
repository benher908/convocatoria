const { pool } = require('../config/db');
const { deleteFileFromR2, getPublicUrl } = require('../utils/cloudflareUploader');
const { addInstitutionToDB } = require('../services/institutionService');


const checkEscolaridadCompleteness = (escolaridadData) => {
    const requiredFields = [
        'id_institucion', 'nivel_estudios', 'estado_grado', 'fecha_emision',
        'constancia_url', 'titulo_file_url', 'cedula_file_url'
    ];

    if (!escolaridadData) {
        return false;
    }

    for (const field of requiredFields) {
        if (!escolaridadData[field] || (typeof escolaridadData[field] === 'string' && escolaridadData[field].trim() === '')) {
            console.log(`Escolaridad incompleta: falta o está vacío el campo '${field}'`);
            return false;
        }
    }
    return true;
};


const getEscolaridad = async (req, res) => {
    const id_aspirante = req.params.id_aspirante;

    if (req.user.id !== parseInt(id_aspirante)) {
        return res.status(403).json({ message: 'No tienes permiso para acceder a esta información de escolaridad.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT es.*, i.nombre_institucion
                FROM escolaridad es
                JOIN institucion i ON es.id_institucion = i.id_institucion
                WHERE es.id_aspirante = ?`,
            [id_aspirante]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Datos de escolaridad no encontrados para este aspirante.' });
        }

        const escolaridadData = rows[0];
        
        const isEscolaridadComplete = checkEscolaridadCompleteness(escolaridadData);

        const mappedEscolaridadData = {
            id_escolaridad: escolaridadData.id_escolaridad,
            id_aspirante: escolaridadData.id_aspirante,
            institucion: escolaridadData.nombre_institucion,
            id_institucion: escolaridadData.id_institucion,
            nivel: escolaridadData.nivel_estudios,
            titulo_obtenido: escolaridadData.titulo_obtenido || '',
            estado: escolaridadData.estado_grado,
            cedula_profesional: escolaridadData.cedula_profesional || '',
            fecha: escolaridadData.fecha_emision ? escolaridadData.fecha_emision.toISOString().split('T')[0] : '',
            constanciaUrl: escolaridadData.constancia_url,
            tituloUrl: escolaridadData.titulo_file_url,
            cedulaUrl: escolaridadData.cedula_file_url,
            isComplete: isEscolaridadComplete
        };

        res.status(200).json({
            message: 'Datos de escolaridad obtenidos exitosamente.',
            data: mappedEscolaridadData
        });

    } catch (error) {
        console.error('Error al obtener los datos de escolaridad:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener la escolaridad.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};


const upsertEscolaridad = async (req, res) => {
    const {
        id_aspirante,
        id_institucion,
        nivel_estudios,
        titulo_obtenido,
        estado_grado,
        cedula_profesional,
        fecha_emision,
        newInstitutionName,
        newInstitutionStateId,
        newInstitutionType
    } = req.body;

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        let final_id_institucion = null;

        if (newInstitutionName && newInstitutionName.trim() !== '') {
            if (!newInstitutionStateId || !newInstitutionType) {
                throw new Error("El estado y el tipo de la nueva institución son obligatorios.");
            }
            const newInst = await addInstitutionToDB(newInstitutionName, newInstitutionStateId, newInstitutionType);
            final_id_institucion = newInst.id_institucion;
        } else {
            final_id_institucion = id_institucion;
        }

        const [existingEscolaridad] = await connection.query(
            'SELECT * FROM escolaridad WHERE id_aspirante = ?',
            [id_aspirante]
        );

        const escolaridadExists = existingEscolaridad.length > 0;
        const currentEscolaridad = escolaridadExists ? existingEscolaridad[0] : null;

        const escolaridadFields = {
            id_institucion: final_id_institucion,
            nivel_estudios: nivel_estudios || null,
            titulo_obtenido: titulo_obtenido || null,
            estado_grado: estado_grado || null,
            cedula_profesional: cedula_profesional || null,
            fecha_emision: fecha_emision || null,
        };

        const constanciaUrl = req.files && req.files['constancia_file'] ? getPublicUrl(req.files['constancia_file'][0].key) : null;
        const tituloUrl = req.files && req.files['titulo_file'] ? getPublicUrl(req.files['titulo_file'][0].key) : null;
        const cedulaUrl = req.files && req.files['cedula_file'] ? getPublicUrl(req.files['cedula_file'][0].key) : null;

        escolaridadFields.constancia_url = constanciaUrl || currentEscolaridad?.constancia_url || null;
        if (constanciaUrl && currentEscolaridad && currentEscolaridad.constancia_url && constanciaUrl !== currentEscolaridad.constancia_url) {
            await deleteFileFromR2(currentEscolaridad.constancia_url);
        }

        escolaridadFields.titulo_file_url = tituloUrl || currentEscolaridad?.titulo_file_url || null;
        if (tituloUrl && currentEscolaridad && currentEscolaridad.titulo_file_url && tituloUrl !== currentEscolaridad.titulo_file_url) {
            await deleteFileFromR2(currentEscolaridad.titulo_file_url);
        }

        escolaridadFields.cedula_file_url = cedulaUrl || currentEscolaridad?.cedula_file_url || null;
        if (cedulaUrl && currentEscolaridad && currentEscolaridad.cedula_file_url && cedulaUrl !== currentEscolaridad.cedula_file_url) {
            await deleteFileFromR2(currentEscolaridad.cedula_file_url);
        }

        let result;
        if (escolaridadExists) {
            const updateFields = Object.keys(escolaridadFields).map(key => `${key} = ?`).join(', ');
            const updateValues = Object.values(escolaridadFields);
            updateValues.push(id_aspirante);

            result = await connection.query(
                `UPDATE escolaridad SET ${updateFields} WHERE id_aspirante = ?`,
                updateValues
            );
        } else {
            const insertFields = Object.keys(escolaridadFields);
            const insertValues = Object.values(escolaridadFields);

            insertFields.unshift('id_aspirante');
            insertValues.unshift(id_aspirante);

            result = await connection.query(
                `INSERT INTO escolaridad (${insertFields.join(', ')}) VALUES (${insertValues.map(() => '?').join(', ')})`,
                insertValues
            );
        }

        await connection.commit();

        const [updatedEscolaridadRows] = await connection.query(
            `SELECT es.*, i.nombre_institucion
                FROM escolaridad es
                LEFT JOIN institucion i ON es.id_institucion = i.id_institucion
                WHERE es.id_aspirante = ?`,
            [id_aspirante]
        );

        if (updatedEscolaridadRows.length === 0) {
            throw new Error("No se pudo recuperar el registro de escolaridad después de la operación.");
        }

        const updatedEscolaridadData = updatedEscolaridadRows[0];
        const isEscolaridadComplete = checkEscolaridadCompleteness(updatedEscolaridadData);

        const responseEscolaridad = {
            id_escolaridad: updatedEscolaridadData.id_escolaridad,
            id_aspirante: updatedEscolaridadData.id_aspirante,
            institucion: updatedEscolaridadData.nombre_institucion,
            id_institucion: updatedEscolaridadData.id_institucion,
            nivel: updatedEscolaridadData.nivel_estudios,
            titulo_obtenido: updatedEscolaridadData.titulo_obtenido || '',
            estado: updatedEscolaridadData.estado_grado,
            cedula_profesional: updatedEscolaridadData.cedula_profesional || '',
            fecha: updatedEscolaridadData.fecha_emision ? updatedEscolaridadData.fecha_emision.toISOString().split('T')[0] : '',
            constanciaUrl: updatedEscolaridadData.constancia_url,
            tituloUrl: updatedEscolaridadData.titulo_file_url,
            cedulaUrl: updatedEscolaridadData.cedula_file_url,
            isComplete: isEscolaridadComplete
        };

        res.status(escolaridadExists ? 200 : 201).json({
            message: `Datos de escolaridad ${escolaridadExists ? 'actualizados' : 'creados'} exitosamente.`,
            data: responseEscolaridad
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        if (constanciaUrl) await deleteFileFromR2(constanciaUrl);
        if (tituloUrl) await deleteFileFromR2(tituloUrl);
        if (cedulaUrl) await deleteFileFromR2(cedulaUrl);

        if (error.message.includes('institución')) {
            return res.status(error.message.includes('existe') ? 409 : 400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno del servidor al guardar la escolaridad.', error: error.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};


const getInstitutions = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT id_institucion, nombre_institucion FROM institucion ORDER BY nombre_institucion ASC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor al obtener instituciones.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    getEscolaridad,
    upsertEscolaridad,
    getInstitutions,
};