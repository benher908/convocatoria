const express = require('express');
const { getFullUserProfile, updateUserProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware'); // Necessary to protect routes
const uploadProfileFiles = require('../middleware/profileUploads'); // Multer middleware for profile

const router = express.Router();

// Route to get a user's full profile
// We use :id to explicitly indicate which profile is being requested, although protect already provides user.id
router.get('/:id', protect, getFullUserProfile);

// Route to update a user's profile
router.put('/:id', protect, uploadProfileFiles.fields([
    { name: 'foto', maxCount: 1 },
    { name: 'evidenciaInstitucional', maxCount: 1 },
    { name: 'evidenciaIdentidad', maxCount: 1 },
    { name: 'cartaPostulacion', maxCount: 1 },
]), updateUserProfile);

module.exports = router;