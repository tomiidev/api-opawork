import AuthService from '../classes/auth_service.js'; // Importación con ES Modules
import jwt from 'jsonwebtoken'; // Asegúrate de instalar jsonwebtoken
import UserService from '../classes/user_service.js';
import bcrypt from 'bcrypt';  // Importar bcrypt
// Crear instancia del servicio de autenticación
const authService = new AuthService();
const userService = new UserService();
import { uploadFileServiceToS3, uploadFileToS3 } from "../s3/s3.js"
import { exec } from 'child_process';
import path from 'path';
// Registro de usuario
export const getStores = async (req, res) => {
    try {
        const stores = await userService.getStores();
        if (stores.length > 0) {

            res.status(200).json({ data: stores });
        }
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(400).json({ message: 'Error al registrar usuario' });
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
            user: {
                id: decoded.id,
                email: decoded.email,

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
            sameSite: 'Strict',  // Puedes cambiar este valor a 'Strict' en producción si es necesario
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
            sameSite: "Strict",
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
        const user = await userService.getUserById(decoded.email)
        console.log(user)
        if (user) {
            // En este punto, `req.user` contiene los datos del usuario autenticado
            // Puedes usarlo para mostrar o procesar los datos del usuario
            // Por ejemplo, si deseas mostrar su nombre en la vista:
            // res.send(`Hola, ${req.user.nombre}!`);
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
export const getClients = async (req, res) => {
    try {
        const token = req.cookies?.sessionToken;
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);


        // Realiza el aggregate para encontrar las compras del usuario
        const clients = await userService.getClients(decoded.id)
        if (clients) {
            res.status(200).json({ data: clients });
        } else {
            res.status(404).json({ message: "error al crear transaccion" });
        }
    } catch (error) {
        console.error('Error al obtener los items:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
export const postRequestModuleUser = async (req, res) => {
    try {
        const { module } = req.body
        const token = req.cookies?.sessionToken;
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        if (!module) {
            return res.status(400).json({ message: 'Se requiere el modulo a solicitar.' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);


        // Realiza el aggregate para encontrar las compras del usuario
        const moduleAdded = await userService.requestModuleUser(decoded.id, module)
        if (moduleAdded) {
            res.status(200).json({ data: moduleAdded });
        } else {
            res.status(404).json({ message: "error al solicitar modulo" });
        }
    } catch (error) {
        console.error('Error al solicitar modulos:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
export const removeModuleUser = async (req, res) => {
    try {
        const { module } = req.body
        const token = req.cookies?.sessionToken;
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        if (!module) {
            return res.status(400).json({ message: 'Se requiere el modulo a solicitar.' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);


        // Realiza el aggregate para encontrar las compras del usuario
        const moduleAdded = await userService.removeModuleUser(decoded.id, module)
        if (moduleAdded) {
            res.status(200).json({ data: moduleAdded });
        } else {
            res.status(404).json({ message: "error al eliminar modulo" });
        }
    } catch (error) {
        console.error('Error al eliminar modulos:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
export const updateServiceDescription = async (req, res) => {
    try {
        const { service_description } = req.body
        const token = req.cookies?.sessionToken;
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        if (!service_description) {
            return res.status(400).json({ message: 'Se requiere la desc a actualizar.' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);


        // Realiza el aggregate para encontrar las compras del usuario
        const descriptionUpdated = await userService.updateServiceDescription(decoded.id, service_description)
        if (descriptionUpdated) {
            res.status(200).json({ data: descriptionUpdated });
        } else {
            res.status(404).json({ message: "error al eliminar modulo" });
        }
    } catch (error) {
        console.error('Error al eliminar modulos:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
export const updateServiceData = async (req, res) => {
    try {
        const { service_experience, service_name } = req.body
        const service_picture = req.file
        console.log(service_picture, service_experience, service_name)
        const token = req.cookies?.sessionToken;
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        /*   if (!service_picture || !service_experience || !service_name) {
              return res.status(400).json({ message: 'Se requiere la desc a actualizar.' });
          } */
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const data = {
            service_experience: service_experience,
            service_name: service_name,
            service_picture: service_picture.originalname
        }

        // Realiza el aggregate para encontrar las compras del usuario
        const dataUpdated = await userService.updateServiceData(decoded.id, data)
        if (dataUpdated.acknowledged === true) {
            await uploadFileServiceToS3(service_picture, decoded.id, data.service_name)
        }
        if (dataUpdated) {
            res.status(200).json({ data: dataUpdated });
        } else {
            res.status(404).json({ message: "error al actualizar datos" });
        }
    } catch (error) {
        console.error('Error al actualizar datos:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Actualizar perfil del usuario autenticado
export const updateProfile = async (req, res) => {
    try {
        const updatedUser = await authService.updateUser(req.user.id, req.body); // `req.user.id` asume que el middleware JWT asigna `req.user`
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error al actualizar el perfil:', error);
        res.status(500).json({ message: 'Error al actualizar el perfil' });
    }
};
export const postClient = async (req, res) => {
    try {
        const token = req.cookies?.sessionToken;
        const { name, email, gender, city, phone } = req.body
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        console.log(token);
        // Decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const client = {

            /*   nombre: title, */
            cliente: uid(),
            nombre: name,
            correo: email,
            teléfono: phone,
            género: gender,
            ciudad: city,

        }

        // Realiza el aggregate para encontrar las compras del usuario
        const inserted = await userService.postClient(decoded.id, client)
        if (inserted) {
            res.status(200).json({ data: inserted });
        } else {
            res.status(404).json({ message: "error al crear transaccion" });
        }
    } catch (error) {
        console.error('Error al obtener los items:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
