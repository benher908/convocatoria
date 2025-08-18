const { pool } = require('../config/db');


const getHabilidades = async (req, res) => {
    const id_aspirante = req.params.id_aspirante;

    
    if (req.user.id !== parseInt(id_aspirante)) {
        return res.status(403).json({ message: 'No tienes permiso para acceder a estas habilidades.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        const [rows] = await connection.query(
            'SELECT id_habilidades_academicas AS id, titulo_habilidad AS titulo, descripcion_habilidad AS descripcion, porcentaje_habilidad AS porcentaje FROM habilidades WHERE id_aspirante = ?',
            [id_aspirante]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No se encontraron habilidades para este aspirante.' });
        }

        
        const mappedHabilidades = rows.map(hab => ({
            id: hab.id,
            titulo: hab.titulo,
            descripcion: hab.descripcion,
            porcentaje: hab.porcentaje,
        }));



        res.status(200).json({
            message: 'Habilidades obtenidas exitosamente.',
            data: mappedHabilidades
        });

    } catch (error) {
        console.error('Error al obtener las habilidades:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener las habilidades.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};


const createHabilidad = async (req, res) => {
    const id_aspirante = req.params.id_aspirante;
    const { titulo, descripcion, porcentaje } = req.body;

    
    if (req.user.id !== parseInt(id_aspirante)) {
        return res.status(403).json({ message: 'No tienes permiso para crear habilidades para este aspirante.' });
    }

    if (!titulo || !descripcion || porcentaje === undefined || porcentaje === null) {
        return res.status(400).json({ message: 'Faltan campos obligatorios (título, descripción o porcentaje).' });
    }

    
    const parsedPorcentaje = parseInt(porcentaje);
    if (isNaN(parsedPorcentaje) || parsedPorcentaje < 0 || parsedPorcentaje > 100) {
        return res.status(400).json({ message: 'El porcentaje debe ser un número entre 0 y 100.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.query(
            'INSERT INTO habilidades (id_aspirante, titulo_habilidad, descripcion_habilidad, porcentaje_habilidad) VALUES (?, ?, ?, ?)',
            [id_aspirante, titulo, descripcion, parsedPorcentaje]
        );

        await connection.commit();

        const [newHabilidadRows] = await connection.query(
            'SELECT id_habilidades_academicas AS id, titulo_habilidad AS titulo, descripcion_habilidad AS descripcion, porcentaje_habilidad AS porcentaje FROM habilidades WHERE id_habilidades_academicas = ?',
            [result.insertId]
        );
        const newHabilidad = newHabilidadRows[0];

        res.status(201).json({
            message: 'Habilidad agregada exitosamente.',
            data: newHabilidad
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error al crear la habilidad:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear la habilidad.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};


const deleteHabilidad = async (req, res) => {
    const { id_aspirante, id_habilidad } = req.params;


    if (req.user.id !== parseInt(id_aspirante)) {
        return res.status(403).json({ message: 'No tienes permiso para eliminar esta habilidad.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.query(
            'DELETE FROM habilidades WHERE id_habilidades_academicas = ? AND id_aspirante = ?',
            [id_habilidad, id_aspirante]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Habilidad no encontrada o no pertenece a este aspirante.' });
        }

        await connection.commit();
        res.status(200).json({ message: 'Habilidad eliminada exitosamente.' });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error al eliminar habilidad:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar la habilidad.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    getHabilidades,
    createHabilidad,
    deleteHabilidad,
};
