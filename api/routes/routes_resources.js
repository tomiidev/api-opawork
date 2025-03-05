import express from 'express';
import { addResource, deletePatientResource, gPatientOwnResources, gPatientResources, gResources, shareResource } from '../controllers/resource_controller.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();
const isVercel = process.env.VERCEL === '1';
const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        if (isVercel) {
            // En Vercel, usamos /tmp como directorio temporal
            cb(null, '/tmp');
        } else {

            cb(null, 'api/uploads/');  // Carpeta donde se guardarán los archivos */
        }

    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));  // Nombre único para evitar colisiones
    }
});
const upload = multer({ storage });

router.post('/upload-resource', upload.any(), addResource);
router.post('/get-resources', gResources);
router.post('/share-resource', shareResource);
router.post('/get-patient-resources', gPatientResources);
router.post('/g-patient-own-resources', gPatientOwnResources);
router.post('/delete-patient-resource', deletePatientResource);


export default router;
