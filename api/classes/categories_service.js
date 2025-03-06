import { clientDB } from "../../lib/database.js";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt"
import { generatePassword } from "../lib/generate.js";
class PatientService {
    constructor() {
        this.collection = clientDB.db("contygo").collection('patient'); // Nombre de la colección de usuarios
    }

    async addPatient(decoded, p, hashedPassword) {
        console.log("paciente" + p)
        try {
            // Usar el _id del usuario decodificado para encontrar al usuario en la base de datos
            const userId = decoded.id;

            const patient = {
                userId: new ObjectId(userId),
                name: p.name,
                gender: p.gender,
                age: p.age,
                email: p.email,
                phone: p.phone,
                sessions: [],
                password: hashedPassword,
                forcePasswordChange: true,
                createdAt: new Date(),
            }

            // Se agrega al objeto p el _id del usuario
            const result = await this.collection.insertOne(patient);

            // Si la inserción fue exitosa, MongoDB devolverá un objeto con acknowledged: true
            if (result.acknowledged) {
                return { message: "Paciente agregado exitosamente." };
            }

            return { message: "No se pudo agregar al paciente." };

        } catch (error) {
            console.error('Error al agregar paciente:', error);
            throw new Error('Error al agregar paciente');
        }
    }
    async editPatient(decoded, p) {
        try {
            // Usar el _id del usuario decodificado para encontrar al paciente en la base de datos
            const userId = decoded.id
            const patient = {
                userId: new ObjectId(userId),
                name: p.name,
                gender: p.gender,
                age: p.age,
                email: p.email,
                phone: p.phone,
                sessions: []

            }
            // Actualizar el paciente con los datos proporcionados en p
            const result = await this.collection.updateOne(
                {
                    userId: new ObjectId(userId), _id: new ObjectId(p._id) // Identificador del paciente que quieres actualizar
                },
                {
                    $set: patient
                }
            );

            // Verificamos si se modificaron documentos
            if (result.modifiedCount > 0) {
                return { message: "Paciente actualizado exitosamente." };
            } else {
                return { message: "No se pudo actualizar al paciente o no hubo cambios." };
            }
        } catch (error) {
            console.error('Error al actualizar paciente:', error);
            throw new Error('Error al actualizar paciente');
        }
    }


    async gPatients(decoded) {
        try {
            // Usar el _id del usuario decodificado para encontrar al usuario en la base de datos
            const userId = decoded.id;
            console.log(userId);
            // Actualizamos la lista de métodos de pago del usuario
            const patients = await this.collection.find(
                { userId: new ObjectId(userId) }).toArray()

            if (patients.length < 0) {
                return { message: "No se obtuvieron." };
            }
            console.log("pacientes" + patients)
            return patients
        } catch (error) {
            console.error('Error al actualizar los métodos de pago:', error);
            throw new Error('Error al actualizar los métodos de pago');
        }
    }
    async gPatient(decoded, id) {
        try {
            // Usar el _id del usuario decodificado para encontrar al usuario en la base de datos
            const userId = decoded.id;
            console.log("usuario id", userId, "id", id);

            // Realizamos una operación de agregación con $lookup para unir la colección de pacientes con las sesiones en appointments
            const patient = await this.collection.aggregate([
                {
                    $match: { userId: new ObjectId(userId), _id: new ObjectId(id) }
                },
                {
                    $lookup: {
                        from: 'appointment', // Nombre de la colección donde están las sesiones
                        localField: '_id', // Campo en patient que queremos comparar
                        foreignField: 'patientId', // Campo en appointment que contiene el _id del paciente
                        as: 'sessions' // Alias para las sesiones de la colección appointments
                    }
                },
                {
                    $lookup: {
                        from: 'farm', // Colección de fármacos
                        localField: '_id', // ID del paciente
                        foreignField: 'patientId', // ID del paciente en farmaco
                        as: 'medications' // Alias para los fármacos
                    }
                }
            ]).toArray();

            if (patient.length > 0) {
                console.log(patient);
                return patient;
            }

            // Si no se encuentra el paciente
            return null;

        } catch (error) {
            console.error('Error al obtener el paciente y las sesiones:', error);
            throw new Error('Error al obtener el paciente y las sesiones');
        }
    }

    async dPatient(decoded, p) {
        try {
            const db = clientDB.db();
            const userId = new ObjectId(decoded.id);
            const patientId = new ObjectId(p._id);

            console.log("Eliminando paciente con ID:", patientId, "del usuario:", userId);

            // Eliminar el paciente de la colección principal
            const patientDeleted = await this.collection.deleteOne({ userId: userId, _id: patientId });

            if (patientDeleted.deletedCount === 0) {
                throw new Error("No se encontró el paciente para eliminar.");
            }
            const appointmentsDeleted = await db.collection("appointment").deleteMany({ userId: userId, patientId: patientId })
            console.log(`Citas eliminadas: ${appointmentsDeleted.deletedCount}`);

            const farmsDeleted = await db.collection("farm").deleteMany({ userId: userId, patientId: patientId });
            console.log(`Fincas eliminadas: ${farmsDeleted.deletedCount}`);

            console.log("Paciente y datos relacionados eliminados con éxito");

            // Eliminar datos relacionados en otras colecciones

            return { message: "Paciente eliminado correctamente", patientDeleted };
        } catch (error) {
            console.error("Error al eliminar paciente:", error);
            throw new Error("Error al eliminar paciente");
        }
    }







}

export default PatientService;
