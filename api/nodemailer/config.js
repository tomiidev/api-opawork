import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

// Crear cliente OAuth2 con el refresh token para obtener automáticamente un nuevo access token
const oAuth2Client = new google.auth.OAuth2(
    process.env.OAUTH_CLIENTID,
    process.env.OAUTH_CLIENT_SECRET,
    process.env.OAUTH_REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: process.env.OAUTH_REFRESH_TOKEN });

// Función para obtener el access token automáticamente usando el refresh token
async function getAccessToken() {
    try {
        const accessToken = await oAuth2Client.getAccessToken();
        console.log("Nuevo access token generado:", accessToken.token);
        return accessToken.token;
    } catch (error) {
        console.error("Error al obtener el token de acceso", error);
        throw error;
    }
}

// Crear el transportador de nodemailer
async function createTransporter() {
    const accessToken = await getAccessToken();

    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: process.env.MAIL_USERNAME,
            clientId: process.env.OAUTH_CLIENTID,
            clientSecret: process.env.OAUTH_CLIENT_SECRET,
            refreshToken: process.env.OAUTH_REFRESH_TOKEN,
            accessToken: accessToken,
        },
    });
}

// Función para generar el template HTML dinámico
function generarHTML(link) {

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Hola</title>
          
        </head>
        <body>
            <div class="email-container">
               ${link}
            </div>
        </body>
        </html>
    `;
}
function generarHTMLOrden(order) {
    const { state_order: estado } = order; // Extraer el estado de la orden

    // Definir los pasos y su nombre correspondiente
    const pasos = ["recibida", "preparando", "enviando"];

    // Crear las clases de cada paso según el estado
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Estado de la Orden</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f7f7f7;
                    color: #333;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                }
                .email-container {
                    max-width: 600px;
                    margin: 20px auto;
                    background-color: #ffffff;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                }
                .header {
                    background-color: #4caf50;
                    color: #ffffff;
                    text-align: center;
                    padding: 20px;
                }
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                    color: #ffffff;
                }
                .estado-progreso {
                    list-style-type: none;
                    padding: 20px;
                    display: flex;
                    justify-content: center;  /* Centra los pasos */
                    align-items: center;
                    margin: 0;
                }
                .estado-progreso li {
                    text-align: center;
                    position: relative;
                    flex: 1;
                    margin: 0 20px; /* Separación entre columnas */
                }
                .estado-progreso li .icono {
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    margin: 0 auto 10px;
                    line-height: 30px;
                    text-align: center;
                    background-color: #e0e0e0;
                    color: white;
                    font-weight: bold;
                }
                .estado-progreso li.completado .icono {
                    background-color: #4caf50;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <h1>Estado de tu compra</h1>
                </div>
                <ol class="estado-progreso">
                    ${pasos.map((paso, index) => `
                        <li class="${estado === paso || pasos.indexOf(estado) > index ? 'completado' : ''}">
                            <div class="icono">${index + 1}</div>
                            <span>${paso.charAt(0).toUpperCase() + paso.slice(1)}</span>
                        </li>
                    `).join('')}
                </ol>
            </div>
        </body>
        </html>
    `;
}


