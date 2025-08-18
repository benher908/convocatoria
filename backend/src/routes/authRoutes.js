// backend/routes/authRoutes.js
const express = require('express');
const { registerUser, loginUser, getUserProfile, logoutUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const multerS3 = require('multer-s3');
const r2Client = require('../config/cloudflareR2'); // Import the R2 client

const router = express.Router();

// Multer configuration for registration photo (only for this route)
const uploadRegisterPhoto = multer({
    storage: multerS3({
        s3: r2Client,
        bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        acl: 'public-read',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, `profile-photos/${uniqueSuffix}-${file.originalname}`); 
        }
    }),
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    },
    limits: { fileSize: 1024 * 1024 * 2 } 
});

// Authentication routes
router.post('/register', uploadRegisterPhoto.single('foto'), registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile); 
router.post('/logout', logoutUser);



module.exports = router;