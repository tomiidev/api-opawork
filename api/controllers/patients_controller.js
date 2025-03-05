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
        console.log("id " + id)
        // Verificamos que se haya proporcionado un método de pago
        if (!id) {
            return res.status(400).json({ message: 'Se requiere un id.' });
        }

        // Llamamos al servicio para actualizar los métodos de pago
        const patient = await cService.gPatient(decoded, id);
        if (patient.length > 0) {

            // Retornamos el resultado exitoso
            return res.status(200).json({ data: patient, message: "Paciente obtenido" });
        }

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};
export const loginPatient = async (req, res) => {

    try {
        let isPasswordValid;
        const { email, password } = req.body;
        console.log(email, password);
        // Verificar si se recibieron los datos necesarios
        if (!email || !password) {
            return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
        }
        // Buscar al usuario por correo electrónico en la base de datos
        const user = await patientService.getUserByEmail(email);  // Supongamos que esta función obtiene el usuario

        if (!user) {
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }

        if (user.forcePasswordChange === true) {
             isPasswordValid = user.password === password
        }
        else {
             isPasswordValid = await bcrypt.compare(password, user.password);
        }

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }


        const sessionToken = jwt.sign(
            {
                id: user._id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                psycoId: user.userId,
                forcePasswordChange: user.forcePasswordChange

            },
            process.env.JWT_SECRET, // Asegúrate de tener una clave secreta en tu archivo .env
            {
                expiresIn: '30d', // El token expirará en 1 día
            }
        );
        console.log(user);
        // Configurar la cookie del token de sesión

        res.cookie('sessionToken', sessionToken, {
            httpOnly: true,
            secure: true, //cambiar a tru en prod,
            sameSite: "Lax",
            maxAge: 30 * 24 * 60 * 60 * 1000
        });
        console.log(sessionToken)
        // Respuesta exitosa
        return res.status(200).json({ message: 'Login exitoso', user: user });

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};