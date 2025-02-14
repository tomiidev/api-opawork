import { ObjectId } from "mongodb";
import { clientDB } from "../../lib/database.js";

class WaitService {
    constructor() {
        this.collection = clientDB.db("contygo").collection('booking'); // Nombre de la colección de usuarios
        /*  this.collection = clientDB.db("keplan").collection('user'); // Nombre de la colección de usuarios */
    }




    async dBookings(booking) {
        console.log(booking)
        try {
            // Usar el _id del usuario decodificado para buscar al usuario en la base de datos
    

            // Buscar el documento del usuario en la colección
            const users = await this.collection.deleteOne({ therapistId: new ObjectId(booking.therapistId), _id: new ObjectId(booking._id) })

            if (users.deletedCount <0) {
                return { message: "reserva no eliminada." };
            }
            console.log(users)
            // Devolver los métodos de pago del usuario
            return users; // Si no tiene métodos de pago, devolver un array vacío
        } catch (error) {
            console.error('Error al obtener los métodos de pago:', error);
            throw new Error('Error al obtener los métodos de pago');
        }
    }

    async getBookings(decoded) {
        try {
            // Usar el _id del usuario decodificado para buscar al usuario en la base de datos
            const userId = decoded.id;

            // Buscar el documento del usuario en la colección
            const users = await this.collection.find({ therapistId: new ObjectId(userId) }).toArray();

            if (users.length < 0) {
                return { message: "reservas no encontradas." };
            }
            console.log(users)
            // Devolver los métodos de pago del usuario
            return users; // Si no tiene métodos de pago, devolver un array vacío
        } catch (error) {
            console.error('Error al obtener los métodos de pago:', error);
            throw new Error('Error al obtener los métodos de pago');
        }
    }






    async makeBooking(info) {
        console.log(info.idTherapist);

        try {
            // Verificamos que el idTherapist sea válido antes de usarlo
            if (!ObjectId.isValid(info.idTherapist)) {
                throw new Error('ID del terapeuta no es válido');
            }

            const booking = {
                therapistId: new ObjectId(info.idTherapist),
                email: info.email,
                phone: info.phone,
                message: info.message,
                name: info.name,
                gender: info.gender,
                age: info.age
            };

            // Realizamos la actualización en la base de datos
            const result = await this.collection.insertOne(booking);
            if (!result.acknowledged) {
                throw new Error('Error al insertar el documento');
            }
            return result;
        } catch (error) {
            console.error("Error al insertar la información:", error);
            throw error; // Propagamos el error para manejarlo externamente
        }
    }


}

export default WaitService