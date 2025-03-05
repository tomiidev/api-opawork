import express from 'express';
import { changePatientPass, gPatient, loginPatient } from '../controllers/patients_controller.js';

const router = express.Router();


router.post('/get-patient-byid/:id', gPatient);
router.post('/singin-patient', loginPatient);
router.post('/change-patient-pass', changePatientPass);


export default router;
