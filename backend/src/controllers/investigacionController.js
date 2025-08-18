const { pool } = require('../config/db');
const { deleteFileFromR2, getPublicUrl } = require('../utils/cloudflareUploader'); // Asegúrate de importar getPublicUrl


const getInvestigaciones = async (req, res) => {
    const id_aspirante = req.params.id_aspirante;


    if (req.user.id !== parseInt(id_aspirante)) {
        return res.status(403).json({ message: 'No tienes permiso para acceder a esta investigación.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        const [rows] = await connection.query(
            'SELECT id_investigacion_stem AS id, titulo_investigacion_stem AS titulo, descripcion_investigacion_stem AS descripcion, evidencia_investigacion_stem AS url FROM investigacion_stem WHERE id_aspirante = ?',
            [id_aspirante]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No se encontraron investigaciones para este aspirante.' });
        }

        
        const mappedInvestigaciones = rows.map(inv => ({
            id: inv.id,
            titulo: inv.titulo,
            descripcion: inv.descripcion,
            url: inv.url,
        }));


        res.status(200).json({
            message: 'Investigaciones obtenidas exitosamente.',
            data: mappedInvestigaciones
        });

    } catch (error) {
        console.error('Error al obtener las investigaciones:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener las investigaciones.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};


const createInvestigacion = async (req, res) => {
    const id_aspirante = req.params.id_aspirante;
    const { titulo, descripcion } = req.body; 
    const evidenciaFile = req.file; 

    
    if (req.user.id !== parseInt(id_aspirante)) {
    
        if (evidenciaFile && evidenciaFile.key) {
            const fileUrl = getPublicUrl(evidenciaFile.key);
            if (fileUrl) await deleteFileFromR2(fileUrl);
        }
        return res.status(403).json({ message: 'No tienes permiso para crear investigaciones para este aspirante.' });
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
            'INSERT INTO investigacion_stem (id_aspirante, titulo_investigacion_stem, descripcion_investigacion_stem, evidencia_investigacion_stem) VALUES (?, ?, ?, ?)',
            [id_aspirante, titulo, descripcion, evidenciaUrl]
        );

        await connection.commit();

        
        const [newInvestigacionRows] = await connection.query(
            'SELECT id_investigacion_stem AS id, titulo_investigacion_stem AS titulo, descripcion_investigacion_stem AS descripcion, evidencia_investigacion_stem AS url FROM investigacion_stem WHERE id_investigacion_stem = ?',
            [result.insertId]
        );
        const newInvestigacion = newInvestigacionRows[0];

        res.status(201).json({
            message: 'Investigación agregada exitosamente.',
            data: newInvestigacion
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error al crear la investigación:', error);
        
        if (evidenciaFile && evidenciaFile.key) {
            const fileUrl = getPublicUrl(evidenciaFile.key);
            if (fileUrl) await deleteFileFromR2(fileUrl);
        }
        res.status(500).json({ message: 'Error interno del servidor al crear la investigación.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};


const deleteInvestigacion = async (req, res) => {
    const { id_aspirante, id_investigacion } = req.params;

    
    if (req.user.id !== parseInt(id_aspirante)) {
        return res.status(403).json({ message: 'No tienes permiso para eliminar esta investigación.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [investigacionRows] = await connection.query('SELECT evidencia_investigacion_stem FROM investigacion_stem WHERE id_investigacion_stem = ? AND id_aspirante = ?', [id_investigacion, id_aspirante]);
        if (investigacionRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Investigación no encontrada o no pertenece a este aspirante.' });
        }
        const fileToDeleteUrl = investigacionRows[0].evidencia_investigacion_stem_url;

    
        const [result] = await connection.query(
            'DELETE FROM investigacion_stem WHERE id_investigacion_stem = ? AND id_aspirante = ?',
            [id_investigacion, id_aspirante]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Investigación no encontrada o no se pudo eliminar.' });
        }

        
        if (fileToDeleteUrl) {
            await deleteFileFromR2(fileToDeleteUrl);
        }

        await connection.commit();
        res.status(200).json({ message: 'Investigación eliminada exitosamente.' });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error al eliminar investigación:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar la investigación.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    getInvestigaciones,
    createInvestigacion,
    deleteInvestigacion,
};
