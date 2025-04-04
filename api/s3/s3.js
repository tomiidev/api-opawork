import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const AWS_PUBLIC_KEY = process.env.AWS_PUBLIC_KEY;
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const AWS_BUCKET_REGION = process.env.AWS_BUCKET_REGION;

console.log('Región:', AWS_BUCKET_REGION);  // Añadir esto para depuración

const client = new S3Client({
    region: process.env.AWS_BUCKET_REGION,
    credentials: {
        accessKeyId: process.env.AWS_PUBLIC_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
    }
});
//v   pt      c                    

export const uploadFileToS3 = async (decoded, files) => {
    console.log("Archivos recibidos:", JSON.stringify(files));

    function sanitizeFileName(fileName) {
        return fileName
            .toLowerCase()
            .replace(/ /g, '')  // Elimina espacios
            .replace(/-/g, '')  // Elimina guiones
            .replace(/[^a-z0-9_.]/g, ''); // Solo permite letras, números, _ y .
    }

    try {
        if (!Array.isArray(files) || files.length === 0) {
            throw new Error("No se han recibido archivos para subir.");
        }

        // Subir cada archivo y esperar a que todos se completen
        const uploadResults = await Promise.all(
            files.map(async (file) => {
                const stream = fs.createReadStream(file.path);
                const key = `${decoded.id}/${sanitizeFileName(file.originalname)}`;

                const uploadParams = {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: key,
                    Body: stream,
                    ACL: "public-read",
                };

                const command = new PutObjectCommand(uploadParams);
                const result = await client.send(command);
                console.log(`Archivo subido: ${file.originalname}`, result);

                return {
                    originalName: file.originalname,
                    s3Key: key,
                    location: `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${decoded.id}${key}`,
                };
            })
        );

        return uploadResults;
    } catch (error) {
        console.error("Error al subir archivos:", error);
        throw error;
    }
};
export const getObjectFromS3 = async (product, categoria, file) => {
    console.log(`Archivo: ${file}`);
    try {
        // Validar parámetros de entrada
        if (!file) {
            console.error('Parámetros insuficientes: se requiere un nombre de archivo.');
            return null;
        }

        // Generar la clave S3 para la imagen
        const s3Key = `${product}/${categoria}/${file}`;
        console.log(`Buscando imagen en S3 con clave: ${s3Key}`);

        // Configurar los parámetros de obtención
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
        };

        // Ejecutar el comando GetObjectCommand
        const command = new GetObjectCommand(params);
        const result = await client.send(command);

        console.log('Imagen obtenida desde S3:', result);

        // Devolver el resultado para que el consumidor decida cómo usarlo
        return result;
    } catch (error) {
        // Manejar errores específicos
        if (error.name === 'NoSuchKey' || error.Code === 'NoSuchKey') {
            console.log('La imagen no existe en S3.');
            return null; // Devolver null si la imagen no está en S3
        }

        // Loguear errores inesperados y continuar el flujo
        console.error('Error inesperado al obtener la imagen desde S3:', error);
        return null; // Devolver null para evitar romper el flujo principal
    }
};



/* export const uploadFileToS3 = async (file,user, product) => {
    try {
        console.log(file);
        const stream = fs.createReadStream(file.path);
        const uploadParams = {
            Bucket: AWS_BUCKET_NAME,
            Key: `${user}/${product}/${file.originalname}`,
            Body: stream,
            ACL: 'public-read',
        };
        const command = new PutObjectCommand(uploadParams);
        const result = await client.send(command);
        console.log('Archivo subido:', result);
        return result;
    } catch (error) {
        console.error('Error al subir archivo:', error);
        throw error;
    }
}; */
export const uploadFileServiceToS3 = async (decoded, picture) => {
    try {
        console.log(picture);
        const stream = fs.createReadStream(picture[0].path);
        const uploadParams = {
            Bucket: AWS_BUCKET_NAME,
            Key: `${decoded.id}/foto/${picture[0].originalname}`,
            Body: stream,
            ACL: 'public-read',
        };
        const command = new PutObjectCommand(uploadParams);
        const result = await client.send(command);
        console.log('Archivo subido:', result);
        return result;
    } catch (error) {
        console.error('Error al subir archivo:', error);
        throw error;
    }
};
export const deleteFileFromS3 = async (nombre, product, categoria) => {
    console.log(nombre, product, categoria)
    try {

        const uploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `${product}/${categoria}/${nombre}`,
        };
        const command = new DeleteObjectCommand(uploadParams);
        const result = await client.send(command);
        console.log('Archivo eliminado:', result);
        return result;
    } catch (error) {
        console.error('Error al subir archivo:', error);
        throw error;
    }
};
/* export const deleteFileFromS3 = async (file, user, product) => {
    try {

        const uploadParams = {
            Bucket: AWS_BUCKET_NAME,
            Key: `${user}/${product}/${file}`,
        };
        const command = new DeleteObjectCommand(uploadParams);
        const result = await client.send(command);
        console.log('Archivo eliminado:', result);
        return result;
    } catch (error) {
        console.error('Error al subir archivo:', error);
        throw error;
    }
};
 */