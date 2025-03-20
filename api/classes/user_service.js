import { ObjectId } from "mongodb";
import { clientDB } from "../../lib/database.js";
import { v4 as uuidv4 } from 'uuid';
class UserService {
  constructor() {
    this.collection = clientDB.db("opawork").collection('user'); // Nombre de la colección de usuarios
    /*  this.collection = clientDB.db("keplan").collection('user'); // Nombre de la colección de usuarios */
  }


  /*   async createChatBetweenUserAndBusiness(decoded, idPostulante) {
      try {
        // Usar el _id del usuario decodificado para encontrar al usuario en la base de datos
        const userId = decoded.id;
    
        // Actualizamos la lista de métodos de pago del usuario
        const result = await this.collection.insertOne();
  
        if (result.modifiedCount === 0) {
          return { message: "No se actualizó ninguna categoría de métodos de pago." };
        }
  
        return { message: "Métodos de pago actualizados exitosamente." };
      } catch (error) {
        console.error('Error al actualizar los métodos de pago:', error);
        throw new Error('Error al actualizar los métodos de pago');
      }
    } */
  async updatePaymentMethods(decoded, methods) {
    try {
      // Usar el _id del usuario decodificado para encontrar al usuario en la base de datos
      const userId = decoded.id;
      console.log(methods)
      // Actualizamos la lista de métodos de pago del usuario
      const result = await this.collection.updateOne(
        { _id: new ObjectId(userId) },  // Filtrar por el ID del usuario
        {
          $set: { payment_methods: methods }  // Establecer la lista de métodos de pago
        }
      );

      if (result.modifiedCount === 0) {
        return { message: "No se actualizó ninguna categoría de métodos de pago." };
      }

      return { message: "Métodos de pago actualizados exitosamente." };
    } catch (error) {
      console.error('Error al actualizar los métodos de pago:', error);
      throw new Error('Error al actualizar los métodos de pago');
    }
  }


  async getPaymentMethods(decoded) {
    try {
      // Usar el _id del usuario decodificado para buscar al usuario en la base de datos
      const userId = decoded.id;

      // Buscar el documento del usuario en la colección
      const user = await this.collection.findOne({ _id: new ObjectId(userId) });
      console.log(user);
      if (!user) {
        return { message: "Usuario no encontrado." };
      }

      // Devolver los métodos de pago del usuario
      return user; // Si no tiene métodos de pago, devolver un array vacío
    } catch (error) {
      console.error('Error al obtener los métodos de pago:', error);
      throw new Error('Error al obtener los métodos de pago');
    }
  }


  async updateServiceData(id, data) {
    // Inicializamos un objeto vacío para almacenar solo los campos válidos
    const updateFields = {};
    // Verificamos si cada campo está presente y no es vacío o nulo antes de agregarlo al objeto de actualización
    if (data.service_name) {
      updateFields['service.name'] = data.service_name;
    }

    if (data.service_experience) {
      updateFields['service.description'] = data.service_experience;
    }

    if (data.service_picture) {
      updateFields['service.picture'] = data.service_picture;
    }

    // Si no hay campos para actualizar, devolvemos un valor o mensaje que lo indique
    if (Object.keys(updateFields).length === 0) {
      throw new Error('No hay campos válidos para actualizar');
    }

    // Realizamos la actualización solo con los campos que no son vacíos
    return this.collection.updateOne(
      { _id: new ObjectId(id) },  // Filtrar por ID
      { $set: updateFields }      // Solo actualiza los campos válidos
    );
  }

  async getUserByEmail(email) {

    return this.collection.findOne(
      { email: email }
    )
  }
  async getUserByReceiverId(r) {

    return this.collection.findOne(
      { sender_mongo_id: r }
    )
  }


  
  
  


