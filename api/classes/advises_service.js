import { ObjectId } from "mongodb";
import { clientDB } from "../../lib/database.js";
import mongoose from "mongoose";
class ResourceService {
  constructor() {
    this.collection = clientDB.db("opawork").collection('aviso'); // Nombre de la colección de usuarios
  }
  async uploadInformation(decoded, info) {
    try {
      console.log(info)
      // Construimos dinámicamente el objeto de actualización
      const updateFields = {
        bussinesId: new ObjectId(decoded.id),
        languages: info.languages,
        priceRange: info.priceRange,
        especialities: info.especialities,
        time: info.time,
        subs: info.subs,
        description: info.description,
        title: info.name,
        modality: info.modality,
        publishedAt: new Date(),
        applys: []
      }

      // Realizamos la actualización en la base de datos
      const result = await this.collection.insertOne(updateFields);

      return result;
    } catch (error) {
      console.error("Error al actualizar la información:", error);
      throw error; // Propagamos el error para manejarlo externamente
    }
  }

  async getAdvises(decoded) {
    // Buscar usuario por email
    const res = await this.collection.find({ bussinesId: new ObjectId(decoded.id) }).toArray()
    if (res.length < 0) {
      return { message: "No se encontraron avisos." };
    }
    return res;

  }
  async getAllUserAdvises(decoded) {
    console.log(decoded)
    const res = await this.collection.aggregate([
      /*  {
         $match: {
           applys: { $not: { $in: [new ObjectId(decoded.id)] } } // Filtra los documentos donde decoded.id NO esté en applys
         }
       }, */
      {
        $lookup: {
          from: "user",
          localField: "bussinesId",
          foreignField: "_id",
          as: "userData"
        }
      },
      { $unwind: "$userData" }
    ]).toArray();

    if (!res.length) {
      return { message: "No se encontraron avisos." };
    }

    console.log(res);
    return res
  }

 /*  async getAdviseById(id) {
    console.log(id);

    const res = await this.collection.aggregate([
      {
        $match: { _id: new ObjectId(id) } // Filtra por ID
      },

      {
        $lookup: {
          from: "user", // Asegúrate de que sea el nombre correcto
          localField: "bussinesId", // Campo en "advises"
          foreignField: "_id", // Campo en "users"
          as: "userData" // Resultado en este campo
        }
      },
      {
        $unwind: "$userData" // Convierte array en objeto
      }
    ]).toArray();

    if (!res.length) {
      return { message: "No se encontró el aviso." };
    }

    return res[0]; // Devolver solo el primer resultado
  } */
   /*  async getAdviseById(id) {
      console.log(id);
    
      const res = await this.collection.aggregate([
        {
          $match: { _id: new ObjectId(id) } // Filtra por ID del aviso
        },
    
        {
          $lookup: {
            from: "user", // Asegúrate de que sea el nombre correcto de la colección de usuarios
            localField: "bussinesId", // Campo en "aviso"
            foreignField: "_id", // Campo en "user"
            as: "userData" // Resultado en este campo
          }
        },
        {
          $unwind: "$userData" // Convierte el array en objeto
        },
    
        // Agregar una etapa para buscar otros avisos que compartan al menos una subespecialidad
        {
          $lookup: {
            from: "aviso", // Filtramos en la misma colección de "aviso"
            localField: "subs", // Subespecialidades de la oferta actual
            foreignField: "subs", // Subespecialidades en otros avisos
            as: "jobRelated" // Ofertas relacionadas
          }
        },
    
        {
          $addFields: {
            jobRelated: {
              $filter: {
                input: "$jobRelated", // Array de ofertas relacionadas
                as: "jobRelated", // Alias para los elementos dentro del array
                cond: { $ne: ["$relatedJob._id", new ObjectId(id)] } // Excluir la oferta actual de los resultados
              }
            }
          }
        }
      ]).toArray();
    
      if (!res.length) {
        return { message: "No se encontró el aviso." };
      }
    
      // Devolver solo la oferta original junto con las ofertas relacionadas
      return res[0]; 
    }
     */
    async getAdviseById(id) {
      console.log(id);
    
      const res = await this.collection.aggregate([
        {
          $match: { _id: new ObjectId(id) } // Filtra por ID del aviso
        },
    
        {
          $lookup: {
            from: "user", // Asegúrate de que sea el nombre correcto de la colección de usuarios
            localField: "bussinesId", // Campo en "aviso"
            foreignField: "_id", // Campo en "user"
            as: "userData" // Resultado en este campo
          }
        },
        {
          $unwind: "$userData" // Convierte el array en objeto
        },
    
        // Agregar una etapa para buscar otros avisos que compartan al menos una subespecialidad
        {
          $lookup: {
            from: "aviso", // Filtramos en la misma colección de "aviso"
            localField: "subs", // Subespecialidades de la oferta actual
            foreignField: "subs", // Subespecialidades en otros avisos
            as: "jobRelated" // Ofertas relacionadas
          }
        },
    
        {
          $addFields: {
            jobRelated: {
              $filter: {
                input: "$jobRelated", // Array de ofertas relacionadas
                as: "jobRelated", // Alias para los elementos dentro del array
                cond: {
                  $ne: ["$$jobRelated._id", new ObjectId(id)] // Excluir la oferta actual de los resultados
                }
              }
            }
          }
        }
      ]).toArray();
    
      if (!res.length) {
        return { message: "No se encontró el aviso." };
      }
    
      // Devolver solo la oferta original junto con las ofertas relacionadas
      return res[0]; 
    }
  async getPatientsResources(decoded, patient) {
    try {
      // Verificar si se proporciona un paciente
      if (!patient || !patient) {
        return { message: "Paciente no proporcionado o inválido" };
      }

      // Buscar los recursos que están compartidos con este paciente
      const resources = await this.collection.find({
        userId: new ObjectId(decoded.id), // Asegúrate de que los recursos son del usuario actual
        sharedPatients: new ObjectId(patient._id) // Filtrar los recursos donde el paciente esté en la lista de pacientes compartidos
      }).toArray();

      // Verificar si se encontraron recursos
      if (resources.length === 0) {
        return { message: "No se encontraron recursos compartidos con este paciente." };
      }

      // Retornar los recursos encontrados
      return resources;
    } catch (error) {
      console.error("Error al obtener los recursos del paciente:", error);
      return { message: "Hubo un error al obtener los recursos." };
    }
  }


