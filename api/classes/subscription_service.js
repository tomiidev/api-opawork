import { ObjectId } from "mongodb";
import { clientDB } from "../../lib/database.js";

class PaymentService {
    constructor() {
        this.collection = clientDB.db("contygo").collection('payment'); // Nombre de la colección de usuarios
    }

    async createPayment(newPayment) {
        // Buscar usuario por email
        const subscription = await this.collection.insertOne(newPayment);
        if (!subscription) throw new Error('Pago no creado');

        return subscription
    }
    async getPayments(id) {
        // Buscar usuario por email
        const result = await this.collection.find({ additional_info: new ObjectId(id) }).toArray()
        console.log(result)
        if (result.length < 0){
            return { message: "No se encontraron pagos." };
        }
        return result
         

    }
    async getSuscription(id) {
        // Buscar usuario por email
        return this.collection.findOne({ user_id: new ObjectId(id) })
        /*   if (subscription) throw new Error('subscription encontrada'); */

    }
}

export default PaymentService;
