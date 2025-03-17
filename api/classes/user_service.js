import { ObjectId } from "mongodb";
import { clientDB } from "../../lib/database.js";

class UserService {
  constructor() {
    this.collection = clientDB.db("opawork").collection('user'); // Nombre de la colección de usuarios
    /*  this.collection = clientDB.db("keplan").collection('user'); // Nombre de la colección de usuarios */
  }


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
        modality: info.modality,
        phone: info.phone,
        description: info.description,
        email: info.email,
        name: info.name,
        especiality: info.especiality,
        modality: info.modality,
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
}





export default UserService