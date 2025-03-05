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
    async dOwnAppointment(decoded, p) {
        console.log(p)
        try {
            // Usar el _id del usuario decodificado para encontrar al usuario en la base de datos
            const userId = decoded.id;
            console.log(userId);
            // Actualizamos la lista de métodos de pago del usuario
            const appointmentDeleted = await this.collection.deleteOne(
                { patientId: new ObjectId(userId), _id: new ObjectId(p._id) })

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
    async gOwnPatientsAppointments(decoded) {
        try {
            // Usar el _id del usuario decodificado para encontrar al usuario en la base de datos
            const userId = decoded.id;
            console.log(userId);
            // Actualizamos la lista de métodos de pago del usuario
            const appointments = await this.collection.find(
                { patientId: new ObjectId(userId) }).toArray()

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
    async editOwnAppointment(decoded, p) {
        try {
            // Usar el _id del usuario decodificado para encontrar al usuario en la base de datos

            const appointment = {
                userId: new ObjectId(decoded.psycoId),
                date: p.date,
                time: p.time,
                description: p.description,
                reason: p.reason,
                duration: p.duration,
                modality: p.modality,
                patientId: new ObjectId(decoded.id),
                status: p.status,
                nombre: p.nombre,

            }

            // Se agrega al objeto p el _id del usuario
            const result = await this.collection.updateOne(
                {
                    patientId: new ObjectId(decoded.id) // Identificador del paciente que quieres actualizar
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
    /* async insertNotes(decoded, sessionNotes, idSession) {
        try {
            // Construir la nueva nota
            const newNote = {
                userId: new ObjectId(decoded.id), // ID del psicólogo
                sessionNotes,
                createdAt: new Date(), // Registrar la fecha de inserción
            };
    
            // Insertar la nota en la base de datos
            const result = await this.collection.insertOne(newNote);
    
            if (result.insertedId) {
                return {
                    success: true,
                    message: "Nota insertada correctamente",
                    insertedId: result,
                };
            } else {
                return { success: false, message: "No se pudo insertar la nota" };
            }
        } catch (error) {
            console.error("Error en insertNotes:", error);
            throw new Error("Error al insertar la nota");
        }
    } */
    /*  async insertNotes(decoded, sessionNote, sessionId, notes) {
         console.log("sessionNote:", sessionNote, "sessionId:", sessionId, "notes:", notes);
         try {
             const sessionFilter = {
                 _id: new ObjectId(sessionId),
                 userId: new ObjectId(decoded.id),
                 status: "terminada"
             };
 
             // 1️⃣ Si sessionNote es vacío, eliminamos la última nota
             if (sessionNote.note === "") {
                 // Eliminar la última nota del array
                 const popResult = await this.collection.updateOne(
                     sessionFilter,
                     { $pop: { notes: 1 } } // $pop elimina el último elemento del array
                 );
 
                 if (popResult.modifiedCount > 0) {
                     return {
                         success: true,
                         message: "Última nota eliminada correctamente"
                     };
                 }
             } else {
                 // 2️⃣ Crear la nueva nota a insertar en el array 'notes'
                 const noteEntry = {
                     _id: new ObjectId(), // Generar un nuevo ObjectId para la nueva nota
                     note: sessionNote.note, // El contenido de la nueva nota
                     createdAt: sessionNote.createdAt // Timestamp de la creación
                 };
 
                 console.log("noteEntry:", noteEntry); // Verifica que la nueva nota se genera correctamente
 
                 // 3️⃣ Insertar la nueva nota en el array 'notes'
                 const pushResult = await this.collection.updateOne(
                     sessionFilter,
                     { $push: { notes: noteEntry } }
                 );
 
                 if (pushResult.modifiedCount > 0) {
                     return {
                         success: true,
                         message: "Nota insertada correctamente"
                     };
                 }
             }
 
             // Si no se realizó ninguna modificación
             return {
                 success: false,
                 message: "No se pudo insertar ni eliminar la nota"
             };
 
         } catch (error) {
             console.error("Error en insertNotes:", error);
             throw new Error("Error al insertar la nota y eliminar la última nota");
         }
     } */
    async insertNotes(decoded, sessionNote, sessionId, notes) {
        console.log("sessionNote:", sessionNote, "sessionId:", sessionId, "notes:", notes);
        try {
            const sessionFilter = {
                _id: new ObjectId(sessionId),
                userId: new ObjectId(decoded.id),
                /*  status: "terminada" */
            };

            // 1️⃣ Si sessionNote.note está vacío, reemplazar todo el array de notas con los valores de "notes"
            if (sessionNote.note === "") {
                // Reemplazar el array 'notes' con el array proporcionado
                const setResult = await this.collection.updateOne(
                    sessionFilter,
                    { $set: { notes: notes } } // Reemplaza todo el array con el nuevo array
                );

                if (setResult.modifiedCount > 0) {
                    return {
                        success: true,
                        message: "Array de notas actualizado correctamente"
                    };
                } else {
                    return {
                        success: false,
                        message: "No se pudo actualizar el array de notas"
                    };
                }
            } else {
                // 2️⃣ Si sessionNote.note tiene contenido, agregar una nueva nota
                const noteEntry = {
                    _id: new ObjectId(), // Generar un nuevo ObjectId para la nueva nota
                    note: sessionNote.note, // El contenido de la nueva nota
                    createdAt: sessionNote.createdAt // Timestamp de la creación
                };

                console.log("noteEntry:", noteEntry); // Verifica que la nueva nota se genera correctamente

                // 3️⃣ Insertar la nueva nota en el array 'notes'
                const pushResult = await this.collection.updateOne(
                    sessionFilter,
                    { $push: { notes: noteEntry } }
                );

                if (pushResult.modifiedCount > 0) {
                    return {
                        success: true,
                        message: "Nota insertada correctamente"
                    };
                }
            }

            // Si no se realizó ninguna modificación
            return {
                success: false,
                message: "No se pudo insertar ni actualizar el array de notas"
            };

        } catch (error) {
            console.error("Error en insertNotes:", error);
            throw new Error("Error al insertar la nota y actualizar el array de notas");
        }
    }


    async dPatientAppointments(decoded, p) {
        try {
            // Usar el _id del usuario decodificado para encontrar al usuario en la base de datos
            const userId = decoded.id;
            // Actualizamos la lista de métodos de pago del usuario
            const patientDeleted = await this.collection.deleteMany(
                { userId: new ObjectId(userId), patientId: new ObjectId(p.id)})

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

export default AppointmentService;
