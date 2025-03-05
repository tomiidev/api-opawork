
import serviceFarm from "../classes/farm_service.js"
const sFarm = new serviceFarm()
import jwt from "jsonwebtoken"

export const gPatientFarms = async (req, res) => {
    const token = req.cookies?.sessionToken;

    try {

        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        // Decodificamos el token para obtener el _id del usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET);


        // Recibimos el método de pago (no un arreglo, sino un solo string)
        const { id } = req.params;
        // Verificamos que se haya proporcionado un método de pago
        if (!id) {
            return res.status(400).json({ message: 'Se requiere un id.' });
        }

        // Llamamos al servicio para actualizar los métodos de pago
        const inserted = await sFarm.gPatientFarms(decoded, id);
        if (inserted.length < 0) {
            return res.status(400).json({ data: [], message: "No hay farm registrados" });
        }

        // Retornamos el resultado exitoso
        return res.status(200).json({ data: inserted, message: "Farmacos enviados" });


    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};


export const insertFarm = async (req, res) => {

    const token = req.cookies?.sessionToken;

    try {
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        // Decodificamos el token para obtener el _id del usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET);


        // Recibimos el método de pago (no un arreglo, sino un solo string)
        const { formData } = req.body;
        // Verificamos que se haya proporcionado un método de pago
        if (!formData) {
            return res.status(400).json({ message: 'Se requiere un farm.' });
        }
        console.log(formData);
        // Llamamos al servicio para actualizar los métodos de pago
        const inserted = await sFarm.insertFarm(decoded, formData);
        if (inserted.insertedId) {

            // Retornamos el resultado exitoso
            return res.status(200).json({ data: inserted, message: "Mensaje enviado" });
        }

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};
export const dPatientFarm = async (req, res) => {

    const token = req.cookies?.sessionToken;

    try {
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        // Decodificamos el token para obtener el _id del usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET);


        // Recibimos el método de pago (no un arreglo, sino un solo string)
        const { farmId, patientId } = req.body;
        // Verificamos que se haya proporcionado un método de pago
        if (!farmId || !patientId) {
            return res.status(400).json({ message: 'Se requieren los datos' });
        }

        // Llamamos al servicio para actualizar los métodos de pago
        const deleted = await sFarm.dPatientFarm(decoded, farmId, patientId);
        if (deleted.deletedCount < 0) {
            return res.status(400).json({ message: 'El farmaco no existe' });
        }
  
            // Retornamos el resultado exitoso
            return res.status(200).json({ data: deleted, message: "Farmaco eliminado" });
        

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};