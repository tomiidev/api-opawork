import express from 'express';
import { changePatientPass} from '../controllers/patients_controller.js';

const router = express.Router();



router.post('/change-patient-pass', changePatientPass);


export default router;
