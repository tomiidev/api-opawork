import { ObjectId } from "mongodb";
import { clientDB } from "../../lib/database.js";

// services/ProductService.js
class AppointmentService {
    constructor() {
        this.collection = clientDB.db("contygo").collection('appointment'); // Nombre de la colección de usuarios
    }
    async dAppointment(decoded, p) {
        try {
            // Usar el _id del usuario decodificado para encontrar al usuario en la base de datos
            const userId = decoded.id;
            console.log(userId);
            // Actualizamos la lista de métodos de pago del usuario
            const appointmentDeleted = await this.collection.deleteOne(
                { userId: new ObjectId(userId), _id: new ObjectId(p._id) })

            if (appointmentDeleted.deletedCount < 0) {
                return { message: "No se elimino." };
            }
            console.log(appointmentDeleted)
            return appointmentDeleted
        } catch (error) {
            console.error('Error al actualizar los métodos de pago:', error);
            throw new Error('Error al actualizar los métodos de pago');
        }
    }
    async gAppointments(decoded) {
        try {
            // Usar el _id del usuario decodificado para encontrar al usuario en la base de datos
            const userId = decoded.id;
            console.log(userId);
            // Actualizamos la lista de métodos de pago del usuario
            const appointments = await this.collection.find(
                { userId: new ObjectId(userId) }).toArray()

            if (appointments.length < 0) {
                return { message: "No hay citas." };
            }

            return appointments
        } catch (error) {
            console.error('Error al actualizar los métodos de pago:', error);
            throw new Error('Error al actualizar los métodos de pago');
        }
    }
    async gAppointment(decoded, id) {
        try {
            // Usar el _id del usuario decodificado para encontrar al usuario en la base de datos
            const userId = decoded.id;
            console.log(userId);
            // Actualizamos la lista de métodos de pago del usuario
            const appointment = await this.collection.find(
                { userId: new ObjectId(userId), _id: new ObjectId(id) }).toArray()

            if (appointment.length < 0) {
                return { message: "No hay cita." };
            }
            console.log(appointment)
            return appointment
        } catch (error) {
            console.error('Error al actualizar los métodos de pago:', error);
            throw new Error('Error al actualizar los métodos de pago');
        }
    }
    async addAppointment(decoded, p) {
        try {
            // Usar el _id del usuario decodificado para encontrar al usuario en la base de datos
            const userId = decoded.id;
            const appointment = {
                userId: new ObjectId(userId),
                date: p.date,
                time: p.time,
                type: p.description,
                reason: p.reason,
                duration: p.duration,
                modality: p.modality,
                patientId: new ObjectId(p.patientId),
                status: p.status,
                nombre: p.nombre,

            }

            // Se agrega al objeto p el _id del usuario
            const result = await this.collection.insertOne(appointment);

            // Si la inserción fue exitosa, MongoDB devolverá un objeto con acknowledged: true
            if (result.acknowledged) {
                return { message: "Cita agregada exitosamente." };
            }

            return { message: "No se pudo agregar la cita." };

        } catch (error) {
            console.error('Error al agregar paciente:', error);
            throw new Error('Error al agregar paciente');
        }
    }
    async editAppointment(decoded, p) {
        try {
            // Usar el _id del usuario decodificado para encontrar al usuario en la base de datos
            const userId = decoded.id;
            const appointment = {
                userId: new ObjectId(userId),
                date: p.date,
                time: p.time,
                description: p.description,
                reason: p.reason,
                duration: p.duration,
                modality: p.modality,
                patientId: new ObjectId(p.patientId),
                status: p.status,
                nombre: p.nombre,

            }

            // Se agrega al objeto p el _id del usuario
            const result = await this.collection.updateOne(
                {
                    userId: new ObjectId(userId) // Identificador del paciente que quieres actualizar
                },
                {
                    $set: appointment
                }
            );

            // Si la inserción fue exitosa, MongoDB devolverá un objeto con acknowledged: true
            if (result.modifiedCount > 0) {
                return result;
            }

            return { message: "No se pudo editar la cita." };

        } catch (error) {
            console.error('Error al agregar paciente:', error);
            throw new Error('Error al agregar paciente');
        }
    }

}

export default AppointmentService;
