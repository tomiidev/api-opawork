import express from 'express';
import { dPatientFarm, gPatientFarms, insertFarm } from '../controllers/farm_controller.js';

const router = express.Router();


router.post('/add-patient-farm', insertFarm);
router.get('/get-patient-farms', gPatientFarms);
router.delete('/delete-patient-farm', dPatientFarm);


export default router;
