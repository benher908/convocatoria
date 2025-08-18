// backend/utils/cloudflareUploader.js
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const r2Client = require('../config/cloudflareR2'); 

/**
 * 
 * @param {string} fileUrl 
 */
const deleteFileFromR2 = async (fileUrl) => {
    if (!fileUrl) return;

    try {
        const publicUrlPrefix = process.env.CLOUDFLARE_R2_PUBLIC_URL;
        if (!publicUrlPrefix || !fileUrl.startsWith(publicUrlPrefix)) {
            console.warn(`File URL does not seem to be from R2 or public prefix is not configured: ${fileUrl}`);
            return; 
        }


        const key = fileUrl.substring(publicUrlPrefix.length + 1); 

        console.log(`Attempting to delete from R2: Bucket=${process.env.CLOUDFLARE_R2_BUCKET_NAME}, Key=${key}`);
        await r2Client.send(new DeleteObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
            Key: key
        }));
        console.log(`File ${key} deleted from R2.`);
    } catch (error) {
        console.error(`Error deleting file from R2 (${fileUrl}):`, error);
    
    }
};

/**
 *
 * @param {string} key 
 * @returns {string} 
 */
const getPublicUrl = (key) => {
    const publicUrlPrefix = process.env.CLOUDFLARE_R2_PUBLIC_URL;
    if (!publicUrlPrefix) {
        console.error('CLOUDFLARE_R2_PUBLIC_URL is not configured in .env');
        return null;
    }
    return `${publicUrlPrefix}/${key}`;
};

module.exports = { deleteFileFromR2, getPublicUrl };
