const express = require('express');
const { protect } = require('../middleware/authMiddleware'); // Middleware de protección
const escolaridadUploadsMiddleware = require('../middleware/escolaridadUploads'); // Middleware de subida de archivos
const { 
    getEscolaridad, 
    upsertEscolaridad, 
    getInstitutions, 
    addInstitution 
} = require('../controllers/escolaridadController'); // Controlador de escolaridad

const router = express.Router();

// 1. Pon las rutas estáticas primero
// GET /api/escolaridad/institutions
router.get('/institutions', getInstitutions);

// POST /api/escolaridad/institutions
// router.post('/institutions', protect, addInstitution); // Asegúrate de que esta línea esté aquí si la tienes.

// 2. Luego, pon las rutas dinámicas.
// GET /api/escolaridad/:id_aspirante
router.get('/:id_aspirante', protect, getEscolaridad);

// POST o PUT /api/escolaridad/:id_aspirante
router.post('/:id_aspirante', protect, escolaridadUploadsMiddleware, upsertEscolaridad);

module.exports = router;