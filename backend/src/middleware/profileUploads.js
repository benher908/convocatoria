// backend/middleware/profileUploads.js
const multer = require('multer');
const multerS3 = require('multer-s3');
const r2Client = require('../config/cloudflareR2'); 


const uploadProfileFiles = multer({
    storage: multerS3({
        s3: r2Client, 
        bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        acl: 'public-read',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            
            let folder = 'profile-evidences'; 
            if (file.fieldname === 'foto') {
                folder = 'profile-photos'; 
            }
            cb(null, `${folder}/${uniqueSuffix}-${file.originalname}`);
        }
    }),
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type. Only images or PDFs are allowed.'), false);
        }
    },
    limits: { fileSize: 2 * 1024 * 1024 } 
});

module.exports = uploadProfileFiles;
