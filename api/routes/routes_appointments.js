import express from 'express';
import { addAppointment, deleteAppointment, editAppointment, gAppointment, gAppointments } from '../controllers/appoinment_controller.js';

const router = express.Router();


router.post('/add-appointment', addAppointment);
router.post('/get-session-byid/:id', gAppointment);
router.put('/edit-appointment', editAppointment);
router.get('/get-appointments', gAppointments);
router.delete('/delete-appointment', deleteAppointment);

export default router;
