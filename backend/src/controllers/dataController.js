// backend/controllers/dataController.js
const {pool} = require('../config/db'); 
const { addInstitutionToDB } = require('../services/institutionService');


const getRegions = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT id_region_procedencia, nombre_region FROM region_procedencia');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener regiones:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener regiones.' });
    } finally {
        if (connection) connection.release();
    }
};


const getCategories = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
    
        const [rows] = await connection.execute('SELECT id_categoria, nombre_categoria FROM categoria');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener categorías.' });
    } finally {
        if (connection) connection.release();
    }
};


const getInstitutions = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
    
        const [rows] = await connection.execute('SELECT id_institucion, nombre_institucion FROM institucion');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener instituciones:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener instituciones.' });
    } finally {
        if (connection) connection.release();
    }
};

const addInstitution = async (req, res) => {
    const { nombre_institucion, id_estado, tipo_institucion } = req.body;

    try {
    
        const newInstitution = await addInstitutionToDB(nombre_institucion, id_estado, tipo_institucion);
        res.status(201).json({
            message: 'Institución agregada exitosamente.',
            id_institucion: newInstitution.id_institucion,
            nombre_institucion: newInstitution.nombre_institucion
        });
    } catch (error) {
        console.error('Error al agregar institución desde el controlador de datos:', error);
    
        if (error.message === 'La institución ya existe.') {
            return res.status(409).json({ message: error.message });
        }
        if (error.message === 'El nombre de la institución es requerido.' || error.message === 'El estado y el tipo de institución son obligatorios.') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno del servidor al agregar institución.', error: error.message });
    }
};


const getStates = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT id_estado, nombre_estado FROM estados_republica ORDER BY nombre_estado ASC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener estados:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener estados.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    getRegions,
    getCategories,
    getInstitutions,
    getStates,
    addInstitution
};