import { clientDB } from "../../lib/database.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

class AuthService {
    constructor() {
        this.collection = clientDB.db("contygo").collection('session'); // Nombre de la colección de usuarios
        /*  this.collection = clientDB.db("keplan").collection('user'); // Nombre de la colección de usuarios */
    }

    // Registro de nuevo usuario
    async insertNotes(decoded, sessionNotes) {
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
    }



}

export default AuthService;
