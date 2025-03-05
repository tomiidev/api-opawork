import express from 'express';
import { insertNotes } from '../controllers/sessions_controller.js';

const router = express.Router();


router.post('/update-session-notes', insertNotes);


export default router;