  async applyOffer(decoded, id) {
    try {
      if (!ObjectId.isValid(id) || !ObjectId.isValid(decoded.id)) {
        return { message: "ID inválido" };
      }


      // Actualizar el recurso agregando el ID del usuario en applys
      const updatedResource = await this.collection.updateOne(
        { _id: new ObjectId(id) },
        { $addToSet: { applys: new ObjectId(decoded.id) } } // Evita duplicados
      );

      if (updatedResource.modifiedCount === 0) {
        return { message: "No se encontró el aviso para aplicar o ya aplicaste" };
      }

      console.log("Aplicando a la oferta:", updatedResource);
      return updatedResource

    } catch (error) {
      console.error("Error al aplicar a la oferta:", error);
      return { message: "Hubo un error al aplicar a la oferta", error };
    }
  }
  async deletePatientResources(decoded, patient, resource) {
    try {
      // Verificar si se ha proporcionado el recurso y el paciente
      if (!resource || !patient) {
        return { message: "Recurso o paciente no encontrado" };
      }

      // Asegurarse de que ambos IDs estén presentes (y sean válidos)
      if (!resource._id || !patient._id) {
        return { message: "Faltan los identificadores del recurso o paciente" };
      }

      // Eliminar el paciente de la lista 'sharedPatients' en el recurso
      const updatedResource = await this.collection.updateOne(
        { _id: new ObjectId(resource._id), userId: new ObjectId(decoded.id) }, // Buscar el recurso por su _id y usuario
        {
          $pull: { // Usamos $pull para eliminar un paciente del array 'sharedPatients'
            sharedPatients: new ObjectId(patient._id) // Eliminamos el _id del paciente de la lista
          }
        }
      );

      // Verificar si se actualizó algún documento
      if (updatedResource.modifiedCount === 0) {
        return { message: "No se encontró el recurso o el paciente no estaba compartido" };
      }

      return { message: "Recurso eliminado exitosamente del paciente", data: updatedResource };

    } catch (error) {
      console.error("Error al eliminar el recurso:", error);
      return { message: "Hubo un error al eliminar el recurso" }; // Asegúrate de enviar un mensaje claro
    }
  }


}

export default ResourceService;
