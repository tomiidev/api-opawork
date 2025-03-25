import jwt from "jsonwebtoken"
import ResourcetService from "../classes/advises_service.js";
import UserService from "../classes/user_service.js";
import { uploadFileToS3 } from "../s3/s3.js";
import { sendEmail, sendEmailSelected } from "../nodemailer/config.js";
const rService = new ResourcetService()
const uService = new UserService()
// Registro de usuario

export const addAdvise = async (req, res) => {
    const token = req.cookies?.sessionToken;

    try {
        // Verificamos si el token está presente
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const { body: formData } = req;
        if (!formData) {
            return res.status(400).json({ message: "No se ha subido ningún aviso" });
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
        const r = await rService.uploadInformation(decoded, formData);
        if (r.insertedId) {

            // Retornamos el resultado exitoso
            return res.status(200).json({ data: r, message: "Archivo obtenido" });
        }

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};
export const changeStatusOfApplie = async (req, res) => {
    const token = req.cookies?.sessionToken;

    try {
        // Verificamos si el token está presente
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const { user, adviseId } = req.body;

        // Decodificamos el token para obtener el _id del usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET);




        // Llamamos al servicio para actualizar los métodos de pago
        const r = await rService.changeStateOfApplie(decoded, user);
        const a = await rService.getAdviseById(decoded, adviseId);
        if (r.success) {
            const guser = await uService.getUser(user)
            if (guser._id && a._id) {
                await sendEmailSelected(guser, a)
                return res.status(200).json({ data: r, message: "Avisos obtenidos" });
            }
        }

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};
export const gAdvises = async (req, res) => {
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
        const r = await rService.getAdvises(decoded);
        if (r.length > 0) {
            console.log(r)
            return res.status(200).json({ data: r, message: "Avisos obtenidos" });
        }

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};
export const getAdvisesByEspeciality = async (req, res) => {
    /*   const token = req.cookies?.sessionToken; */

    try {
        // Verificamos si el token está presente
        /*    if (!token) {
               return res.status(401).json({ error: 'No autorizado' });
           } */

        // Decodificamos el token para obtener el _id del usuario
        const { id } = req.params
        // Llamamos al servicio para actualizar los métodos de pago
        const r = await rService.getAdvisesByEspeciality(id);
        if (r.length > 0) {

            return res.status(200).json({ data: r, message: "Avisos obtenidos" });
        }

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};
/* export const gAllAdvises = async (req, res) => {
    const token = req.cookies?.sessionToken;

    try {
        // Verificamos si el token está presente
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        // Decodificamos el token para obtener el _id del usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET);




        // Llamamos al servicio para actualizar los métodos de pago
        const r = await rService.getAllUserAdvises(decoded);
        if (r.length > 0) {
            console.log(r)
            return res.status(200).json({ data: r, message: "Avisos obtenidos" });
        }

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
}; */
export const gAllAdvises = async (req, res) => {
    try {
        const token = req.cookies?.sessionToken;
        let advises;

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                advises = await rService.getAllUserAdvises(decoded);
            } catch {
                return res.status(401).json({ error: 'Token inválido o expirado' });
            }
        } else {
            advises = await rService.getAllUserAdvisesWithOutID();
        }
        console.log(advises)
        res.status(advises?.length > 0 ? 200 : 404).json({
            data: advises || [],
            message: advises?.length ? "Avisos obtenidos correctamente" : "No hay avisos disponibles",
            userAuthenticated: !!token
        });

    } catch (error) {
        console.error('Error al obtener los avisos:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
export const gTitleAdvise = async (req, res) => {
    const token = req.cookies.sessionToken;

    try {
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const { id } = req.params; // Recibir el array de chats
        console.log("titlo aviso" + id)
        if (!id) {
            return res.status(400).json({ error: 'Datos de chats inválidos' });
        }

        // Obtener los nombres de los usuarios en los chats
        const r = await rService.getTitleAdvise(id);
        const d = await rService.getTitleAdviseBusiness(id);
        console.log(r)
        res.status(200).json({ data: { r: r, d: d }, message: "titulo obtenido" });


    } catch (error) {
        console.error("Error obteniendo usuarios:", error);
        res.status(500).json({ message: "Error interno del servidor", error });
    }
};
export const gAppliesOfOffer = async (req, res) => {
    const token = req.cookies?.sessionToken;

    try {
        const { id } = req.params
        // Verificamos si el token está presente
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        if (!id) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        // Decodificamos el token para obtener el _id del usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET);



        // Llamamos al servicio para actualizar los métodos de pago
        const patients = await rService.gAppliesOfOffer(decoded, id);
        if (patients.length > 0) {
            console.log(patients)
            // Retornamos el resultado exitoso
            return res.status(200).json({ data: patients, message: "Aplicantes" });
        }

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};
export const gAllFreelanceAdvises = async (req, res) => {
    const token = req.cookies?.sessionToken;

    try {
        // Verificamos si el token está presente
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        // Decodificamos el token para obtener el _id del usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET);




        // Llamamos al servicio para actualizar los métodos de pago
        const r = await rService.getFreelanceAdvises(decoded);
        if (r.length > 0) {
            console.log(r)
            return res.status(200).json({ data: r, message: "Avisos obtenidos" });
        }

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};
export const getAdviseById = async (req, res) => {
    /* const token = req.cookies?.sessionToken; */

    try {
        const { id } = req.params;
        // Verificamos si el token está presente
        /*     if (!token) {
                return res.status(401).json({ error: 'No autorizado' });
            } */




        // Llamamos al servicio para actualizar los métodos de pago
        const r = await rService.getAdviseByIdANDrelated(id);
        if (r._id) {
            console.log(r)
            return res.status(200).json({ data: r, message: "Aviso obtenidos" });
        }

    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};

export const applyToOffer = async (req, res) => {
    const token = req.cookies?.sessionToken;

    try {
        // Verificamos si el token está presente
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const { id, idbusiness } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Faltan datos" });
        }
        // Decodificamos el token para obtener el _id del usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET);




        // Llamamos al servicio para actualizar los métodos de pago
        const result = await rService.applyOffer(decoded, id);

        if (result.modifiedCount > 0) {
            const advise = await rService.getAdviseById(idbusiness, id);
            console.log(advise)
            if (advise._id) {

                await sendEmail(decoded, advise)
                return res.status(200).json({ data: result, message: "Aplicacion relizada" });
            }
        }
        res.status(400).json({ message: "errro" })
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
