import { Router } from "express";
import { checkAuth, getAllProductsById, login, logout,AddPaymentMethod, register, getProfile, getPaymentMethods, diagram, getPatients, addPatient, ePatient, dPatient, uploadPhoto, uploadInformation, getUser } from "../controllers/user_controller.js"
import multer from "multer";
import path from 'path';
const router = Router();
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
// Registro de usuarios
router.post('/create_account_with_email', register);
router.post('/generar-diagrama', diagram);
router.post('/upload-photo-by-user',upload.any(), uploadPhoto);
router.post('/user-information', uploadInformation);
router.post('/get-id', getUser)
router.get('/own_store/:id', getAllProductsById)

router.get('/get-user-data', getProfile)
// Inicio de sesión
router.post('/sign_in_with_email', /* authenticate */login);


router.get('/check-auth', /* authenticate */checkAuth);
router.get('/get-patients', /* authenticate */getPatients);
router.post('/add-patient', /* authenticate */addPatient);
router.post('/edit-patient', /* authenticate */ePatient);
router.delete('/delete-patient', /* authenticate */dPatient);
router.post('/logout', /* authenticate */logout);

router.post('/add-payment-method', /* authenticate */AddPaymentMethod);
router.get('/get-payments-methods', /* authenticate */getPaymentMethods);






export default router;
