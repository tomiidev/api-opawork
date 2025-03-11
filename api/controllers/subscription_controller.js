import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb";
import axios from "axios";
import PaymentService from "../classes/subscription_service.js";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { sendBillToBuyer } from "../nodemailer/config.js";
const pService = new PaymentService();
const clientMP = new MercadoPagoConfig({ accessToken: 'APP_USR-4871368307536482-030422-e18f66d0577928a3700b2f2f66b1e064-1246340668' });
import PDFDocument from "pdfkit"

export const generateLink = async (req, res) => {
    const token = req.cookies?.sessionToken;

    try {
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { formData } = req.body

        const payment = new Preference(clientMP);

        const URL = "https://www.contygoo.com";
        const URL_back = "http://localhost:5173";
        /*   const URL = "https://ecommerce-gabriela.vercel.app"; */
        console.log("form" + JSON.stringify(formData))
        const preference =
        {
            items: [
                {
                    title: "Psicología",
                    quantity: Number(formData.sessions), // Asegurar número
                    unit_price: Number(formData.price), // Asegurar número

                }
            ],
            additional_info: new ObjectId(decoded.id), //
            auto_return: "approved",
            back_urls: {
                success: `${URL}`,
                failure: `${URL}`,
            },
            notification_url: `${URL}`,
            statement_descriptor: formData.descriptor,
            payment_methods: {
                installments: 12
            },

            /*  additional_info: order.notes,
             coupon_code: order.cupon_code, */
            payer: {

                name: formData.patientName,
                email: formData.email,
                /*   phone: {
                      number: order.phone
                  }, */
                date_created: formData.date,

            },
        }
        payment.create({ body: preference })
            .then(async (response) => {
                try {
                    // Extraer el sandbox_init_point
                    const sandbox_init_point = response.sandbox_init_point;
                    console.log('Sandbox Init Point:', response);



                    // Responder con el sandbox_init_point o realizar otra acción
                    return res.status(200).json({
                        message: 'Orden creada con éxito.',
                        sandbox_init_point: sandbox_init_point,
                    });
                } catch (error) {
                    console.error('Error al procesar la creación de la orden:', error);
                    return res.status(500).json({
                        message: 'Hubo un problema al crear la orden.',
                    });
                }
            })
            .catch((error) => {
                console.error('Error al crear el pago:', error);
                return res.status(500).json({
                    message: 'Hubo un problema al procesar el pago.',
                });
            });





    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
};





export const registerPayment = async (req, res) => {
    const paymentData = req.body;
    console.log("Datos del pago recibidos:", paymentData);

    if (paymentData.status === "approved") {
        const paymentDone = new Preference(clientMP)
        const preferenceItems = paymentDone.get({ preferenceId: paymentData.preference_id })
        const order = {
            items: (await preferenceItems).items,
            buyer: (await preferenceItems).payer,
            date: (await preferenceItems).date_created,
            /*     notes: (await preferenceItems).notes, */
            /*       additional_info: (await preferenceItems).additional_info,
                  cupon_code: (await preferenceItems).coupon_code, */

        }
        console.log(JSON.stringify(order))
        const createdOrder = await pService.createPayment(order);
       /*  const res = await sumSells(order) */
        //    await send(order)
        await generateBillPdf(order)
        if (!createdOrder /* || !res */) {
            console.error('Error al crear la orden en la base de datos');
            return res.status(500).json({
                message: 'No se pudo crear la orden. Inténtalo de nuevo más tarde.',
            });
        }
        // Aquí iría tu lógica para registrar la compra
        // Por ejemplo: guardar en la base de datos
        console.log("Pago aprobado, registrando en la base de datos...");

    } else {
        console.log("Pago no aprobado, ignorando...");
        res.status(400).json({ message: "Pago no válido" });
    }
}

export const generateBillPdf = async (data) => {
    try {
        console.log("data de pdf")
        const doc = new PDFDocument();
        let buffers = [];

        // Capturar el PDF en memoria
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", async () => {
            const pdfBuffer = Buffer.concat(buffers);
            await sendBillToBuyer(pdfBuffer, data); // Ahora pasamos un buffer
        });

        // Generar contenido del PDF
        doc.fontSize(20).text("Factura", { align: "center" });
        doc.moveDown();

        // Datos de la empresa
        doc.fontSize(12).text(data.statement_descriptor);
        doc.text("Dirección: Calle Falsa 123");
        doc.text("Teléfono: +123456789");
        doc.text("Correo: contacto@empresa.com");
        doc.moveDown();

        // Datos del cliente
        doc.text("Nombre: " + data.buyer.name); 
        doc.moveDown();

        // Encabezado de la tabla
        doc.text("Cantidad  | Precio  | Total");
        doc.text("---------------------------");

        // Tabla de productos/servicios
        let totalFactura = 0;
        data.items.forEach(item => {
            const total = item.quantity * item.unit_price;
            totalFactura += total; // Acumulamos el total de la factura

            doc.text(
                `${item.quantity.toString().padEnd(9)} | ` +
                `$${item.unit_price.toFixed(2).padEnd(7)} | ` +
                `$${total.toFixed(2)}`
            );
        });
        doc.moveDown();

        // Total de la factura
        doc.fontSize(14).text(`Total a pagar: $${totalFactura.toFixed(2)}`, { align: "right" });

        // Finalizar documento
        doc.end();
    } catch (err) {
        console.log(err);
    }
};
export const getPayments = async (req, res) => {
    const token = req.cookies?.sessionToken;

    try {
        // Verificamos si el token está presente
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        // Decodificamos el token para obtener el _id del usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET);




        // Llamamos al servicio para actualizar los métodos de pago
        const result = await pService.getPayments(decoded);

        if (result.length < 0) {
            return res.status(400).json({ data: [], message: "No hay pagos registrados" });
        }
        if (result.length > 0) {
            console.log(result);
            return res.status(200).json({ data: result, message: "Pagos obtenidos" });
        }


    } catch (error) {
        console.error('Error al agregar los métodos de pago:', error);
        res.status(500).json({ message: 'Error al agregar los métodos de pago' });
    }
}
















