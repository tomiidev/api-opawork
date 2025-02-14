import express from 'express';
import { deleteBooking, getBookings, makeBooking } from '../controllers/wait_controller.js';

const router = express.Router();


router.post('/request-contact', makeBooking);
router.delete('/reject-patient', deleteBooking);
router.get('/get-bookings', getBookings);


export default router;
