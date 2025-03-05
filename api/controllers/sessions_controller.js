
import sessionsService from "../classes/sessions_service.js";
import jwt from "jsonwebtoken";
const sService = new sessionsService()
// Registro de usuario

export const makeBooking = async (req, res) => {


    try {

        // Recibimos el método de pago (no un arreglo, sino un solo string)
        const { formData } = req.body;
        // Verificamos que se haya proporcionado un método de pago
        if (!formData) {
            return res.status(400).json({ message: 'Se requiere un form.' });
        }
        console.log(formData);
        // Llamamos al servicio para actualizar los métodos de pago
        const booking = await wService.makeBooking(formData);
        if (booking.acknowledged === true) {

            // Retornamos el resultado exitoso
            return res.status(200).json({ data: booking, message: "Mensaje enviado" });
        }

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};
export const getBookings = async (req, res) => {

    const token = req.cookies?.sessionToken;

    try {
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        // Decodificamos el token para obtener el _id del usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const booking = await sService.getBookings(decoded);
        if (booking.length > 0) {
            console.log(booking)
            // Retornamos el    resultado exitoso
            return res.status(200).json({ data: booking, message: "Reservas encontradas" });
        }

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};