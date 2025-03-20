import { clientDB } from "../../lib/database.js";
import { ObjectId } from "mongodb";
class AuthService {
    constructor() {
        this.collection = clientDB.db("opawork").collection('mensaje'); // Nombre de la colección de usuarios
        /*  this.collection = clientDB.db("keplan").collection('user'); // Nombre de la colección de usuarios */
    }

    // Registro de nuevo usuario
    /*     async insertMessage(decoded, chatId, text, userId) {
            console.log(chatId, text, userId)
            try {
                // Construir la nueva nota
                const message = { chatId, text, sender: decoded.email, to: new ObjectId(userId), timestamp: new Date() };
    
                // Insertar la nota en la base de datos
                const result = await this.collection.insertOne(message);
    
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
        } */
    async insertMessage(chats) {
        console.log(chats)
        /* try {
            // Construir la nueva nota
            const message = { chatId, text, sender: decoded.email, to: new ObjectId(userId), timestamp: new Date() };

            // Insertar la nota en la base de datos
            const result = await this.collection.insertOne(message);

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
        } */
    }
    async generateBotResponse(decoded, chatId, userText) {
        try {
            // Construir la nueva nota
            const botText = `🤖 Respuesta automática: "${userText}"`;
            const message = { chatId, text: botText, sender: "bot", timestamp: new Date() };
            // Insertar la nota en la base de datos
            await this.collection.insertOne(message);

            return botText;
        } catch (error) {
            console.error("Error en insertNotes:", error);
            throw new Error("Error al insertar la nota");
        }
    }



    async getChatsamensajes(decoded) {
        const userId = new ObjectId(decoded.id)
        return await this.collection.aggregate([
            {
                // Filtrar los mensajes donde el usuario es emisor o receptor
                $match: {
                    $or: [
                        { senderId: new ObjectId(userId) }, // El usuario es el emisor
                        { receiverId: new ObjectId(userIda) } // El usuario es el receptor
                    ]
                }
            },
            {
                // Agrupar los mensajes por chatId
                $group: {
                    _id: "$chatId", // Agrupamos por chatId
                    messages: { $push: "$$ROOT" }, // Guardamos todos los mensajes en un array
                }
            },
            {
                // Realizar un lookup con la colección de usuarios para obtener los detalles de los emisores
                $lookup: {
                    from: "user", // Colección de usuarios
                    localField: "messages.senderId", // Enlazamos con el senderId de los mensajes
                    foreignField: "_id", // Comparando con el _id de los usuarios
                    as: "senderDetails" // Los detalles de los emisores se guardan en senderDetails
                }
            },
            {
                // Realizar otro lookup para obtener los detalles de los receptores
                $lookup: {
                    from: "user", // Colección de usuarios
                    localField: "messages.receiverId", // Enlazamos con el receiverId de los mensajes
                    foreignField: "_id", // Comparando con el _id de los usuarios
                    as: "receiverDetails" // Los detalles de los receptores se guardan en receiverDetails
                }
            },
            {
                // Proyectar los campos que queremos ver en el resultado final
                $project: {
                    _id: 0, // No mostrar el _id
                    chatId: "$_id", // Mostrar el chatId
                    messages: 1, // Mostrar todos los mensajes del chat
                    senderDetails: { name: 1, email: 1, typeAccount: 1 }, // Detalles del emisor
                    receiverDetails: { name: 1, email: 1, typeAccount: 1 }, // Detalles del receptor
                }
            }
        ]).toArray();
    }

    async getChatMessages(chatId) {
        // Usamos una agregación con $lookup para hacer la unión entre mensajes y usuarios
        return await this.collection.aggregate([
            // 🔹 Paso 1: Filtrar por chatId en los mensajes
            {
                $match: {
                    chatId: new ObjectId(chatId)  // Filtramos por el chatId del mensaje
                }
            },
            // 🔹 Paso 2: Hacer lookup para obtener los detalles del remitente (senderId)
            {
                $lookup: {
                    from: "user", // Colección de usuarios
                    localField: "senderId", // El campo que contiene el senderId en el mensaje
                    foreignField: "_id", // El campo _id en la colección de usuarios
                    as: "senderDetails" // Almacenamos los detalles del remitente en un array
                }
            },
            // 🔹 Paso 3: Desenrollar `senderDetails`
            {
                $unwind: {
                    path: "$senderDetails",
                    preserveNullAndEmptyArrays: true  // Si no hay usuario, no se pierde el mensaje
                }
            },
            // 🔹 Paso 4: Hacer lookup para obtener los detalles del receptor (receiverId)
            {
                $lookup: {
                    from: "user", // Colección de usuarios
                    localField: "receiverId", // El campo que contiene el receiverId en el mensaje
                    foreignField: "_id", // El campo _id en la colección de usuarios
                    as: "receiverDetails" // Almacenamos los detalles del receptor en un array
                }
            },
            // 🔹 Paso 5: Desenrollar `receiverDetails`
            {
                $unwind: {
                    path: "$receiverDetails",
                    preserveNullAndEmptyArrays: true  // Si no hay receptor, no se pierde el mensaje
                }
            },
            // 🔹 Paso 6: Proyección final (estructurar los resultados)
            {
                $project: {
                    _id: 1,  // ID del mensaje
                    text: 1, // El texto del mensaje
                    timestamp: 1, // Timestamp del mensaje
                    senderId: "$senderId", // ID del remitente
                    receiverId: "$receiverId", // ID del receptor
                    receiverType: 1, // Tipo de receptor (e.g., 'b' para negocio)
                    sender: {
                        _id: "$senderDetails._id",
                        name: "$senderDetails.name",
                        email: "$senderDetails.email"
                    },
                    receiver: {
                        _id: "$receiverDetails._id",
                        name: "$receiverDetails.name",
                        email: "$receiverDetails.email"
                    }
                }
            },
            // 🔹 Paso 7: Ordenar los mensajes por timestamp (opcional)
            {
                $sort: { timestamp: 1 }  // Orden ascendente por fecha
            }
        ]).toArray();  // Convierte el resultado a un array
    }




}

export default AuthService;
