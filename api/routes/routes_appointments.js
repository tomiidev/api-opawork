import express from 'express';
import { addAppointment, deleteAppointment, deleteOwnAppointment, editAppointment, editOwnAppointment, gAppointment, gAppointments, gOwnPatientsAppointments, insertNotes } from '../controllers/appoinment_controller.js';

const router = express.Router();


router.post('/add-appointment', addAppointment);
router.post('/get-session-byid/:id', gAppointment);
router.post('/insert-session-notes/:sessionId', insertNotes);
/* router.post('/session-general-notes/:sessionId', gNotes); */
router.put('/edit-appointment', editAppointment);
router.put('/edit-own-appointment', editOwnAppointment);
router.get('/get-appointments', gAppointments);
router.post('/get-own-patient-appointments', gOwnPatientsAppointments);
router.delete('/delete-appointment', deleteAppointment);
router.delete('/delete-own-appointment', deleteOwnAppointment);

export default router;
