import jwt from "jsonwebtoken"
import PatientService from "../classes/patient_service.js";
import CatService from "../classes/categories_service.js";
const patientService = new PatientService()
const cService = new CatService()
import bcrypt from "bcrypt"
// Registro de usuario
export const changePatientPass = async (req, res) => {
    const token = req.cookies?.sessionToken;

    try {
        // Verificamos si el token está presente
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        // Decodificamos el token para obtener el _id del usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Recibimos el método de pago (no un arreglo, sino un solo string)
        const { password } = req.body;
        console.log("password " + password)
        // Verificamos que se haya proporcionado un método de pago
        if (!password) {
            return res.status(400).json({ message: 'Se requiere un pass.' });
        }
        // Hashear la nueva contraseña de forma correcta usando await
        const newHashedPass = await bcrypt.hash(password, 10);

        // Llamar al servicio para actualizar la contraseña
        const result = await patientService.setNewPasswordPatient(decoded, newHashedPass);

        // Verificar si realmente se actualizó la contraseña
        if (result.message === "Contraseña actualizada exitosamente.") {
            return res.status(200).json({ data: result, message: result.message });
        }

        return res.status(400).json({ message: "No se pudo actualizar la contraseña." });

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};
