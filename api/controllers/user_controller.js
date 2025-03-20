import AuthService from '../classes/auth_service.js'; // Importación con ES Modules
import jwt from 'jsonwebtoken'; // Asegúrate de instalar jsonwebtoken
import UserService from '../classes/user_service.js';
import bcrypt from 'bcrypt';  // Importar bcrypt
// Crear instancia del servicio de autenticación
const authService = new AuthService();
const patService = new PatientService();
const userService = new UserService();
import { uploadFileServiceToS3, uploadFileToS3 } from "../s3/s3.js"
import { exec } from 'child_process';
import path from 'path';
import PatientService from '../classes/categories_service.js';
import { sendEmailWithCredentialToPatient } from '../nodemailer/config.js';
import { generatePassword } from '../lib/generate.js';
// Registro de usuario

export const freePlan = async (req, res) => {
    try {
        const updatedCount = await userService.updateFreePlan()
        res.json({ message: "Suscripciones actualizadas.", updatedCount });
    } catch (error) {
        res.status(500).json({ message: "Error actualizando suscripciones", error });
    }
};
export const gUserByChats = async (req, res) => {
    const token = req.cookies.sessionToken;

    try {
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const { chats } = req.body; // Recibir el array de chats
        if (!chats || !Array.isArray(chats)) {
            return res.status(400).json({ error: 'Datos de chats inválidos' });
        }

        // Obtener los nombres de los usuarios en los chats
        const enrichedChats = await userService.getUserByChats(chats);


        res.status(200).json({ data: enrichedChats, message: "Usuarios obtenidos" });

    } catch (error) {
        console.error("Error obteniendo usuarios:", error);
        res.status(500).json({ message: "Error interno del servidor", error });
    }
};

export const gUserByReceiverId = async (req, res) => {
    const token = req.cookies.sessionToken;

    try {
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const { id } = req.params; // Recibir el array de chats

        if (!id) {
            return res.status(400).json({ error: 'Datos de chats inválidos' });
        }

        // Obtener los nombres de los usuarios en los chats
        const r = await userService.getUserByReceiverId(id);
        if (r._id) {

            res.status(200).json({ data: r, message: "Usuarios obtenidos" });
        }

    } catch (error) {
        console.error("Error obteniendo usuarios:", error);
        res.status(500).json({ message: "Error interno del servidor", error });
    }
};

export const register = async (req, res) => {
    try {
        const token = await authService.register(req.body);
        res.status(201).json({ token });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(400).json({ message: 'Error al registrar usuario' });
    }
};

export const diagram = async (req, res) => {
    try {
        exec('python api/testpsyco.py', (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return res.status(500).send('Error al ejecutar el script Python.');
            }

            if (stderr) {
                console.error(`stderr: ${stderr}`);
                return res.status(500).send('Error en la ejecución del script Python.');
            }

            // Si todo va bien, tomamos la salida (stdout) que es el archivo CSV generado
            // Creamos un stream para enviar el archivo como respuesta
            const fileStream = new stream.PassThrough();
            fileStream.end(stdout);  // Usamos stdout como el contenido del archivo

            // Configurar las cabeceras para la descarga del archivo
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Content-Disposition', 'attachment; filename="output_file.png"');
            res.status(200).send(fileStream);  // Enviar el archivo al cliente
        });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(400).json({ message: 'Error al registrar usuario' });
    }
};

// Inicio de sesión
export const checkAuth = async (req, res) => {
    const token = req.cookies.sessionToken;
    if (!token) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.status(200).json({
            authenticated: true,
            freePlan: decoded.freePlan,
            user: {
                id: decoded.id,
                email: decoded.email,
                photo: decoded.photo,
                phone: decoded.phone,
                name: decoded.name,
                description: decoded.description,
                typeAccount: decoded.typeAccount,
                sender_mongo_id: decoded.sender_mongo_id


            }
        });
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).json({ error: 'No autorizado' });
    }
}
export const checkAuthPatientCredentials = async (req, res) => {
    const token = req.cookies.sessionToken;
    if (!token) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.status(200).json({
            authenticated: true,
            user: {
                id: decoded.id,
                email: decoded.email,
                forcePasswordChange: decoded.forcePasswordChange,
                phone: decoded.phone,
                name: decoded.name,
                psycoId: decoded.userId,

            }
        });
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).json({ error: 'No autorizado' });
    }
}
export const logout = async (req, res) => {
    const token = req.cookies.sessionToken;  // Accedemos directamente a 'sessionToken'

    try {
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        // Limpiar la cookie 'sessionToken'
        res.clearCookie('sessionToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',  // Asegurarse de usar 'secure' solo en producción
            sameSite: "Lax",
            /*  domain: ".opawork.app", */ // Habilita el uso en todos los subdominios
            path: "/", // Disponible en todas las rutas
            maxAge: 0  // La cookie se eliminará inmediatamente
        });

        // Responder con un mensaje de éxito
        res.status(200).json({ message: 'Logout exitoso' });
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        res.status(500).json({ error: 'Hubo un error al cerrar sesión. Intenta nuevamente.' });
    }
};

