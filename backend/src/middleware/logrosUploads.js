const multer = require('multer');
const multerS3 = require('multer-s3');
const r2Client = require('../config/cloudflareR2');


const uploadLogroFile = multer({
    storage: multerS3({
        s3: r2Client, 
        bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        acl: 'public-read', 
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const folder = 'logros-evidences'; 
            cb(null, `${folder}/${uniqueSuffix}-${file.originalname}`);
        }
    }),
    fileFilter: (req, file, cb) => {
    
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type. Only PDF files are allowed for achievement evidence.'), false);
        }
    },
    limits: { fileSize: 2 * 1024 * 1024 }
});

// Export the middleware for use in routes
module.exports = uploadLogroFile;
