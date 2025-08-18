// backend/middleware/escolaridadUploads.js
const multer = require('multer');
const multerS3 = require('multer-s3');
const r2Client = require('../config/cloudflareR2'); // Importa el cliente R2


const uploadEscolaridadFiles = multer({
    storage: multerS3({
        s3: r2Client, 
        bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME, 
        acl: 'public-read', 
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            let folder = 'escolaridad-files'; 

            
            switch (file.fieldname) {
                case 'constancia_file':
                    folder = 'escolaridad-constancias';
                    break;
                case 'titulo_file':
                    folder = 'escolaridad-titulos';
                    break;
                case 'cedula_file':
                    folder = 'escolaridad-cedulas';
                    break;
                case 'evidencia_file': 
                    folder = 'escolaridad-evidencias';
                    break;
                default:
                    
                    folder = 'escolaridad-otros';
            }
            cb(null, `${folder}/${uniqueSuffix}-${file.originalname}`);
        }
    }),
    fileFilter: (req, file, cb) => {
        // Permitir imágenes y PDFs
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no soportado. Solo se permiten imágenes o PDFs.'), false);
        }
    },
    limits: { fileSize: 2 * 1024 * 1024 } // Límite de tamaño de archivo de 10 MB
});

// Define los campos de archivo esperados
const escolaridadUploadsMiddleware = uploadEscolaridadFiles.fields([
    { name: 'constancia_file', maxCount: 1 },
    { name: 'titulo_file', maxCount: 1 },
    { name: 'cedula_file', maxCount: 1 },
    { name: 'evidencia_file', maxCount: 1 }, // Cambiado para reflejar el nombre de tu frontend
]);

module.exports = escolaridadUploadsMiddleware;
