
const { pool } = require('../config/db');
const { deleteFileFromR2, getPublicUrl } = require('../utils/cloudflareUploader'); // Importa deleteFileFromR2 y getPublicUrl

// @desc    Obtener todas las actividades extra STEM de un aspirante
// @route   GET /api/actividades/:id_aspirante
// @access  Private
const getActividades = async (req, res) => {
    const id_aspirante = req.params.id_aspirante;

    
    if (req.user.id !== parseInt(id_aspirante)) {
        return res.status(403).json({ message: 'No tienes permiso para acceder a estas actividades.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT id_academica_stem, id_aspirante, titulo_actividad_extra_stem AS titulo,
                    descripcion_actividad_extra_stem AS descripcion,
                    evidencia_actividad_extra_stem AS url
                FROM actividad_extra_stem
                WHERE id_aspirante = ?
                ORDER BY id_academica_stem ASC`, 
            [id_aspirante]
        );

    
        const actividades = rows.map(row => ({
            id: row.id_academica_stem, 
            id_aspirante: row.id_aspirante,
            titulo: row.titulo,
            descripcion: row.descripcion,
            url: row.url 
        }));

        res.status(200).json({
            message: 'Actividades obtenidas exitosamente.',
            data: actividades
        });

    } catch (error) {
        console.error('Error al obtener las actividades extra STEM:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener las actividades.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// @desc    Agregar una nueva actividad extra STEM
// @route   POST /api/actividades/:id_aspirante
// @access  Private
const addActividad = async (req, res) => {
    const id_aspirante = req.params.id_aspirante;
    const { titulo, descripcion } = req.body;
    

    const evidenciaFile = req.file; 
    

    if (req.user.id !== parseInt(id_aspirante)) {
    
        if (evidenciaFile && evidenciaFile.location) {

            if (evidenciaFile.key) {
                await deleteFileFromR2(getPublicUrl(evidenciaFile.key)); 
            }
        }
        return res.status(403).json({ message: 'No tienes permiso para agregar esta actividad.' });
    }

    if (!titulo || !descripcion || !evidenciaFile) {
    
        if (evidenciaFile && evidenciaFile.key) {
                await deleteFileFromR2(getPublicUrl(evidenciaFile.key)); 
        }
        return res.status(400).json({ message: 'Faltan campos obligatorios (título, descripción, archivo).' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const evidenciaUrl = getPublicUrl(evidenciaFile.key);


        const [result] = await connection.query(
            `INSERT INTO actividad_extra_stem (
                id_aspirante,
                titulo_actividad_extra_stem,
                descripcion_actividad_extra_stem,
                evidencia_actividad_extra_stem
            ) VALUES (?, ?, ?, ?)`,
            [
                id_aspirante,
                titulo,
                descripcion,
                evidenciaUrl
            ]
        );

        await connection.commit();

        
        const [insertedRow] = await connection.query(
            `SELECT id_academica_stem AS id, id_aspirante,
                    titulo_actividad_extra_stem AS titulo,
                    descripcion_actividad_extra_stem AS descripcion,
                    evidencia_actividad_extra_stem AS url
            FROM actividad_extra_stem
            WHERE id_academica_stem = ?`,
            [result.insertId]
        );

        res.status(201).json({
            message: 'Actividad agregada exitosamente.',
            data: insertedRow[0]
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error al agregar actividad extra STEM:', error);
    
        if (evidenciaFile && evidenciaFile.key) {
            await deleteFileFromR2(getPublicUrl(evidenciaFile.key));
        }
        res.status(500).json({ message: 'Error interno del servidor al agregar la actividad.', error: error.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};


const deleteActividad = async (req, res) => {
    const id_aspirante = req.params.id_aspirante;
    const id_actividad = req.params.id_actividad;

    
    if (req.user.id !== parseInt(id_aspirante)) {
        return res.status(403).json({ message: 'No tienes permiso para eliminar esta actividad.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        
        const [activityRows] = await connection.query(
            `SELECT evidencia_actividad_extra_stem AS url
                FROM actividad_extra_stem
                WHERE id_academica_stem = ? AND id_aspirante = ?`,
            [id_actividad, id_aspirante]
        );

        if (activityRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Actividad no encontrada o no pertenece al usuario.' });
        }

        const fileUrlToDelete = activityRows[0].url;

        
        await connection.query(
            'DELETE FROM actividad_extra_stem WHERE id_academica_stem = ? AND id_aspirante = ?',
            [id_actividad, id_aspirante]
        );

        await connection.commit();

    
        if (fileUrlToDelete) {
            await deleteFileFromR2(fileUrlToDelete);
        }

        res.status(200).json({ message: 'Actividad eliminada exitosamente.' });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error al eliminar actividad extra STEM:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar la actividad.', error: error.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};


module.exports = {
    getActividades,
    addActividad,
    deleteActividad,
};
