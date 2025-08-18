const express = require('express');
const { getInvestigaciones, createInvestigacion, deleteInvestigacion } = require('../controllers/investigacionController');
const { protect } = require('../middleware/authMiddleware'); // Asegúrate de la ruta correcta
const uploadInvestigacionFile = require('../middleware/investigacionUploads'); // Asegúrate de la ruta correcta

const router = express.Router();

// Ruta para obtener todas las investigaciones de un aspirante
router.get('/:id_aspirante', protect, getInvestigaciones);

// Ruta para crear una nueva investigación (con subida de archivo)
router.post('/:id_aspirante', protect, uploadInvestigacionFile.single('evidencia_file'), createInvestigacion);

// Ruta para eliminar una investigación
router.delete('/:id_aspirante/:id_investigacion', protect, deleteInvestigacion);

module.exports = router;