export const captureSubscription = async (req, res) => {
    try {
        const { subscription_id, token, planId } = req.body; // Extrae subscription_id, token, planId del body
        const sessionToken = req.cookies["sessionToken"]; // Accede directamente a la cookie "sessionToken"
        const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET); // Verifica el token
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid session token' });
        }
        // Valida que todos los parámetros estén presentes
        if (!subscription_id || !token || !sessionToken || !planId) {
            return res.status(400).json({ error: 'Subscription ID, token, sessionToken, and planId are required' });
        }

        const newSubscription = {
            subscription_id: subscription_id,
            user_id: new ObjectId(decoded.id), // Usa el ID del usuario decodificado
            type_plan: planId,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Inserta la suscripción en la base de datos
        console.log(newSubscription)
        const savesSubscription = await subscriptionService.createSubscription(newSubscription);
        // Verifica si la suscripción se guardó correctamente
        if (!savesSubscription.acknowledged) {
            return res.status(500).json({ error: 'Failed to save subscription' });
        }

        return res.status(200).json({
            success: true,
            subscriptionId: savesSubscription.insertedId, // Devuelve el ID de la suscripción guardada
        });
    } catch (error) {
        console.error('Error capturing subscription or updating user:', error.message);
        return res.status(500).json({
            error: 'Internal server error while capturing subscription or updating user',
            details: error.message
        });
    }
};
export const createSubscription = async (req, res) => {
    const { planId, price } = req.body; // Datos del plan

    const sessionToken = req.cookies["sessionToken"]; // Accede directamente a la cookie "sessionToken"
    const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET); // Verifica el token
    if (!decoded) {
        return res.status(401).json({ error: 'Invalid session token' });
    }
    if (!planId || !price) {
        return res.status(400).json({ error: 'Plan name and price are required' });
    }
    const paypal = new PayPalClient();

    try {

        // Paso 1: Crear el producto
        const product = await paypal.createProduct(planId, `Descripción para el plan ${planId}`);

        // Paso 2: Crear el plan de suscripción asociado al producto
        const plan = await paypal.createPlan(product.id, planId, price);

        // Paso 3: Crear la suscripción utilizando el ID del plan recién creado
        const subscription = await paypal.createSubscription(plan.id);
        console.log(subscription)
        if (!decoded || !planId) {
            return res.status(400).json({ error: 'Subscription ID, token, sessionToken, and planId are required' });
        }

        const newSubscription = {
            subscription_id: subscription.id,
            user_id: new ObjectId(decoded.id), // Usa el ID del usuario decodificado
            type_plan: planId,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const savesSubscription = await subscriptionService.createSubscription(newSubscription);
        // Verifica si la suscripción se guardó correctamente
        if (!savesSubscription.acknowledged) {
            return res.status(500).json({ error: 'Failed to save subscription' });
        }
        const approvalLink = subscription.links.find(link => link.rel === 'approve').href;

        return res.status(200).json({
            success: true,
            approval_url: approvalLink
        });

    } catch (error) {
        console.error('Error creating subscription:', error.message);
        res.status(500).json({
            error: 'Internal server error while creating PayPal subscription',
            details: error.message
        });
    }
};
export const cancelSubscription = async (req, res) => {
    try {
        // 1. Verificar el token de sesión
        const sessionToken = req.cookies["sessionToken"];
        const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid session token' });
        }

        // 2. Obtener la suscripción del usuario
        const sus = await subscriptionService.getSuscription(decoded.id);
        console.log(sus)
        if (!sus || !sus.subscription_id) {
            return res.status(404).json({ error: 'No se encontró la suscripción' });
        }

        // 3. Obtener el token de acceso de PayPal
        const accessToken = await getPayPalAccessToken();
        if (!accessToken) {
            return res.status(500).json({ error: 'No se pudo obtener el token de acceso de PayPal' });
        }

        // 4. Cancelar la suscripción en PayPal
        const cancelResponse = await cancelPayPalSubscription(sus.subscription_id, accessToken);
        //eliminar de mongo 
        // 5. Manejar la respuesta de la cancelación
        if (cancelResponse.status === 204) {
            return res.status(200).json({ message: 'La suscripción fue cancelada exitosamente' });
        } else {
            return res.status(400).json({ error: 'Error al cancelar la suscripción' });
        }

    } catch (error) {
        console.error('Error al cancelar la suscripción:', error);
        return res.status(500).json({ error: 'Ocurrió un error al cancelar la suscripción' });
    }
};

// Función para obtener el token de acceso de PayPal
const getPayPalAccessToken = async () => {
    try {
        const paypalClient = new PayPalClient();
        const accessToken = await paypalClient.getAccessToken();
        return accessToken;
    } catch (error) {
        console.error('Error obteniendo el token de acceso de PayPal:', error);
        return null;
    }
};

// Función para cancelar la suscripción de PayPal
const cancelPayPalSubscription = async (subscriptionId, accessToken) => {
    try {
        const response = await axios.post(
            `https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${subscriptionId}/cancel`,
            {
                "reason": "Cancelación automática por el usuario"
            }, // No es necesario enviar datos en el cuerpo para la cancelación
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response;
    } catch (error) {
        console.error(`Error al cancelar la suscripción ${subscriptionId}:`, error.response ? error.response.data : error);
        throw error;
    }
};


