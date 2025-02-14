import jwt from "jsonwebtoken"
import SubscriptionService from '../classes/subscription_service.js';
import { ObjectId } from "mongodb";
import PatientService from "../classes/categories_service.js";
const patientService = new PatientService()
// Registro de usuario
export const gPatient = async (req, res) => {
    const token = req.cookies?.sessionToken;

    try {
        // Verificamos si el token está presente
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        // Decodificamos el token para obtener el _id del usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Recibimos el método de pago (no un arreglo, sino un solo string)
        const { id } = req.params;
        console.log("id "+id)
        // Verificamos que se haya proporcionado un método de pago
        if (!id) {
            return res.status(400).json({ message: 'Se requiere un id.' });
        }

        // Llamamos al servicio para actualizar los métodos de pago
        const patient = await patientService.gPatient(decoded, id);
        if (patient.length > 0) {

            // Retornamos el resultado exitoso
            return res.status(200).json({ data: patient, message: "Paciente obtenido" });
        }

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};