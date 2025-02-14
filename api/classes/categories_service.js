import { clientDB } from "../../lib/database.js";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

class PatientService {
    constructor() {
        this.collection = clientDB.db("contygo").collection('patient'); // Nombre de la colección de usuarios
    }

    async addPatient(decoded, p) {
        console.log("paciente" + p)
        try {
            // Usar el _id del usuario decodificado para encontrar al usuario en la base de datos
            const userId = decoded.id;
            const patient = {
                userId: new ObjectId(userId),
                name: p.name,
                gender: p.gender,
                age: p.age,
                email: p.email,
                phone: p.phone,
                sessions:[/* {
                    session_id: new ObjectId(),
                    date: new Date(),
                    time: "",
                    modality: "",
                    doctor_id: new ObjectId(userId),
                    observations: "",
                    medications: [],
                    resourses:[{
                        name: "",
                        type:"",
                        size:0,
                        date: ""

                    }]
                } */]

            }

            // Se agrega al objeto p el _id del usuario
            const result = await this.collection.insertOne(patient);

            // Si la inserción fue exitosa, MongoDB devolverá un objeto con acknowledged: true
            if (result.acknowledged) {
                return { message: "Paciente agregado exitosamente." };
            }

            return { message: "No se pudo agregar al paciente." };

        } catch (error) {
            console.error('Error al agregar paciente:', error);
            throw new Error('Error al agregar paciente');
        }
    }
    async editPatient(decoded, p) {
        try {
            // Usar el _id del usuario decodificado para encontrar al paciente en la base de datos
            const userId = decoded.id
            const patient = {
                userId: new ObjectId(userId),
                name: p.name,
                gender: p.gender,
                age: p.age,
                email: p.email,
                phone: p.phone,
                sessions:[]

            }
            // Actualizar el paciente con los datos proporcionados en p
            const result = await this.collection.updateOne(
                {
                    userId: new ObjectId(userId), _id: new ObjectId(p._id) // Identificador del paciente que quieres actualizar
                },
                {
                    $set: patient
                }
            );

            // Verificamos si se modificaron documentos
            if (result.modifiedCount > 0) {
                return { message: "Paciente actualizado exitosamente." };
            } else {
                return { message: "No se pudo actualizar al paciente o no hubo cambios." };
            }
        } catch (error) {
            console.error('Error al actualizar paciente:', error);
            throw new Error('Error al actualizar paciente');
        }
    }


    async gPatients(decoded) {
        try {
            // Usar el _id del usuario decodificado para encontrar al usuario en la base de datos
            const userId = decoded.id;
            console.log(userId);
            // Actualizamos la lista de métodos de pago del usuario
            const patients = await this.collection.find(
                { userId: new ObjectId(userId) }).toArray()

            if (patients.length < 0) {
                return { message: "No se obtuvieron." };
            }
            console.log("pacientes" + patients)
            return patients
        } catch (error) {
            console.error('Error al actualizar los métodos de pago:', error);
            throw new Error('Error al actualizar los métodos de pago');
        }
    }
    async gPatient(decoded, id) {
        try {
            // Usar el _id del usuario decodificado para encontrar al usuario en la base de datos
            const userId = decoded.id;
            console.log("usuario id", userId, "id", id);
    
            // Realizamos una operación de agregación con $lookup para unir la colección de pacientes con las sesiones en appointments
            const patient = await this.collection.aggregate([
                {
                    $match: { userId: new ObjectId(userId), _id: new ObjectId(id) }
                },
                {
                    $lookup: {
                        from: 'appointment', // Nombre de la colección donde están las sesiones
                        localField: '_id', // Campo en patient que queremos comparar
                        foreignField: 'patientId', // Campo en appointment que contiene el _id del paciente
                        as: 'sessions' // Alias para las sesiones de la colección appointments
                    }
                }
            ]).toArray();
    
            if (patient.length > 0) {
                console.log(patient);
                return patient;
            }
    
            // Si no se encuentra el paciente
            return null;
            
        } catch (error) {
            console.error('Error al obtener el paciente y las sesiones:', error);
            throw new Error('Error al obtener el paciente y las sesiones');
        }
    }
    
    async dPatient(decoded, p) {
        try {
            // Usar el _id del usuario decodificado para encontrar al usuario en la base de datos
            const userId = decoded.id;
            console.log(userId);
            // Actualizamos la lista de métodos de pago del usuario
            const patientDeleted = await this.collection.deleteOne(
                { userId: new ObjectId(userId), id: p.id })

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

export default PatientService;
