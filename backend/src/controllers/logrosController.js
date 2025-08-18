const { pool } = require('../config/db');
const { deleteFileFromR2, getPublicUrl } = require('../utils/cloudflareUploader'); 


const checkLogroCompleteness = (logroData) => {
   
    return logroData && logroData.titulo_logro && logroData.titulo_logro.trim() !== '' &&
            logroData.descripcion_logro && logroData.descripcion_logro.trim() !== '' &&
            logroData.evidencia_logro && logroData.evidencia_logro.trim() !== '';
};


const getLogros = async (req, res) => {
    const id_aspirante = req.params.id_aspirante;


    if (req.user.id !== parseInt(id_aspirante)) {
        return res.status(403).json({ message: 'No tienes permiso para acceder a estos logros.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        const [rows] = await connection.query(
            'SELECT id_logro AS id, titulo_logro AS titulo, descripcion_logro AS descripcion, evidencia_logro AS url FROM logros_aspirante WHERE id_aspirante = ?',
            [id_aspirante]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No se encontraron logros para este aspirante.' });
        }

        
        const mappedLogros = rows.map(logro => ({
            id: logro.id,
            titulo: logro.titulo,
            descripcion: logro.descripcion,
            url: logro.url,
            isComplete: checkLogroCompleteness(logro) 
        }));


        res.status(200).json({
            message: 'Logros obtenidos exitosamente.',
            data: mappedLogros
        });

    } catch (error) {
        console.error('Error al obtener los logros:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener los logros.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};


const createLogro = async (req, res) => {
    const id_aspirante = req.params.id_aspirante;
    const { titulo, descripcion } = req.body; 
    const evidenciaFile = req.file; 


    if (req.user.id !== parseInt(id_aspirante)) {
    
        if (evidenciaFile && evidenciaFile.key) {
            const fileUrl = getPublicUrl(evidenciaFile.key);
            if (fileUrl) await deleteFileFromR2(fileUrl);
        }
        return res.status(403).json({ message: 'No tienes permiso para crear logros para este aspirante.' });
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
            'INSERT INTO logros_aspirante (id_aspirante, titulo_logro, descripcion_logro, evidencia_logro) VALUES (?, ?, ?, ?)',
            [id_aspirante, titulo, descripcion, evidenciaUrl]
        );

        await connection.commit();

        const [newLogroRows] = await connection.query(
            'SELECT id_logro AS id, titulo_logro AS titulo, descripcion_logro AS descripcion, evidencia_logro AS url FROM logros_aspirante WHERE id_logro = ?',
            [result.insertId]
        );
        const newLogro = newLogroRows[0];

        res.status(201).json({
            message: 'Logro agregado exitosamente.',
            data: newLogro
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error al crear el logro:', error);
    
        if (evidenciaFile && evidenciaFile.key) {
            const fileUrl = getPublicUrl(evidenciaFile.key);
            if (fileUrl) await deleteFileFromR2(fileUrl);
        }
        res.status(500).json({ message: 'Error interno del servidor al crear el logro.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};


const deleteLogro = async (req, res) => {
    const { id_aspirante, id_logro } = req.params;


    if (req.user.id !== parseInt(id_aspirante)) {
        return res.status(403).json({ message: 'No tienes permiso para eliminar este logro.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();


        const [logroRows] = await connection.query('SELECT evidencia_logro FROM logros_aspirante WHERE id_logro = ? AND id_aspirante = ?', [id_logro, id_aspirante]);
        if (logroRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Logro no encontrado o no pertenece a este aspirante.' });
        }
        const fileToDeleteUrl = logroRows[0].evidencia_logro_url;


        const [result] = await connection.query(
            'DELETE FROM logros_aspirante WHERE id_logro = ? AND id_aspirante = ?',
            [id_logro, id_aspirante]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Logro no encontrado o no se pudo eliminar.' });
        }

    
        if (fileToDeleteUrl) {
            await deleteFileFromR2(fileToDeleteUrl);
        }

        await connection.commit();
        res.status(200).json({ message: 'Logro eliminado exitosamente.' });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error al eliminar logro:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar el logro.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    getLogros,
    createLogro,
    deleteLogro,
};
