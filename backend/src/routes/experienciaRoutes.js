const express = require('express');
const { getExperiencias, createExperiencia, deleteExperiencia } = require('../controllers/experienciaController');
const { protect } = require('../middleware/authMiddleware'); // Asegúrate de la ruta correcta
const uploadExperienciaFile = require('../middleware/experienciaUploads'); // Asegúrate de la ruta correcta

const router = express.Router();

// Ruta para obtener todas las experiencias laborales de un aspirante
router.get('/:id_aspirante', protect, getExperiencias);

// Ruta para crear una nueva experiencia laboral (con subida de archivo)
router.post('/:id_aspirante', protect, uploadExperienciaFile.single('evidencia_file'), createExperiencia);

// Ruta para eliminar una experiencia laboral
router.delete('/:id_aspirante/:id_experiencia_laboral', protect, deleteExperiencia);

module.exports = router;