import jwt from "jsonwebtoken"
import ResourcetService from "../classes/resources_service.js";
import { uploadFileToS3 } from "../s3/s3.js";
import { send } from "../nodemailer/config.js";
const rService = new ResourcetService()
// Registro de usuario

export const addResource = async (req, res) => {
    const token = req.cookies?.sessionToken;

    try {
        // Verificamos si el token está presente
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const { files: formData } = req;
        if (!formData) {
            return res.status(400).json({ message: "No se ha subido ningún archivo" });
        }
        // Decodificamos el token para obtener el _id del usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Recibimos el método de pago (no un arreglo, sino un solo string)
        console.log(JSON.stringify(formData))
        // Verificamos que se haya proporcionado un método de pago
        if (!formData) {
            return res.status(400).json({ message: 'Se requiere un form.' });
        }

        // Llamamos al servicio para actualizar los métodos de pago
        const r = await rService.addResource(decoded, formData);
        if (r.insertedCount > 0) {
            await uploadFileToS3(decoded, formData)
            // Retornamos el resultado exitoso
            return res.status(200).json({ data: r, message: "Archivo obtenido" });
        }

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};
export const gResources = async (req, res) => {
    const token = req.cookies?.sessionToken;

    try {
        // Verificamos si el token está presente
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const { files: formData } = req;

        // Decodificamos el token para obtener el _id del usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET);




        // Llamamos al servicio para actualizar los métodos de pago
        const r = await rService.getResources(decoded);
        if (r.length > 0) {
            console.log(r)
            return res.status(200).json({ data: r, message: "Archivos obtenidos" });
        }

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};
export const gPatientResources = async (req, res) => {
    const token = req.cookies?.sessionToken;

    try {
        // Verificamos si el token está presente
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const { patient } = req.body;

        // Decodificamos el token para obtener el _id del usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET);




        // Llamamos al servicio para actualizar los métodos de pago
        const r = await rService.getPatientsResources(decoded, patient);
        if (r.length > 0) {
            console.log(r)
            return res.status(200).json({ data: r, message: "Archivos obtenidos" });
        }

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};
export const shareResource = async (req, res) => {
    const token = req.cookies?.sessionToken;

    try {
        // Verificamos si el token está presente
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const { patient, resource } = req.body;
        console.log(patient, resource);
        if (!patient || !resource) {
            return res.status(400).json({ message: "Faltan datos: paciente o recurso no proporcionados" });
        }
        // Decodificamos el token para obtener el _id del usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET);




        // Llamamos al servicio para actualizar los métodos de pago
        const result = await rService.shareResources(decoded, patient, resource);
        const r = await rService.getResourceById(decoded, resource);
        console.log(r)
        if (result && r._id) {
            await send(decoded,patient, r)
            return res.status(200).json({ data: result, message: "Archivo compartido" });
        }

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
}
export const deletePatientResource = async (req, res) => {
    const token = req.cookies?.sessionToken;

    try {
        // Verificamos si el token está presente
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const { patient, resource } = req.body;
        console.log(patient, resource);
        if (!patient || !resource) {
            return res.status(400).json({ message: "Faltan datos: paciente o recurso no proporcionados" });
        }
        // Decodificamos el token para obtener el _id del usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET);




        // Llamamos al servicio para actualizar los métodos de pago
        const result = await rService.deletePatientResources(decoded, patient, resource);
        if (result) {
            console.log(result)
            return res.status(200).json({ data: result, message: "Archivo eliminado" });
        }

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
}
