const { pool } = require('../config/db');
const { deleteFileFromR2, getPublicUrl } = require('../utils/cloudflareUploader'); 


const getExperiencias = async (req, res) => {
    const id_aspirante = req.params.id_aspirante;


    if (req.user.id !== parseInt(id_aspirante)) {
        return res.status(403).json({ message: 'No tienes permiso para acceder a esta experiencia laboral.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        const [rows] = await connection.query(
            'SELECT id_experiencia_laboral AS id, titulo_experiencia_laboral AS titulo, descripcion_experiencia_laboral AS descripcion, evidencia_experiencia_laboral AS url FROM experiencia_laboral WHERE id_aspirante = ?',
            [id_aspirante]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No se encontraron experiencias laborales para este aspirante.' });
        }

        
        const mappedExperiencias = rows.map(exp => ({
            id: exp.id,
            titulo: exp.titulo,
            descripcion: exp.descripcion,
            url: exp.url,
        }));



        res.status(200).json({
            message: 'Experiencias laborales obtenidas exitosamente.',
            data: mappedExperiencias
        });

    } catch (error) {
        console.error('Error al obtener las experiencias laborales:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener las experiencias laborales.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};


const createExperiencia = async (req, res) => {
    const id_aspirante = req.params.id_aspirante;
    const { titulo, descripcion } = req.body; 
    const evidenciaFile = req.file; 


    if (req.user.id !== parseInt(id_aspirante)) {
        
        if (evidenciaFile && evidenciaFile.key) {
            const fileUrl = getPublicUrl(evidenciaFile.key);
            if (fileUrl) await deleteFileFromR2(fileUrl);
        }
        return res.status(403).json({ message: 'No tienes permiso para crear experiencia laboral para este aspirante.' });
    }

    if (!titulo || !descripcion || !evidenciaFile) {
    
        if (evidenciaFile && evidenciaFile.key) {
            const fileUrl = getPublicUrl(evidenciaFile.key);
            if (fileUrl) await deleteFileFromR2(fileUrl);
        }
        return res.status(400).json({ message: 'Faltan campos obligatorios (título, descripción o archivo de evidencia).' });
    }

    
    const evidenciaUrl = getPublicUrl(evidenciaFile.key);

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.query(
            'INSERT INTO experiencia_laboral (id_aspirante, titulo_experiencia_laboral, descripcion_experiencia_laboral, evidencia_experiencia_laboral) VALUES (?, ?, ?, ?)',
            [id_aspirante, titulo, descripcion, evidenciaUrl]
        );

        await connection.commit();

    
        const [newExperienciaRows] = await connection.query(
            'SELECT id_experiencia_laboral AS id, titulo_experiencia_laboral AS titulo, descripcion_experiencia_laboral AS descripcion, evidencia_experiencia_laboral AS url FROM experiencia_laboral WHERE id_experiencia_laboral = ?',
            [result.insertId]
        );
        const newExperiencia = newExperienciaRows[0];

        res.status(201).json({
            message: 'Experiencia laboral agregada exitosamente.',
            data: newExperiencia
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error al crear la experiencia laboral:', error);
       
        if (evidenciaFile && evidenciaFile.key) {
            const fileUrl = getPublicUrl(evidenciaFile.key);
            if (fileUrl) await deleteFileFromR2(fileUrl);
        }
        res.status(500).json({ message: 'Error interno del servidor al crear la experiencia laboral.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};


const deleteExperiencia = async (req, res) => {
    const { id_aspirante, id_experiencia_laboral } = req.params;

    
    if (req.user.id !== parseInt(id_aspirante)) {
        return res.status(403).json({ message: 'No tienes permiso para eliminar esta experiencia laboral.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

    
        const [experienciaRows] = await connection.query('SELECT evidencia_experiencia_laboral FROM experiencia_laboral WHERE id_experiencia_laboral = ? AND id_aspirante = ?', [id_experiencia_laboral, id_aspirante]);
        if (experienciaRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Experiencia laboral no encontrada o no pertenece a este aspirante.' });
        }
        const fileToDeleteUrl = experienciaRows[0].evidencia_experiencia_laboral_url;

        
        const [result] = await connection.query(
            'DELETE FROM experiencia_laboral WHERE id_experiencia_laboral = ? AND id_aspirante = ?',
            [id_experiencia_laboral, id_aspirante]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Experiencia laboral no encontrada o no se pudo eliminar.' });
        }

        
        if (fileToDeleteUrl) {
            await deleteFileFromR2(fileToDeleteUrl);
        }

        await connection.commit();
        res.status(200).json({ message: 'Experiencia laboral eliminada exitosamente.' });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error al eliminar experiencia laboral:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar la experiencia laboral.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    getExperiencias,
    createExperiencia,
    deleteExperiencia,
};
