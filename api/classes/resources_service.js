import { ObjectId } from "mongodb";
import { clientDB } from "../../lib/database.js";
import mongoose from "mongoose";
class ResourceService {
    constructor() {
        this.collection = clientDB.db("contygo").collection('resource'); // Nombre de la colección de usuarios
    }
    async addResource(decoded, files) {
        function sanitizeFileName(fileName) {
            return fileName
                .toLowerCase()
                .replace(/ /g, '')  // Elimina espacios
                .replace(/-/g, '')  // Elimina guiones
                .replace(/[^a-z0-9_.]/g, ''); // Solo permite letras, números, _ y .
        }
    
        // Verificar si hay archivos
        if (!Array.isArray(files) || files.length === 0) {
            throw new Error("No se han subido archivos");
        }
    
        // Mapear los archivos a la estructura esperada
        const resources = files.map(file => ({
            userId: new ObjectId(decoded.id),
            name: file.originalname,
            type: file.mimetype, // Usa mimetype en lugar de type
            size: file.size,
            path: sanitizeFileName(file.originalname), // Agregar la ruta donde se guardó el archivo
            uploadedAt: new Date(),
            sharedPatients: []
        }));
    
        // Insertar múltiples archivos en la base de datos
        const uploaded = await this.collection.insertMany(resources);
        
        if (!uploaded) throw new Error("Los archivos no fueron subidos");
    
        return uploaded;
    }
    
    async getResources(decoded) {
        // Buscar usuario por email
       const res =  await  this.collection.find({ userId: new ObjectId(decoded.id) }).toArray()
        if(res.length < 0){
            return { message: "No se encontraron recursos." };
        }
        return res;

    }
    async getResourceById(decoded, resource) {
        // Buscar usuario por email
       const res =  await  this.collection.findOne({ userId: new ObjectId(decoded.id), _id: new ObjectId(resource._id) })
        if(!res._id){
            return { message: "No se encontro el recurso." };
        }
        return res;

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
      
    async shareResources(decoded, patient, resource) {
        try {
          // Verificar si se ha proporcionado el recurso y el paciente
          if (!resource || !patient) {
            return { message: "Recurso o paciente no encontrado" }
          }
      
          // Asegurarse de que ambos IDs estén presentes (y sean válidos)
          if (!resource._id || !patient._id) {
            return { message: "Faltan los identificadores del recurso o paciente" }
          }
      
          // Actualizar el recurso, agregando la referencia del paciente
          const updatedResource = await this.collection.updateOne(
            { _id: new ObjectId(resource._id), userId: new ObjectId(decoded.id) }, // Buscar el recurso por su _id
            {
              $addToSet: { // Usamos $addToSet para evitar duplicados
                sharedPatients: new ObjectId(patient._id) // Agregamos el _id del paciente a la lista sharedPatients
              }
            }
          );
      
          // Verificar si se actualizó algún documento
          if (updatedResource.modifiedCount === 0) {
            return { message: "No se encontró el recurso para compartir" };
          }
          return updatedResource
          // Responder con éxito
        
        } catch (error) {
          console.error("Error al compartir el recurso:", error);
          res.status(500).json({ message: "Hubo un error al compartir el recurso" });
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