export const getAllProductsById = async (req, res) => {

    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'Se requiere el ID del usuario.' });
        }

        const products = await userService.getAllProductsByUser(id);
        console.log(products)
        if (products.length > 0) {

            return res.status(200).json({ data: products, message: "No se encontraron productos" });
        } else {

            // Si no hay productos, devolver 404 (no encontrado)
            return res.status(404).json({ message: "No se encontraron productos para este usuario." });
        }

    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};
/* export const addPatient = async (req, res) => {
    const token = req.cookies?.sessionToken;

    try {
        // Verificamos si el token está presente
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        // Decodificamos el token para obtener el _id del usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Recibimos el método de pago (no un arreglo, sino un solo string)
        const { formData, bookingToAccept } = req.body;
 
        // Verificamos que se haya proporcionado un método de pago
        if (!formData || !bookingToAccept) {
            return res.status(400).json({ message: 'Se requiere un paciente.' });
        }

        // Llamamos al servicio para actualizar los métodos de pago
        if (bookingToAccept) {

            const patients = await patService.addPatient(decoded, bookingToAccept);
            return res.status(200).json({ data: patients, message: "Paciente agregado" });
        }
        else {
            
            const patients = await patService.addPatient(decoded, formData);
            return res.status(200).json({ data: patients, message: "Paciente agregado" });
        }

        // Retornamos el resultado exitoso

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
}; */
export const addPatient = async (req, res) => {
    const token = req.cookies?.sessionToken;

    try {
        // Verificamos si el token está presente
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        // Decodificamos el token para obtener el _id del usuario
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(401).json({ error: 'Token inválido o expirado' });
        }

        // Recibimos los datos del paciente
        const { formData, bookingToAccept } = req.body;
        // Validación de los datos
        if (!formData && !bookingToAccept) {
            return res.status(400).json({ message: 'Se requiere al menos un objeto válido.' });
        }


        // Seleccionamos qué dato usar
        const patientData = bookingToAccept || formData;
        const tempPassword = generatePassword();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        await sendEmailWithCredentialToPatient(patientData, hashedPassword)
        // Llamamos al servicio
        const patients = await patService.addPatient(decoded, patientData, hashedPassword);

        // Retornamos el resultado exitoso
        return res.status(200).json({ data: patients, message: "Paciente agregado" });

    } catch (error) {
        console.error('Error al agregar paciente:', error);
        res.status(500).json({ message: 'Error al agregar paciente' });
    }
};

