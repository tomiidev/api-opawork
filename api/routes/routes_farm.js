import express from 'express';
import {getMessages, sendMessage } from '../controllers/farm_controller.js';

const router = express.Router();


router.post("/sendmessage", sendMessage);
router.get("/messages/:id", getMessages);



export default router;