  async getUserByChats(chats) {

    // Obtener todos los IDs únicos de user1 y user2 en los chats
    const userIds = [...new Set(chats.flatMap(chat => [chat.user1, chat.user2]))];

    // Buscar todos los usuarios que coincidan con esos sender_mongo_id
    const users = await this.collection.find(
      { sender_mongo_id: { $in: userIds } },
      { projection: { sender_mongo_id: 1, name: 1 } } // Solo traer sender_mongo_id y name
    ).toArray();

    // Convertir el resultado en un mapa { sender_mongo_id: name }
    const userMap = new Map(users.map(user => [user.sender_mongo_id, user.name]));

    // Agregar los nombres a cada chat
    return chats.map(chat => ({
      ...chat,
      name_one: userMap.get(chat.user1) || "Usuario desconocido",
      name_two: userMap.get(chat.user2) || "Usuario desconocido",
    }));
  }
  async getUser(form) {
    console.log(form)
    return this.collection.findOne(
      { _id: new ObjectId(form) }
    )
  }
  async postClient(id, client) {

    try {
      // Insertamos la transacción asociada al user_id
      const result = await this.collection.insertOne({
        user_id: new ObjectId(id),  // Convertimos el id a ObjectId
        ...client,             // Incluimos todos los campos del objeto de la transacción           // Añadimos la fecha de la transacción
      });

      return result;
    } catch (error) {
      console.error("Error al insertar el cliente:", error);
      throw error; // Propagamos el error para manejarlo fuera de la función si es necesario
    }

  }
  async getClients(id) {

    try {
      // Insertamos la transacción asociada al user_id
      const result = this.collection.aggregate({
        $match: {
          user_id: new ObjectId(id),  // Convertimos el id a ObjectId
        }
      });

      return result;
    } catch (error) {
      console.error("Error al insertar el cliente:", error);
      throw error; // Propagamos el error para manejarlo fuera de la función si es necesario
    }

  }
  async uploadPicture(decoded, picture) {
    function sanitizeFileName(fileName) {
      return fileName
        .toLowerCase()
        .replace(/ /g, '')  // Elimina espacios
        .replace(/-/g, '')  // Elimina guiones
        .replace(/[^a-z0-9_.]/g, ''); // Solo permite letras, números, _ y .
    }
    try {
      // Insertamos la transacción asociada al user_id
      const result = this.collection.updateOne(
        { _id: new ObjectId(decoded.id) }, // ✅ Filtro correcto
        { $set: { photo: sanitizeFileName(picture[0].originalname) } } // ✅ Actualización correcta
      );


      return result;
    } catch (error) {
      console.error("Error al insertar el cliente:", error);
      throw error; // Propagamos el error para manejarlo fuera de la función si es necesario
    }

  }
  async uploadInformation(decoded, info) {
    try {
      console.log(info)
      // Construimos dinámicamente el objeto de actualización
      const updateFields = {
        languages: info.languages,
        priceRange: info.priceRange,
        especialities: info.especialities,
        subs: info.subs,
        paymentsMethods: info.paymentsMethods,
        sender_mongo_id: info.sender_mongo_id,
        modality: info.modality,
        phone: info.phone,
        description: info.description,
        email: info.email,
        name: info.name,
        especiality: info.especiality,
        modality: info.modality,
        priceRange: info.priceRange,
        socialNetworks: info.socialNetworks
      }

      // Realizamos la actualización en la base de datos
      const result = await this.collection.updateOne(
        { _id: new ObjectId(decoded.id) }, // ✅ Filtro correcto
        { $set: updateFields }  // ✅ Actualización condicionada
      );

      return result;
    } catch (error) {
      console.error("Error al actualizar la información:", error);
      throw error; // Propagamos el error para manejarlo externamente
    }
  }




  async updateFreePlan() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await this.collection.updateMany(
      { freePlan: true, createdAt: { $lte: sevenDaysAgo } },
      { freePlan: false }
    );

    return result.modifiedCount; // Retorna la cantidad de usuarios actualizados
  }


  async getChats(decoded) {
    const chats = await this.collection.aggregate([
      // 🔹 Paso 1: Filtrar al usuario autenticado
      {
        $match: { _id: new ObjectId(decoded.id) }  // Filtramos por el _id del usuario autenticado
      },
      // 🔹 Paso 2: Buscar los chats donde el usuario está involucrado en `participants`
      {
        $lookup: {
          from: "chat",
          let: { userId: "$_id" },  // Usamos el _id del usuario como variable local
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$$userId", "$participants"] }  // Verificamos si el usuario está en el array `participants`
              }
            },
            {
              $project: {
                _id: 1,  // Solo necesitamos el _id del chat
                participants: 1  // Y los participantes en el chat
              }
            }
          ],
          as: "userChats"  // Almacenamos los chats encontrados en el campo 'userChats'
        }
      },
      // 🔹 Paso 3: Desplegar los resultados para trabajar con un solo chat
      {
        $unwind: "$userChats"
      },
      // 🔹 Paso 4: Obtener los usuarios que participan en el chat, excluyendo al usuario autenticado
      {
        $project: {
          chatParticipants: {
            $filter: {
              input: "$userChats.participants",  // Obtenemos los participantes del chat
              as: "participant",  // Definimos una variable para cada participante
              cond: { $ne: ["$$participant", new ObjectId(decoded.id)] }  // Excluimos al usuario autenticado
            }
          }
        }
      },
      // 🔹 Paso 5: Lookup para obtener la información de los participantes (usuarios)
      {
        $lookup: {
          from: "user",  // Buscamos en la colección `user`
          localField: "chatParticipants",  // Usamos los participantes filtrados
          foreignField: "_id",  // Buscamos por el _id en la colección `user`
          as: "chatUsers"  // Guardamos los usuarios encontrados en 'chatUsers'
        }
      },
      // 🔹 Paso 6: Proyección final
      {
        $project: {
          _id: 0,  // Excluimos el _id del documento de salida
          chatUsers: 1  // Mostramos solo los usuarios involucrados en los chats
        }
      }
    ]).toArray();

    // 🔹 Retornar la lista de usuarios con los que el usuario autenticado tiene chats
    return chats.length > 0 ? chats[0].chatUsers : [];
  }



}





export default UserService