
import { deleteFileFromS3, getObjectFromS3, uploadFileToS3 } from "../s3/s3.js"
import jwt from "jsonwebtoken"

import { send, stateOrderNotify } from '../nodemailer/config.js';
import AppointmentService from '../classes/product_service.js';
const appointmentService = new AppointmentService();

export const addAppointment = async (req, res) => {
    const token = req.cookies?.sessionToken;

    try {
        // Verificamos si el token está presente
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        // Decodificamos el token para obtener el _id del usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Recibimos el método de pago (no un arreglo, sino un solo string)
        const { formData } = req.body;
        console.log(formData)
        // Verificamos que se haya proporcionado un método de pago
        if (!formData) {
            return res.status(400).json({ message: 'Se requiere una cita.' });
        }

        // Llamamos al servicio para actualizar los métodos de pago
        const citas = await appointmentService.addAppointment(decoded, formData);

        // Retornamos el resultado exitoso
        return res.status(200).json({ data: citas, message: "Cita agregada" });

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};
export const editAppointment = async (req, res) => {
    const token = req.cookies?.sessionToken;

    try {
        // Verificamos si el token está presente
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        // Decodificamos el token para obtener el _id del usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Recibimos el método de pago (no un arreglo, sino un solo string)
        const { formData } = req.body;
        console.log(formData)
        // Verificamos que se haya proporcionado un método de pago
        if (!formData) {
            return res.status(400).json({ message: 'Se requiere una cita.' });
        }

        // Llamamos al servicio para actualizar los métodos de pago
        const citas = await appointmentService.editAppointment(decoded, formData);
        if (citas.modifiedCount > 0) {
            // Retornamos el resultado exitoso
            return res.status(200).json({ data: citas, message: "Cita editada" });
        }

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};
export const deleteAppointment = async (req, res) => {
    const token = req.cookies?.sessionToken;

    try {
        // Verificamos si el token está presente
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        // Decodificamos el token para obtener el _id del usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Recibimos el método de pago (no un arreglo, sino un solo string)
        const { appointmentToDelete } = req.body;
      
        // Verificamos que se haya proporcionado un método de pago
        if (!appointmentToDelete) {
            return res.status(400).json({ message: 'Se requiere una cita.' });
        }

        // Llamamos al servicio para actualizar los métodos de pago
        const citas = await appointmentService.dAppointment(decoded, appointmentToDelete);
        if (citas.deletedCount > 0) {
            console.log(citas)
            // Retornamos el resultado exitoso
            return res.status(200).json({ data: citas, message: "Cita eliminada" });
        }

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};
export const gAppointments = async (req, res) => {
    const token = req.cookies?.sessionToken;

    try {
        // Verificamos si el token está presente
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        // Decodificamos el token para obtener el _id del usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET);



        // Llamamos al servicio para actualizar los métodos de pago
        const citas = await appointmentService.gAppointments(decoded);
        if (citas.length > 0) {
            console.log(citas)
            // Retornamos el resultado exitoso
            return res.status(200).json({ data: citas, message: "Hay citas" });
        }

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};
export const gAppointment = async (req, res) => {
    const token = req.cookies?.sessionToken;
    
    try {
        // Verificamos si el token está presente
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        console.log(token)
        const {id} = req.params
        // Decodificamos el token para obtener el _id del usuario
        if (!id) {
            return res.status(401).json({ error: 'No hay sessionid' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);



        // Llamamos al servicio para actualizar los métodos de pago
        const citas = await appointmentService.gAppointment(decoded, id);
        if (citas.length > 0) {
            console.log(citas)
            // Retornamos el resultado exitoso
            return res.status(200).json({ data: citas, message: "Hay citas" });
        }

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};