// Función para enviar el correo electrónico
/* export async function sendEmail(decoded,send, resource) {
    console.log(send, resource);
    try {
        // Crear transportador de nodemailer
        const transporter = await createTransporter();

        // Generar el enlace con un nombre atractivo
        const link = `https://contygo.s3.us-east-2.amazonaws.com/${decoded.id}/${resource.path}`;
        const displayText = "Haz clic aquí para ver el contenido"; // Texto atractivo

        // Generar HTML con el enlace enmascarado
        const html = `
            <p>Hola ${send.name},</p>
            <p>${send.message}</p>
            <p><a href="${link}" target="_blank" style="color: #007bff; text-decoration: none;">${displayText}</a></p>
            <p>¡Espero que te sea útil!</p>
        `;

        // Opciones de correo
        const mailOptions = {
            from: process.env.MAIL_USERNAME,
            to: send.email,
            subject: send.subject,
            html
        };

        // Enviar correo
        const info = await transporter.sendMail(mailOptions);
        console.log("Correo enviado:", info.messageId);
    } catch (error) {
        console.error("Error al enviar el correo:", error);
        throw new Error("Error al enviar el correo");
    }
} */
export async function sendEmail(user, advise) {
    try {
        // Crear transportador de nodemailer
        const transporter = await createTransporter();

        const html = `
                <p>Hola ${user.name},</p>
                <p>Has aplicado correctamente a ${advise.title}</p>
                <p>¡Te vamos a avisar cuando haya novedades!</p>
            `;

        // Opciones de correo
        const mailOptions = {
            from: process.env.MAIL_USERNAME,
            to: user.email,
            subject: "Postulación exitosa",
            html
        };

        // Enviar correo
        const info = await transporter.sendMail(mailOptions);
        console.log("Correo enviado:", info.messageId);
    } catch (error) {
        console.error("Error al enviar el correo:", error);
        throw new Error("Error al enviar el correo");
    }
}
export async function sendEmailSelected(user, advise) {
    try {
        console.log(user, advise)
        // Crear transportador de nodemailer
        const transporter = await createTransporter();

        const html = `
                <p>Hola ${user.name},</p>
                <p>Respecto a tu postulación a ${advise.title}</p>
                <p>¡Te seleccionaron, mucha suerte con tu nuevo proyecto!</p>
                <p>Equipo Opawork.</p>
            `;

        // Opciones de correo
        const mailOptions = {
            from: process.env.MAIL_USERNAME,
            to: user.email,
            subject: "Te han seleccionado",
            html
        };

        // Enviar correo
        const info = await transporter.sendMail(mailOptions);
        console.log("Correo enviado:", info.messageId);
    } catch (error) {
        console.error("Error al enviar el correo:", error);
        throw new Error("Error al enviar el correo");
    }
}
export async function sendEmailWithCredentialToPatient(patient, tempPassword) {

    try {
        // Crear transportador de nodemailer

        const transporter = await createTransporter();
        // Generar HTML con el enlace enmascarado
        const html = `Hola ${patient.name},\n\nTu usuario es: ${patient.email}\nTu contraseña temporal es: "${tempPassword}"\n\n (excluyendo las comillas). Por favor, inicia sesión y cambia tu contraseña.`

        // Opciones de correo
        const mailOptions = {
            from: process.env.MAIL_USERNAME,
            to: patient.email,
            subject: "Credenciales de uso",
            html
        };

        // Enviar correo
        const info = await transporter.sendMail(mailOptions);
        console.log("Correo enviado:", info.messageId);
    } catch (error) {
        console.error("Error al enviar el correo:", error);
        throw new Error("Error al enviar el correo");
    }
}

export async function stateOrderNotify(orden) {
    console.log(orden)
    try {
        // Crear transportador de nodemailer
        const transporter = await createTransporter();

        // Datos del detalle de compra (puedes generar dinámicamente)
        const detalleCompra = orden[0]

        // Generar HTML para el correo
        const html = generarHTMLOrden(detalleCompra);

        // Opciones de correo
        const mailOptions = {
            from: process.env.MAIL_USERNAME,
            to: "tomasruglio18@gmail.com", //  detalleCompra.comprador.email
            subject: "Estado de la compra",
            html: html
        };

        // Enviar correo
        const info = await transporter.sendMail(mailOptions);
        console.log("Correo enviado:", info.messageId);
    } catch (error) {
        console.error("Error al enviar el correo:", error);
        throw new Error("Error al enviar el correo");
    }
}
export async function sendBillToBuyer(pdfBuffer, data) {
    try {
        const transporter = await createTransporter();

        const mailOptions = {
            from: process.env.MAIL_USERNAME,
            to: data.buyer.email,
            subject: "Factura de compra",
            text: "Adjuntamos su factura en formato PDF.",
            attachments: [
                {
                    filename: "factura.pdf",
                    content: pdfBuffer,
                    contentType: "application/pdf",
                },
            ],
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Correo enviado:", info.messageId);
    } catch (error) {
        console.error("Error al enviar el correo:", error);
        throw new Error("Error al enviar el correo");
    }
}
