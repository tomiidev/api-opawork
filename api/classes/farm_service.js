import { clientDB } from "../../lib/database.js";
import { ObjectId } from "mongodb";
class AuthService {
    constructor() {
        this.collection = clientDB.db("contygo").collection('farm'); // Nombre de la colección de usuarios
        /*  this.collection = clientDB.db("keplan").collection('user'); // Nombre de la colección de usuarios */
    }

    // Registro de nuevo usuario
    async insertFarm(decoded, f) {
        try {
            // Construir la nueva nota
            const newFarm = {
                userId: new ObjectId(decoded.id), // ID del psicólogo
                patientId: new ObjectId(f.patientId),
                date: f.date,
                nombre: f.nombre,
                freq: f.freq,
                description: f.description,
                duration: f.duration,
                dosis: f.dosis,
                status: f.status,
                createdAt: new Date(), // Registrar la fecha de inserción
            };

            // Insertar la nota en la base de datos
            const result = await this.collection.insertOne(newFarm);

            if (result.insertedId) {
                return {
                    success: true,
                    message: "Farmaco insertado correctamente",
                    insertedId: result,
                };
            } else {
                return { success: false, message: "No se pudo insertar el farmaco" };
            }
        } catch (error) {
            console.error("Error en insertNotes:", error);
            throw new Error("Error al insertar la nota");
        }
    }
    async gPatientFarms(decoded, p) {
        try {

            // Insertar la nota en la base de datos
            const result = await this.collection.find({ userId: new ObjectId(decoded.id), patientId: new ObjectId(p) }).toArray();

            if (result.length < 0) {
                return { success: false, message: "No hay farmacos para este paciente" };
            }
            return result
        } catch (error) {
            console.error("Error en insertNotes:", error);
            throw new Error("Error al insertar la nota");
        }
    }
    async dPatientFarm(decoded, f, p) {
        try {

            // Insertar la nota en la base de datos
            const result = await this.collection.deleteOne({ userId: new ObjectId(decoded.id), patientId: new ObjectId(p), _id: new ObjectId(f) })

            if (result.deletedCount < 0) {
                return { success: false, message: "No hay farmacos para este paciente" };
            }
            return result
        } catch (error) {
            console.error("Error en insertNotes:", error);
            throw new Error("Error al insertar la nota");
        }
    }

    async dPatientFarms(decoded, p) {
        try {
            // Usar el _id del usuario decodificado para encontrar al usuario en la base de datos
            const userId = decoded.id;
            // Actualizamos la lista de métodos de pago del usuario
            const patientDeleted = await this.collection.deleteMany(
                { userId: new ObjectId(userId), patientId: new ObjectId(p.id)})

            if (patientDeleted.deletedCount < 0) {
                return { message: "No se elimino." };
            }

            return patientDeleted
        } catch (error) {
            console.error('Error al actualizar los métodos de pago:', error);
            throw new Error('Error al actualizar los métodos de pago');
        }
    }


}

export default AuthService;
