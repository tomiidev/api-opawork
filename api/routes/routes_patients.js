import express from 'express';
import { gPatient } from '../controllers/patients_controller.js';

const router = express.Router();


router.post('/get-patient-byid/:id', gPatient);


export default router;
