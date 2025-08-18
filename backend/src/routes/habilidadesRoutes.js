const express = require('express');
const { getHabilidades, createHabilidad, deleteHabilidad } = require('../controllers/habilidadesController');
const { protect } = require('../middleware/authMiddleware'); // Asegúrate de la ruta correcta

const router = express.Router();

// Ruta para obtener todas las habilidades de un aspirante
router.get('/:id_aspirante', protect, getHabilidades);

// Ruta para crear una nueva habilidad (no hay archivos, solo JSON)
router.post('/:id_aspirante', protect, createHabilidad);

// Ruta para eliminar una habilidad
router.delete('/:id_aspirante/:id_habilidad', protect, deleteHabilidad);

module.exports = router;
