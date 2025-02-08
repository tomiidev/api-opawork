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
function generarHTML(detalleCompra) {
    const itemsHTML = detalleCompra.items
        .map(
            (item) => `
            <div class="item">
                <img src="${item.picture_url}" alt="${item.descripcion}">
                <div class="item-details">
                    <h4>${(item.title || item.titulo)}</h4>
                    <p>Cantidad: ${(item.quantity || item.cantidad)} | Precio: $${(item.unit_price || item.precio)}</p>
                    <p>${item.category_id}</p>
                </div>
            </div>
        `
        )
        .join("");

    const subtotal = detalleCompra.items.reduce(
        (total, item) => total + (item.quantity || item.cantidad) * (item.unit_price || item.precio),
        0
    );
    const envio = subtotal * detalleCompra.shipments?.cost; // 15% de impuestos
    const total = subtotal + envio;
    console.log(envio, total, subtotal)
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Detalle de compra</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f7f7f7; color: #333; }
                .email-container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); }
                .header { background-color: #4caf50; color: #ffffff; text-align: center; padding: 20px; }
                .header h1 { margin: 0; font-size: 24px; }
                .items { padding: 20px; }
                .item { display: flex; align-items: center; border-bottom: 1px solid #eaeaea; padding: 10px 0; }
                .item:last-child { border-bottom: none; }
                .item img { width: 50px; height: 50px; border-radius: 50%; margin-right: 15px; }
                .item-details { flex: 1; }
                .item-details h4 { margin: 0; font-size: 16px; }
                .item-details p { margin: 5px 0; color: #555; font-size: 14px; }
                .summary { background-color: #f9f9f9; padding: 20px; }
                .summary h3 { margin-top: 0; font-size: 20px; }
                .summary-item { display: flex; justify-content: space-between; margin: 5px 0; font-size: 16px; }
                .footer { text-align: center; padding: 15px; font-size: 14px; color: #777; background-color: #f1f1f1; }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header"><h1>Compraste</h1></div>
                <div class="items">${itemsHTML}</div>
                <div class="summary">
                    <h3>Resumen</h3>
                    <div class="summary-item"><span>Pagaste con: </span><span>${detalleCompra.payment_method}</span></div>
                    <hr/>
                    <div class="summary-item"><span>Subtotal:</span><span>$${subtotal}</span></div>
                    <div class="summary-item"><span>Envío:</span><span>$${envio || 0}</span></div>
                    <div class="summary-item"><strong>Total:</strong><strong>$${total}</strong></div>
                </div>
                <div class="footer">Gracias por su compra. ¡Esperamos que la disfrutes!</div>
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
export async function send(orden) {
    console.log(orden)
    try {
        // Crear transportador de nodemailer
        const transporter = await createTransporter();

        // Datos del detalle de compra (puedes generar dinámicamente)
        const detalleCompra = orden[0]

        // Generar HTML para el correo
        const html = generarHTML(detalleCompra);

        // Opciones de correo
        const mailOptions = {
            from: process.env.MAIL_USERNAME,
            to: "tomasruglio18@gmail.com",
            subject: "Detalle de Compra",
            html,
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
