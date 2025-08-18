// backend/routes/dataRoutes.js
const express = require('express');
const { getRegions, getCategories, getInstitutions,getStates, addInstitution } = require('../controllers/dataController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Define los endpoints GET para cada tipo de dato
router.get('/regions', getRegions);
router.get('/categories', getCategories);
router.get('/institutions', getInstitutions);
router.get('/states', getStates);
router.post('/institutions', addInstitution);

module.exports = router;