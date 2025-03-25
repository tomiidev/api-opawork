import { ObjectId } from "mongodb";
import { clientDB } from "../../lib/database.js";
import mongoose from "mongoose";
class ResourceService {
  constructor() {
    this.collection = clientDB.db("opawork").collection('aviso'); // Nombre de la colección de usuarios
  }


  async getTitleAdviseBusiness(userId) {
    // Buscamos el aviso en base al userId del aplicante
    const aviso = await this.collection.aggregate([
      {
        $match: {
          "bussinesId": new ObjectId(userId)

        }
      },
      {
        $project: {
          _id: 0,
          title: "$title" // Extraemos solo el título del aviso
        }
      }
    ]).toArray();

    return aviso.length > 0 ? aviso[0].title : null;
  }
  async getTitleAdvise(userId) {
    // Buscamos el aviso en base al userId del aplicante
    const aviso = await this.collection.aggregate([
      {
        $match: {
          "applys": { // Filtramos por el array "applys"
            $elemMatch: { userId: new ObjectId(userId) } // Buscamos un objeto dentro del array que tenga el userId igual al idReceiver
          }

        }
      },
      {
        $project: {
          _id: 0,
          title: "$title" // Extraemos solo el título del aviso
        }
      }
    ]).toArray();

    return aviso.length > 0 ? aviso[0].title : null;
  }
  async changeStateOfApplie(decoded, user) {
    try {
      // Usamos $[<identifier>] para recorrer todo el array y actualizar los elementos que coincidan
      const result = await this.collection.updateOne(
        {
          "bussinesId": new ObjectId(decoded.id), // Buscamos el aviso correcto por ID 
        },
        {
          $set: {
            // Usamos el operador posicional para actualizar todos los elementos en applys que coincidan
            "applys.$[elem].status": "seleccionado" // Actualizamos el estado del aplicante
          }
        },
        {
          // Usamos el arrayFilters para identificar los elementos dentro de applys que deben ser modificados
          arrayFilters: [{ "elem.userId": new ObjectId(user) }]
        }
      );

      if (result.modifiedCount > 0) {
        console.log('Estado actualizado correctamente');
        return { success: true, message: 'Estado del aplicante actualizado' };
      } else {
        console.log('No se encontró el aplicante o no se hizo ninguna modificación');
        return { success: false, message: 'No se encontró el aplicante' };
      }
    } catch (err) {
      console.error('Error al actualizar el estado del aplicante:', err);
      return { success: false, message: 'Hubo un error al actualizar el estado' };
    }
  }


  async gAppliesOfOffer(decoded, id) {
    try {
      const userId = new ObjectId(decoded.id);
      const offerId = new ObjectId(id);

      const result = await this.collection.aggregate([
        {
          $match: { bussinesId: userId, _id: offerId } // Filtra la oferta específica del negocio
        },
        {
          $unwind: "$applys" // Descompone el array de aplicaciones
        },
        {
          $lookup: {
            from: "user", // Colección de usuarios
            localField: "applys.userId", // Campo dentro de applys que contiene el ID del usuario
            foreignField: "_id", // Campo _id en la colección "user"
            as: "applicantData" // Nuevo array con la información del usuario
          }
        },
        {
          $unwind: "$applicantData" // Para aplanar la estructura y obtener cada usuario individualmente
        },
        {
          $group: {
            _id: "$_id", // Mantiene la agrupación por oferta
            applicants: { $push: "$applicantData" } // Agrupa todos los usuarios en un array
          }
        }
      ]).toArray();

      if (!result.length) {
        return { message: "No se obtuvieron postulantes." };
      }

      return result[0].applicants; // Retorna solo los postulantes
    } catch (error) {
      console.error("Error al obtener los postulantes:", error);
      throw new Error("Error al obtener los postulantes");
    }
  }

  /*      async gAppliesOfOffer(decoded, id) {
        try {
            const userId = new ObjectId(decoded.id);
            const offerId = new ObjectId(id);
            console.log(offerId)
            const result = await this.collection.aggregate([
                {
                    $match: { bussinesId: userId, _id: offerId } // Filtra la oferta específica del negocio
                },
                {
                    $lookup: {
                        from: "user", // Colección donde están los usuarios
                        localField: "applys", // Array con los IDs de los usuarios que aplicaron
                        foreignField: "_id", // Campo _id en la colección "user"
                        as: "applicants" // Nombre del nuevo array con los datos de los usuarios
                    }
                }
            ]).toArray();
    
            if (!result.length) {
                return { message: "No se obtuvieron postulantes." };
            }
    
            return result[0].applicants; // Retorna solo los datos de los postulantes
        } catch (error) {
            console.error('Error al obtener los postulantes:', error);
            throw new Error('Error al obtener los postulantes');
        }
    }  */
  async uploadInformation(decoded, info) {
    try {
      console.log(info)
      // Construimos dinámicamente el objeto de actualización
      const updateFields = {
        bussinesId: new ObjectId(decoded.id),
        languages: info.languages,
        fixedPrice: info.fixedPrice,
        endDateProject: info.endDateProject,
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
  async getAdvisesByEspeciality(esp) {
    const regexEsp = new RegExp(esp.split(' ').join('.*'), 'i'); // 'i' para hacerlo insensible a mayúsculas/minúsculas

    // Buscar usuario por email
    const res = await this.collection.find({
      especialities: { $elemMatch: { $regex: regexEsp } }
    }).toArray();
    if (res.length === 0) {
      return { message: "No se encontraron avisos." };
    }
    return res;

  }


  async getAdviseById(idbusiness, id) {
    // Buscar usuario por email
    const res = await this.collection.findOne({
      _id: new ObjectId(id), bussinesId: new ObjectId(idbusiness)
    })

    if (!res._id) {
      return { message: "No se encontro aviso." };
    }
    return res;

  }
  async getFreelanceAdvises(decoded) {
    // Buscar usuario por email
    const res = await this.collection.find({
      applys: {
        $elemMatch: { userId: new ObjectId(decoded.id) }
      }
    }).toArray();

    if (res.length < 0) {
      return { message: "No se encontraron avisos." };
    }
    return res;

  }
  /*   async getAllUserAdvises(decoded) {
      console.log(decoded)
      const res = await this.collection.aggregate([
       
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
    } */
  async getAllUserAdvisesWithOutID() {


    const res = await this.collection.find().toArray()

    if (res.length < 0) {
      return { message: "No se encontraron avisos." };
    }

 
    return res;
  }
  async getAllUserAdvises(decoded) {
    console.log(decoded);

    const res = await this.collection.aggregate([
      {
        $match: {
          // Busca al menos una coincidencia en especialities
          especialities: { $in: decoded.especialities },

          // Excluye si el usuario ya aplicó
          applys: {
            $not: {
              $elemMatch: { userId: new ObjectId(decoded.id) }
            }
          }
        }
      },
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
    return res;
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
  async getAdviseByIdANDrelated(id) {
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
        {
          $addToSet: {
            applys: {
              userId: new ObjectId(decoded.id),
              status: "pendiente",
              appliedAt: new Date()
            }
          }
        } // Evita duplicados
      )

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
