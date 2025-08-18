const { pool } = require('../config/db');

/**
 * 
 * @param {string} nombre_institucion 
 * @param {number} id_estado 
 * @param {'publica' | 'privada'} tipo_institucion 
 * @returns {Promise<{id_institucion: number, nombre_institucion: string}>} 
 * @throws {Error} 
 */
const addInstitutionToDB = async (nombre_institucion, id_estado, tipo_institucion) => {
    if (!nombre_institucion || nombre_institucion.trim() === '') {
        throw new Error('El nombre de la institución es requerido.');
    }
    if (!id_estado || !tipo_institucion) {
        throw new Error('El estado y el tipo de institución son obligatorios.');
    }

    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.query(
            'INSERT INTO institucion (nombre_institucion, id_estado, tipo_institucion) VALUES (?, ?, ?)',
            [nombre_institucion, id_estado, tipo_institucion]
        );
        return {
            id_institucion: result.insertId,
            nombre_institucion: nombre_institucion
        };
    } catch (error) {
        console.error('Error al agregar institución en el servicio:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            throw new Error('La institución ya existe.'); 
        }
        throw new Error('Error interno del servidor al agregar institución.'); 
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    addInstitutionToDB
};