import express from 'express';
import { addAdvise, applyToOffer, deletePatientResource, gAdvises, gAllAdvises, gAllFreelanceAdvises, gAppliesOfOffer, getAdviseById, gTitleAdvise } from '../controllers/advises_controller.js';
import multer from 'multer';
import path from 'path';
import {  uploadInformation } from '../controllers/user_controller.js';

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

router.post('/advise-information',addAdvise);
router.get('/get-advises', gAdvises);
router.get('/get-all-advises', gAllAdvises);
router.post('/apply-offer', applyToOffer);
router.get('/get-all-freelance-advises', gAllFreelanceAdvises);
router.get('/get-advise-by-id/:id', getAdviseById);
router.post('/delete-patient-resource', deletePatientResource);
router.get('/get-applies-of-offer/:id', /* authenticate */gAppliesOfOffer);
router.get('/title-of-advise/:id', gTitleAdvise);

export default router;