export const dPatient = async (req, res) => {
    const token = req.cookies?.sessionToken;

    try {
        // Verificamos si el token está presente
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        // Decodificamos el token para obtener el _id del usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Recibimos el método de pago (no un arreglo, sino un solo string)
        const { patientToDelete } = req.body;
        console.log(patientToDelete)
        // Verificamos que se haya proporcionado un método de pago
        if (!patientToDelete) {
            return res.status(400).json({ message: 'Se requiere un paciente.' });
        }

        // Llamamos al servicio para actualizar los métodos de pago
        const patient = await patService.dPatient(decoded, patientToDelete);
        if (patient.patientDeleted.deletedCount > 0) {
            // Retornamos el resultado exitoso
            return res.status(200).json({ data: patient, message: "Paciente eliminado" });
        }

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};
export const ePatient = async (req, res) => {
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
        console.log("paciente a editar" + JSON.stringify(formData));
        // Verificamos que se haya proporcionado un método de pago
        if (!formData) {
            return res.status(400).json({ message: 'Se requiere un paciente.' });
        }

        // Llamamos al servicio para actualizar los métodos de pago
        const patients = await patService.editPatient(decoded, formData);

        // Retornamos el resultado exitoso
        return res.status(200).json({ data: patients, message: "Paciente editado" });

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};

export const AddPaymentMethod = async (req, res) => {
    const token = req.cookies?.sessionToken;

    try {
        // Verificamos si el token está presente
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        // Decodificamos el token para obtener el _id del usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Recibimos el método de pago (no un arreglo, sino un solo string)
        const { methods } = req.body;
        console.log(methods)
        // Verificamos que se haya proporcionado un método de pago
        if (!methods) {
            return res.status(400).json({ message: 'Se requiere un método de pago.' });
        }

        // Llamamos al servicio para actualizar los métodos de pago
        const updatedPaymentMethods = await userService.updatePaymentMethods(decoded, methods);

        // Retornamos el resultado exitoso
        return res.status(200).json({ data: updatedPaymentMethods, message: "Método de pago actualizado correctamente." });

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};



export const getPaymentMethods = async (req, res) => {
    const token = req.cookies?.sessionToken;

    try {
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Aquí almacenamos los métodos de pago para el usuario
        const updatedPaymentMethods = await userService.getPaymentMethods(decoded);

        return res.status(200).json({ data: updatedPaymentMethods, message: "Métodos de pago obtenidos correctamente." });

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};



export const login = async (req, res) => {

    try {
        const { email, password } = req.body;
        console.log(email, password);
        // Verificar si se recibieron los datos necesarios
        if (!email || !password) {
            return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
        }
        // Buscar al usuario por correo electrónico en la base de datos
        const user = await userService.getUserByEmail(email);  // Supongamos que esta función obtiene el usuario

        if (!user) {
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }

        // Comparar la contraseña proporcionada con la almacenada usando bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Crear el token de sesión (puedes usar JWT u otro mecanismo)
        console.log(user)
        const sessionToken = jwt.sign(
            {
                id: user._id,
                email: user.email,
                photo: user.photo,
                name: user.name,
                freePlan: user.freePlan,
                phone: user.phone,
                description: user.description,
                typeAccount: user.typeAccount,
                sender_mongo_id: user.sender_mongo_id
                /*      nombre: user.nombre, */
                // Puedes agregar más datos aquí si es necesario
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
            sameSite: "None",

            /* sameSite: "None",
            domain: ".opawork.app", */
            path: "/", // Disponible en todas las rutas
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

// Obtener perfil del usuario autenticado
export const getProfile = async (req, res) => {
    try {
        const token = req.cookies?.sessionToken;
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userService.getUserByEmail(decoded.email)
        console.log(user)
        if (user) {

            return res.status(200).json({ data: user });
        }
        else {
            return res.status(404).json({ message: "No se encontró el usuario" });
        }
    } catch (error) {
        console.error('Error al obtener el perfil:', error);
        res.status(500).json({ message: 'Error al obtener el perfil del usuario' });
    }
};
export const getUser = async (req, res) => {
    try {
        const { id } = req.body
        if (!id) {
            return res.status(400).json({ message: 'Se requiere un id de usuario.' });
        }
        console.log(id)

        const user = await userService.getUser(id)

        if (user) {
            return res.status(200).json({ data: user });
        }
        else {
            return res.status(404).json({ message: "No se encontró el usuario" });
        }
    } catch (error) {
        console.error('Error al obtener el perfil:', error);
        res.status(500).json({ message: 'Error al obtener el perfil del usuario' });
    }
};

export const gUserDataApply = async (req, res) => {
    const token = req.cookies?.sessionToken;

    try {
        // Verificamos si el token está presente
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const { id } = req.params
        if (!id) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        // Llamamos al servicio para actualizar los métodos de pago
        const r = await userService.getUser(id);
        if (r._id) {
            console.log(r)
            return res.status(200).json({ data: r, message: "Perfil obtenido" });
        }

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};

export const uploadPhoto = async (req, res) => {
    const token = req.cookies?.sessionToken;
    try {

        const { files: image } = req;
        console.log(image)
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        if (!image) {
            return res.status(400).json({ message: 'Se requiere una imagen.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);


        // Realiza el aggregate para encontrar las compras del usuario
        const dataUpdated = await userService.uploadPicture(decoded, image)
        if (dataUpdated.acknowledged === true) {
            await uploadFileServiceToS3(decoded, image)
            res.status(200).json({ message: 'Imagen subida correctamente.' });
        }

    } catch (error) {
        console.error('Error al actualizar datos:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
export const uploadInformation = async (req, res) => {
    const token = req.cookies?.sessionToken;
    try {

        const { body: formData } = req;
        console.log(formData)
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        if (!formData) {
            return res.status(400).json({ message: 'Se requiere información.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);


        // Realiza el aggregate para encontrar las compras del usuario
        const dataUpdated = await userService.uploadInformation(decoded, formData)
        if (dataUpdated.acknowledged === true) {

            res.status(200).json({ message: 'informacion actualizada correctamente.' });
        }

    } catch (error) {
        console.error('Error al actualizar datos:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
export const getInformation = async (req, res) => {
    const token = req.cookies?.sessionToken;
    try {

        const { body: formData } = req;
        console.log(formData)
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        if (!formData) {
            return res.status(400).json({ message: 'Se requiere información.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);


        // Realiza el aggregate para encontrar las compras del usuario
        const dataUpdated = await userService.uploadInformation(decoded, formData)
        if (dataUpdated.acknowledged === true) {

            res.status(200).json({ message: 'informacion actualizada correctamente.' });
        }

    } catch (error) {
        console.error('Error al actualizar datos:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Actualizar perfil del usuario autenticado

export const gChats = async (req, res) => {
    const token = req.cookies?.sessionToken;
    try {
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const chats = await userService.getChats(decoded);

        if (chats.length > 0) {
            console.log(JSON.stringify(chats))
            return res.status(200).json({ data: chats, message: "Obtenidos" });
        }

    } catch (error) {
        console.error("Error en getMessages:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
};




