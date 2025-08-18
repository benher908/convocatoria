const express = require('express');
const { getLogros, createLogro, deleteLogro } = require('../controllers/logrosController');
const { protect } = require('../middleware/authMiddleware'); // Asegúrate de la ruta correcta
const uploadLogroFile = require('../middleware/logrosUploads'); // Asegúrate de la ruta correcta

const router = express.Router();

// Ruta para obtener todos los logros de un aspirante
router.get('/:id_aspirante', protect, getLogros);

// Ruta para crear un nuevo logro (con subida de archivo)
router.post('/:id_aspirante', protect, uploadLogroFile.single('evidencia_file'), createLogro);

// Ruta para eliminar un logro
router.delete('/:id_aspirante/:id_logro', protect, deleteLogro);

module.exports = router;
