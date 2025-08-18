const express = require('express');
const { getActividades, addActividad, deleteActividad } = require('../controllers/actividadesController');
const { protect } = require('../middleware/authMiddleware'); // Asegúrate de importar el middleware de protección
const uploadActividadFiles = require('../middleware/actividadesUploads'); // Importa el middleware de subida

const router = express.Router();


router.get('/:id_aspirante', protect, getActividades);


router.post('/:id_aspirante', protect, uploadActividadFiles.single('archivo'), addActividad);


router.delete('/:id_aspirante/:id_actividad', protect, deleteActividad);

module.exports = router;
