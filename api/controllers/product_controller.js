import { ObjectId } from 'mongodb';
import ProductService from '../classes/product_service.js';
import { deleteFileFromS3, getObjectFromS3, uploadFileToS3 } from "../s3/s3.js"
import jwt from "jsonwebtoken"
import UserService from '../classes/user_service.js';
import { Payment, Preference, MercadoPagoConfig } from 'mercadopago';
import { send, stateOrderNotify } from '../nodemailer/config.js';
import CategoryService from '../classes/categories_service.js';
const productService = new ProductService();
const catService = new CategoryService();
// SDK de Mercado Pago
// Agrega credenciales

const clientMP = new MercadoPagoConfig({ accessToken: 'APP_USR-6666012562184757-121615-07b1f0e92942a7caff5c29f2adfaf100-1187609678' });

export const changeState = async (req, res) => {
    try {
        const { estadoCompra } = req.body; // Desestructuración directa
        const { id } = req.params; // Desestructuración directa
        console.log(estadoCompra, id)

        //obtener email de la tienda mediante el token de session para notificar el cambio de estado
        if (!estadoCompra || !id) {
            return res.status(400).json({ message: 'Faltan parámetros necesarios (estado_compra o id)' });
        }

        // Llamada al servicio para cambiar el estado
        const changed = await oService.changeOrderState(id, estadoCompra);

        if (changed.modifiedCount === 1) {
            // Si el documento se modificó correctamente, envía correo
            const order = await oService.getOrderSimpleId(id)
            if (order) {
                await stateOrderNotify(order) // email de tienda 
            }
            return res.status(200).json({ success: 200, message: 'Estado actualizado con éxito' });
        } else {
            // Caso cuando no se encuentra el documento o no se realiza ninguna modificación
            return res.status(404).json({ message: 'Orden no encontrada o estado no modificado' });
        }
    } catch (err) {
        console.error('Error al actualizar el estado de la orden:', err); // Mensaje más claro
        return res.status(500).json({ message: 'Error al actualizar el estado de la orden' }); // Mensaje más específico
    }
};
export const getCategoriesByUser = async (req, res) => {
    const token = req.cookies.sessionToken;

    try {
        // Verificar si el token existe
        if (!token) {
            return res.status(401).json({ error: 'No autorizado. Token no encontrado.' });
        }

        // Decodificar el token JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verificar si se proporcionan categorías en el cuerpo de la solicitu

        // Llamada al servicio para agregar categorías
        const added = await catService.getCategoriesByUser(decoded);

        // Verificar si las categorías fueron agregadas correctamente   
        if (added && added.length > 0) {

            return res.status(200).json({ success: true, data: added });
        } else {
            return res.status(500).json({ message: 'Hubo un error al agregar las categorías' });
        }
    } catch (err) {
        // Capturar cualquier error en el proceso
        console.error('Error al agregar categorías:', err);
        if (err instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: 'Token inválido' });
        }
        return res.status(500).json({ message: 'Error interno del servidor al procesar la solicitud' });
    }
};
export const addCategories = async (req, res) => {
    const token = req.cookies.sessionToken;

    try {
        // Verificar si el token existe
        if (!token) {
            return res.status(401).json({ error: 'No autorizado. Token no encontrado.' });
        }

        // Decodificar el token JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verificar si se proporcionan categorías en el cuerpo de la solicitud
        const { body: categories } = req;
        if (!categories || categories.length === 0) {
            return res.status(400).json({ message: 'No hay categorías para agregar' });
        }

        // Llamada al servicio para agregar categorías
        const added = await catService.addCategories(decoded, categories);

        // Verificar si las categorías fueron agregadas correctamente
        if (added && added.categoriesUpdated > 0) {
            console.log('Categorías agregadas:', added);
            return res.status(200).json({ success: true, data: added });
        } else {
            return res.status(500).json({ message: 'Hubo un error al agregar las categorías' });
        }
    } catch (err) {
        // Capturar cualquier error en el proceso
        console.error('Error al agregar categorías:', err);
        if (err instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: 'Token inválido' });
        }
        return res.status(500).json({ message: 'Error interno del servidor al procesar la solicitud' });
    }
};
export const moreClientsShops = async (req, res) => {
    const token = req.cookies.sessionToken;
    try {

        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const clients = await oService.moreClientsShops(decoded);
        if (clients.length > 0) {
            console.log(clients)
            res.status(200).json({ success: 200, data: clients });
        }

    }
    catch (err) {
        console.error('Error al obtener clients:', err);
        res.status(500).json({ message: 'Error al obtener las clientes' });
    }
}

export const getCategories = async (req, res) => {
    try {

        const { products, categorias, productoTipos } = await productService.getCategories();
        if (categorias.length > 0 && products.length > 0 && productoTipos.length > 0) {
            console.log(categorias, products)
            res.status(200).json({ success: 200, data: { categorias: categorias, products: products, productoTipos: productoTipos } });
        }
        else {
            console.log('No hay categorías')
            res.status(200).json({ success: 200, data: [] });
        }
    }
    catch (err) {
        console.error('Error al obtener categorías:', err);
        res.status(500).json({ message: 'Error al obtener las categorías' });
    }
}
export const createProduct = async (req, res) => {
    const token = req.cookies.sessionToken;

    try {

        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const { body: data, files: archivos } = req;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const cleanPath = (path) => (path ? path.replace(/\s+/g, "") : "default");
        const productoTipoP = cleanPath(data.productoTipo).toLowerCase();
        const categoriaC = cleanPath(data.categoria).toLowerCase();

        console.log("product y archivo" + JSON.stringify(data), JSON.stringify(archivos))
        // Validar datos básicos
        if (!data || !data.titulo || !data.productoTipo || !data.categoria || !data.productoConVariantes || !data.promocion) {
            return res.status(400).json({ message: 'Datos incompletos en el cuerpo de la solicitud.' });
        }

        const esProductoConVariantes = data.productoConVariantes === "si";
        console.log("esprodconv" + JSON.stringify(esProductoConVariantes))

        // Validar variantes si el producto tiene variantes
        const variantes = esProductoConVariantes ? data.variantes || "[]" : [];
        if (esProductoConVariantes && variantes.length === 0) {
            return res.status(400).json({ message: 'El producto tiene variantes, pero no se proporcionaron datos de variantes.' });
        }

        for (const variant of variantes) {
            if (!variant.dato_2_mul || !variant.dato_3_pre || archivos.length === 0 || !variant.dato_4_stock) {
                return res.status(400).json({ message: 'Datos incompletos en una o más variantes.' });
            }
        }

        // Procesar imágenes generales (para productos sin variantes)
        const imagenesGenerales = !esProductoConVariantes
            ? archivos.filter(file => file.fieldname.startsWith('imagesAdded'))
            : [];

        // Procesar imágenes de variantes
        if (esProductoConVariantes) {
            variantes.forEach((variant, index) => {
                const imagenCampo = `variantes[${index}][imagenes]`;
                const imagenes = archivos.filter(file => file.fieldname.startsWith(imagenCampo));
                variant.imagenes = imagenes.map(file => ({
                    originalname: file.originalname,
                    path: file.path
                }));
            });
        }
        // Preparar el objeto del producto
        function sanitizeFileName(fileName) {
            return fileName
                .toLowerCase()                // Convierte todo a minúsculas
                .replace(/ /g, '')           // Reemplaza espacios con guiones bajos
                .replace(/-/g, '')            // Elimina guiones
                .replace(/[^a-z0-9_.]/g, ''); // Elimina caracteres especiales, dejando solo letras, números, guiones bajos y puntos
        }
        const product = {
            creado: new Date(),
            titulo: data.titulo,
            descripcion: data.descripcion,
            productoTipo: productoTipoP,
            categoria: categoriaC,
            precio: Number(data.precio) || 0,
            productoConVariantes: esProductoConVariantes ? "si" : "no",
            stock: Number(data.stock) || 0,
            imagesAdded: imagenesGenerales.map(file => sanitizeFileName(file.originalname)),
            ventas: Number(0),
            promocion: data.promocion === "si" ? true : false,
            activo: true,
            garantia: data.garantia,
            estadoProducto: data.estadoProducto,
            color: data.color || "",
            variantes: esProductoConVariantes ? variantes.map(variant => ({
                _id: new ObjectId(),
                dato_1_col: variant.dato_1_col,
                dato_2_mul: variant.dato_2_mul,
                dato_3_pre: Number(variant.dato_3_pre),
                dato_4_stock: Number(variant.dato_4_stock),
                imagenes: variant.imagenes.map(img => sanitizeFileName(img.originalname)),
                color: variant.color || "",
                creado: new Date(),
                estadoProducto: variant.estadoProducto,
                activo: true,
                garantia: variant.garantia,
                ventas: Number(0),

            })) : []
        };
        console.log("product " + JSON.stringify(product))
        // Subir imágenes a S3 o almacenamiento externo (si corresponde)
        if (imagenesGenerales.length > 0) {
            await Promise.all(imagenesGenerales.map(async (file, index) => {
                try {
                    const subidaExitosa = await uploadFileToS3(decoded, file, productoTipoP, categoriaC);
                    if (!subidaExitosa) {
                        console.error(`Error al subir la imagen general ${index}`);
                    }
                } catch (error) {
                    console.error(`Error al subir la imagen general ${index}:`, error);
                }
            }));
        }

        if (esProductoConVariantes) {
            await Promise.all(variantes.map(async (variant, index) => {
                await Promise.all(variant.imagenes.map(async (imagen, imgIndex) => {
                    try {
                        const subidaExitosa = await uploadFileToS3(decoded, imagen, productoTipoP, categoriaC);
                        if (!subidaExitosa) {
                            console.error(`Error al subir la imagen de la variante ${index}, imagen ${imgIndex}`);
                        }
                    } catch (error) {
                        console.error(`Error al subir la imagen de la variante ${index}, imagen ${imgIndex}:`, error);
                    }
                }));
            }));
        }


        // Guardar el producto en la base de datos
        const createdProduct = await productService.createProduct(decoded, product);
        if (!createdProduct) {
            return res.status(500).json({ message: 'Error al guardar el producto en la base de datos.' });
        }

        // Responder con éxito
        res.status(200).json({
            message: 'Producto creado exitosamente',
            producto: createdProduct
        });
    } catch (error) {
        console.error('Error al crear el producto:', error);
        res.status(500).json({ message: 'Error interno al crear el producto.' });
    }
};



/* export const createProduct = async (req, res) => {
    try {
        const { body: data, files: archivos } = req;
        const variantes = data.variantes || '[]';

        if (!data || !variantes.length) {
            return res.status(400).json({ message: 'Datos incompletos o archivos no enviados' });
        }

        // Asignar imágenes subidas a las variantes
        variantes.forEach((variant, index) => {
            const imagenCampo = `variantes[${index}][imagen]`;
            const archivo = archivos.find(file => file.fieldname === imagenCampo);
            if (archivo) {
                variant.imagen = archivo.originalname
                variant.path = archivo.path
            }
        });

        const product = {
            titulo: data.titulo,
            descripcion: data.descripcion,
            productoTipo: data.productoTipo,
            categoria: data.categoria,
            variantes: data.variantes.map(variant => ({
                color: variant.color,
                imagen: variant.imagen,
                peso: variant.peso
            }))
        };
        await Promise.all(
            variantes.map(async (variant, index) => {
                const { imagen } = variant;

                if (!imagen) {
                    console.log(`No hay imagen para la variante ${index}`);
                    return;
                }

                try {
                    // Subir la imagen a S3 primero
                    const subidaExitosa = await uploadFileToS3(variant);
                    if (!subidaExitosa) {
                        console.error(`Error al subir la imagen de la variante ${index}.`);
                        return;
                    }

                    console.log(`Imagen de la variante ${index} subida exitosamente.`);

                    // Actualizar la base de datos con la imagen subida
                    const updatedProduct = await productService.createProduct(product);
                    if (!updatedProduct) {
                        console.warn(`Producto no actualizado para la variante ${index}`);
                        return;
                    }

                    console.log(`Producto actualizado correctamente para la variante ${index}.`);
                } catch (error) {
                    console.error(`Error procesando la imagen de la variante ${index}:`, error);
                }
            })
        );

        // Responder después de que todas las operaciones hayan finalizado
        res.status(200).json({
            message: 'Producto cargado exitosamente',
            status: 200,
        });


        // Responder con éxito
    } catch (error) {
        console.error('Error al crear el producto:', error);
        res.status(500).json({ message: 'Error al crear el producto' });
    }
}; */
export const createSimpleOrder = async (req, res) => {
    try {
        const { payload } = req.body;
        console.log(payload);
        // Validación inicial de los datos enviados
        /*   if (
              !payload ||
              !payload.items || payload.items.length === 0 ||
              !payload.totalAmount || isNaN(payload.totalAmount) ||
              !payload.subtotal || isNaN(payload.subtotal) ||
              payload.discountAmount === undefined || isNaN(payload.discountAmount) ||
              !payload.fullName || payload.fullName === "" ||
              !payload.deliveryOption || payload.deliveryOption === "" ||
              !payload.address || payload.address === "" ||
              !payload.city || payload.city === "" ||
              !payload.postalCode || payload.postalCode === "" ||
              !payload.phone || payload.phone === "" ||
              !payload.email || !/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(payload.email) // Validación básica de email
          ) {
              return res.status(400).json({
                  message: 'Datos incompletos o inválidos: asegúrate de llenar todos los campos requeridos correctamente.',
                  errors: {
                      items: payload.items && payload.items.length > 0 ? null : "Se requieren items en el carrito.",
                      totalAmount: !isNaN(payload.totalAmount) ? null : "totalAmount debe ser un número válido.",
                      subtotal: !isNaN(payload.subtotal) ? null : "subtotal debe ser un número válido.",
                      discountAmount: !isNaN(payload.discountAmount) ? null : "discountAmount debe ser un número válido.",
                      fullName: payload.fullName && payload.fullName ? null : "fullName es obligatorio.",
                      deliveryOption: payload.deliveryOption && payload.deliveryOption ? null : "deliveryOption es obligatorio.",
                      address: payload.address && payload.address ? null : "address es obligatorio.",
                      city: payload.city && payload.city ? null : "city es obligatorio.",
                      postalCode: payload.postalCode && payload.postalCode ? null : "postalCode es obligatorio.",
                      phone: payload.phone && payload.phone ? null : "phone es obligatorio.",
                      email: /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(payload.email) ? null : "email debe ser válido."
                  }
              });
          } 
  */
        // Construcción de la orden
        const order = {
            fullName: payload.fullName,
            deliveryOption: payload.deliveryOption,
            address: payload.address,
            apartment: payload.apartment,
            street_number: payload.street_number,
            city: payload.city,
            postalCode: payload.postalCode,
            phone: payload.phone,
            paymentMethod: payload.paymentMethod,
            email: payload.email,
            notes: payload.notes,
            paisesOptions: payload.paymentMethod,
            items: payload.items,
            cupon_code: payload.cupon_code,
            totalAmount: payload.totalAmount,
            subtotal: payload.subtotal,
            discountAmount: payload.discountAmount,
            createdAt: new Date(), // Marca de tiempo para la orden
        };
        console.log(order)
        if (payload.paymentMethod === "mp") {

            const payment = new Preference(clientMP);

            const URL = "https://ecommerce-gabriela.vercel.app";
            const URL_back = "http://localhost:3000";
            /*   const URL = "https://ecommerce-gabriela.vercel.app"; */
            payment.create({
                body: {
                    items: payload.items.map(item => ({
                        id: item.id,
                        title: item.titulo || "Producto sin título", // Ajusta según la estructura de tu carrito
                        quantity: item.cantidad || 1,
                        unit_price: Number(item.precio) || 0, // Ajusta para el precio
                        category_id: item.categoria,
                    })),
                    auto_return: "approved",
                    back_urls: {
                        success: `${URL_back}`,
                        failure: `${URL_back}`,
                    },
                    notification_url: `${URL}`,
                    statement_descriptor: "Veterinaria La Comercial",
                    payment_methods: {
                        installments: 12
                    },
                    shipments: {
                        receiver_address: {
                            street_number: order.street_number,
                            street_name: order.address,
                            zip_code: order.postalCode,
                            country_name: "Uruguay",
                            apartment: order.apartment,
                        },
                        cost: 0,
                        mode: order.deliveryOption
                    },

                    additional_info: order.notes,
                    coupon_code: order.cupon_code,
                    payer: {

                        name: order.fullName,
                        email: order.email,
                        phone: {
                            number: order.phone
                        },
                        date_created: new Date(),

                    },
                }
            })
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



        }
        else {

            const orderGeneral = {
                items: payload.items.map(item => ({
                    id: item.id,
                    title: item.titulo || "Producto sin título", // Ajusta según la estructura de tu carrito
                    quantity: item.cantidad || 1,
                    unit_price: Number(item.precio) || 0, // Ajusta para el precio
                    category_id: item.categoria,
                })),


                payment_method: order.paymentMethod,
                shipments: {
                    receiver_address: {
                        street_number: order.street_number,
                        street_name: order.address,
                        zip_code: order.postalCode,
                        country_name: "Uruguay",
                        apartment: order.apartment,
                    },
                    cost: 0,
                    mode: order.deliveryOption
                },

                additional_info: order.notes,
                coupon_code: order.cupon_code,
                payer: {

                    name: order.fullName,
                    email: order.email,
                    phone: {
                        number: order.phone
                    },
                    date_created: new Date(),

                },
                state_order: "recibida"
            }
            const createdOrder = await oService.createOrdenGeneral(orderGeneral);
            const res = await sumSells(orderGeneral)
            if (!createdOrder || !res) {
                console.error('Error al crear la orden en la base de datos');
                return res.status(500).json({
                    message: 'No se pudo crear la orden. Inténtalo de nuevo más tarde.',
                });
            }

        }


    } catch (error) {
        // Manejo de errores generales
        console.error('Error inesperado al crear la orden:', error);
        return res.status(500).json({
            message: 'Error interno del servidor al crear la orden.'
        });
    }
};
export const sumSells = async (order) => {
    try {
        const result = productService.sumProducts(order)

        if (!result) {
            return console.error('Error al sumar');

        }
        return result
    }

    catch (error) {
        // Manejo de errores generales
        console.error('Error inesperado alsumar  la orden:', error);
        return res.status(500).json({
            message: 'Error interno del servidor al sumar la orden.'
        });
    }

    // Devolver el resultado de la inserción del pago
}
export const registerPayment = async (req, res) => {
    const paymentData = req.body;

    console.log("Datos del pago recibidos:", paymentData);

    // Validar y guardar los datos en la base de datos

    if (paymentData.status === "approved") {
        const paymentDone = new Preference(clientMP)
        const preferenceItems = paymentDone.get({ preferenceId: paymentData.preference_id })
        const order = {
            items: (await preferenceItems).items,
            buyer: (await preferenceItems).payer,
            delivery: (await preferenceItems).shipments,
            additional_info: (await preferenceItems).additional_info,
            cupon_code: (await preferenceItems).coupon_code,
            state_order: "Recibida"
        }
        console.log(JSON.stringify(order))
        const createdOrder = await oService.createOrdenOne(order);
        const res = await sumSells(order)
        if (!createdOrder || !res) {
            console.error('Error al crear la orden en la base de datos');
            return res.status(500).json({
                message: 'No se pudo crear la orden. Inténtalo de nuevo más tarde.',
            });
        }
        // Aquí iría tu lógica para registrar la compra
        // Por ejemplo: guardar en la base de datos
        console.log("Pago aprobado, registrando en la base de datos...");
        res.status(200).json({ message: "Pago registrado exitosamente" });
    } else {
        console.log("Pago no aprobado, ignorando...");
        res.status(400).json({ message: "Pago no válido" });
    }
}

// Obtener todos los productos
export const getAllProducts = async (req, res) => {
    const token = req.cookies;
    try {


        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        // Decodificar el token
        console.log(token.sessionToken)
        const decoded = jwt.verify(token.sessionToken, process.env.JWT_SECRET);
        const products = await productService.getAllProducts(decoded);
        console.log(products)
        res.status(200).json({ data: products });
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};


// Obtener un producto por ID
/* export const getProductById = async (req, res) => {
    try {
        const { id, idProduct } = req.params;

        // Validación mejorada de los parámetros
        if (!id || !idProduct) {
            return res.status(400).json({ message: 'Both id and idProduct are required' });
        }

        const product = await productService.getProductById(idProduct);
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        if (product.length > 0) {
            return res.status(200).json({ data: product });
        } else {
            return res.status(404).json({ message: 'No products found for the given ID' });
        }

    } catch (error) {
        console.error('Error al obtener el producto:', error);
        res.status(500).json({ message: 'Error al obtener el producto' });
    }
}; */
export const gProductForEdit = async (req, res) => {
    const token = req.cookies.sessionToken;
    try {
        const { id } = req.params;
        console.log(id, token);
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        // Validación mejorada de los parámetros
        if (!id) {
            return res.status(400).json({ message: 'Both id and idProduct are required' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const product = await productService.gProductById(decoded, id);
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        if (product) {
            console.log(product)
            return res.status(200).json({ data: product });
        } else {
            return res.status(404).json({ message: 'No products found for the given ID' });
        }

    } catch (error) {
        console.error('Error al obtener el producto:', error);
        res.status(500).json({ message: 'Error al obtener el producto' });
    }
};






export const getOnlyProductById = async (req, res) => {
    const token = req.cookies.sessionToken;
    try {
        // Capturar el ID del producto desde los parámetros de la URL
        const { productTitle } = req.params;
        console.log(productTitle);
       /*  if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        } */

        // Capturar subCategory desde el cuerpo de la solicitud
        /*    const { subcategory } = req.body.parametros || {}; */ // Manejo de casos donde no se envíen parámetros



        // Validaciones
        if (!productTitle) {
            return res.status(400).json({ message: 'El ID del producto es requerido.' });
        }
       /*  const decoded = jwt.verify(token, process.env.JWT_SECRET); */
        // Obtener el producto y los relacionados
        const result = await productService.getOnlyProductByTitle(/* decoded, */ productTitle);

        console.log("Producto y relacionados:", result);

        if (!result) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }

        // Responder con éxito
        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error al obtener el producto:', error);
        return res.status(500).json({ message: 'Error al obtener el producto.' });
    }
};



export const deleteimages = async (req, res) => {
    try {
        const { body: data, files: archivos } = req;
        const imagenes = data.imagenes || '[]'
        const cleanPath = (path) => (path ? path.replace(/\s+/g, "") : "default");
        const productoTipoP = cleanPath(data.productoTipo).toLowerCase();
        const categoriaC = cleanPath(data.categoria).toLowerCase();
        // Verifica si los parámetros son vlidos
        if (!productoTipoP || !categoriaC) {
            console.error("Parámetros faltantes o inválidos");
            return null; // Salta este producto
        }



        if (data.productoConVariantes === "no") {

            //ELIMINAR IMAGEN
            const imagenes = data.imagenes.map(file => ({
                nombre: file,
            }));
            console.log(imagenes)
            try {
                await Promise.all(
                    imagenes.map(async (imagen, index) => {
                        const imagenExiste = await getObjectFromS3(imagen.nombre, productoTipoP, categoriaC);
                        if (imagenExiste) {
                            console.log(`La imagen ${imagen.nombre}  existe en S3.`);
                            return;
                        }

                        console.log(`Eliminado imagen ${imagen} de S3...`);
                        const eliminarExitoso = await deleteFileFromS3(imagen.nombre, productoTipoP, categoriaC);

                        if (eliminarExitoso) {
                            console.log(`Imagen ${imagen.nombre} eliminada exitosamente.`);
                        }
                    })
                );

                data.imagenes = imagenes.map(img => img);
            } catch (error) {
                console.error('Error procesando imágenes del producto único:', error);
            }


            for (const imagen of data.imagenes) {
                const updatedProduct = await productService.deleteImageOfProduct(data.id, imagen.nombre);

                if (!updatedProduct) {
                    return res.status(404).json({ message: 'Imagen no eliminada' });
                }
            }
        }

        res.status(200).json({ message: 'Imagenes eliminadas exitosamente', status: 200 });
    } catch (error) {
        console.error('Error al eliminar:', error);
        res.status(500).json({ message: 'Error al actualizar' });
    }
}





// Actualizar un producto
export const updateProduct = async (req, res) => {
    try {
        const { body: data, files: archivos } = req;
        const variantes = data.variantes || '[]'

        const productoConVariantes = data.productoConVariantes === 'si';
        const cleanPath = (path) => (path ? path.replace(/\s+/g, "") : "default");
        const productoTipoP = cleanPath(data.productoTipo).toLowerCase();
        const categoriaC = cleanPath(data.categoria).toLowerCase();
        // Verifica si los parámetros son vlidos
        if (!productoTipoP || !categoriaC) {
            console.error("Parámetros faltantes o inválidos");
            return null; // Salta este producto
        }


        if (!data && !archivos.length) {
            return res.status(400).json({ message: 'Datos incompletos o archivos no enviados' });
        }
        if (productoConVariantes) {
            // Procesar variantes
            await Promise.all(
                variantes.map(async (variant, index) => {
                    const imagenCampo = `variantes[${index}][imagen]`;
                    const archivo = archivos.find(file => file.fieldname === imagenCampo);

                    if (archivo) {
                        variant.imagen = archivo.originalname;
                        variant.path = archivo.path;
                    }

                    if (!variant.imagen) {
                        console.log(`No hay imagen para la variante ${index}`);
                        return;
                    }

                    try {
                        const imagenExiste = await getObjectFromS3(variant.imagen, productoTipoP);
                        if (imagenExiste) {
                            console.log(`La imagen de la variante ${index} ya existe en S3.`);
                            return;
                        }

                        console.log(`Subiendo imagen de la variante ${index} a S3...`);
                        const subidaExitosa = await uploadFileToS3(variant, productoTipoP, categoriaC);

                        if (subidaExitosa) {
                            console.log(`Imagen de la variante ${index} subida exitosamente.`);
                        }
                    } catch (error) {
                        console.error(`Error procesando la imagen de la variante ${index}:`, error);
                    }
                })
            );
        } else {
            // Procesar producto único
            if (archivos.length > 0) {

                const imagenes = archivos.map(file => ({
                    originalname: file.originalname,
                    path: file.path
                }));

                try {
                    await Promise.all(
                        imagenes.map(async (imagen, index) => {
                            const imagenExiste = await getObjectFromS3(imagen.originalname, productoTipoP, categoriaC);
                            if (imagenExiste) {
                                console.log(`La imagen ${imagen.originalname} ya existe en S3.`);
                                return;
                            }

                            console.log(`Subiendo imagen ${imagen.originalname} a S3...`);
                            const subidaExitosa = await uploadFileToS3(imagen, productoTipoP, categoriaC);

                            if (subidaExitosa) {
                                console.log(`Imagen ${imagen.originalname} subida exitosamente.`);
                            }
                        })
                    );

                    data.imagenes = imagenes.map(img => img.originalname);
                } catch (error) {
                    console.error('Error procesando imágenes del producto único:', error);
                }
            }
            else {
                //ELIMINAR IMAGEN
                const imagenes = data.imagenes.map(file => ({
                    nombre: file,
                }));
                console.log(imagenes)
                try {
                    await Promise.all(
                        imagenes.map(async (imagen, index) => {
                            const imagenExiste = await getObjectFromS3(imagen.nombre, productoTipoP, categoriaC);
                            if (imagenExiste) {
                                console.log(`La imagen ${imagen.nombre}  existe en S3.`);
                                return;
                            }

                            console.log(`Eliminado imagen ${imagen} de S3...`);
                            const eliminarExitoso = await deleteFileFromS3(imagen.nombre, productoTipoP, categoriaC);

                            if (eliminarExitoso) {
                                console.log(`Imagen ${imagen.nombre} eliminada exitosamente.`);
                            }
                        })
                    );

                    data.imagenes = imagenes.map(img => img);
                } catch (error) {
                    console.error('Error procesando imágenes del producto único:', error);
                }
            }
        }

        // Actualizar la base de datos
        const updatedProduct = await productService.saveImages(data);
        if (!updatedProduct) {
            return res.status(404).json({ message: 'Producto no actualizado' });
        }

        res.status(200).json({ message: 'Producto actualizado exitosamente', status: 200 });
    } catch (error) {
        console.error('Error al actualizar el producto:', error);
        res.status(500).json({ message: 'Error al actualizar el producto' });
    }
};


/* export const updateProduct = async (req, res) => {
    try {
        const { editedRows } = req.body;  // Obtener el ID del producto desde la URL
        console.log(editedRows);

          const updatedProduct = await productService.editProduct(product._id, updateData);
          if (!updatedProduct) {
              return res.status(404).json({ message: 'Producto no actualizado' });
          } 
        res.status(200).json({
            message: 'Producto actualizado exitosamente',
            status: 200,

        });
    } catch (error) {
        console.error('Error al actualizar el producto:', error);
        res.status(500).json({ message: 'Error al actualizar el producto' });
    }
}; */

// Eliminar una imagen
export const deleteImage = async (req, res) => {
    try {
        const token = req.cookies?.sessionToken;

        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        // Decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { selectedFile } = req.body
        if (selectedFile && decoded) {
            /*    const user = await userService.getUserById(decoded.email) */
            /* const idProduct = await productService.getImageProduct(decoded.id, selectedFile.image) */
            const deleteImageOnProduct = await productService.deleteImageOfProduct(selectedFile.productId, selectedFile.image)
            if (deleteImageOnProduct) {
                await deleteFileFromS3(selectedFile.image, decoded.id, selectedFile.productId)
                res.status(200).json({ message: 'Imagen eliminada' });
            }
        }
    } catch (error) {
        console.error('Error al eliminar la imagen:', error);
        res.status(500).json({ message: 'Error al eliminar la imagen' });
    }
};
export const uploadImageToProduct = async (req, res) => {
    try {
        const token = req.cookies?.sessionToken;

        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        // Decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const image = req.files
        const { product_id } = req.body
        console.log(image, product_id);
        if (image && decoded) {
            const uploadImageOnProduct = await productService.uploadImageOfProduct(product_id, image[0].originalname)
            if (uploadImageOnProduct) {
                await req.files.map(file => uploadFileToS3(file, decoded.id, product_id))
                res.status(200).json({ message: 'Imagen subida' });
            }
        }
    } catch (error) {
        console.error('Error al eliminar la imagen:', error);
        res.status(500).json({ message: 'Error al subir la imagen' });
    }
};
export const getAllImagesOfProducts = async (req, res) => {
    try {
        const token = req.cookies?.sessionToken;

        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        // Decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (decoded) {
            const images = await productService.getAllImages(decoded.id)

            if (images) {
                res.status(200).json({ data: images });
            }
        }
    } catch (error) {
        console.error('Error al eliminar la imagen:', error);
        res.status(500).json({ message: 'Error al eliminar la imagen' });
    }
};
export const getSuppliers = async (req, res) => {
    try {

        const products = await productService.getSuppliers()

        if (products.length > 0) {
            res.status(200).json({ data: products });
        }

    } catch (error) {
        console.error('Error al obtener categorias:', error);
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};
export const getDestacados = async (req, res) => {
    try {

        const products = await productService.getDestacados()
        console.log(products)
        if (products.length > 0) {
            res.status(200).json({ data: products });
        }

    } catch (error) {
        console.error('Error al obtener categorias:', error);
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};
export const getProductsByCategory = async (req, res) => {
    const token = req.cookies?.sessionToken;

    try {
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        // Decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const { category } = req.body

        const products = await productService.getProductsByCategory(decoded, category)

        if (products.length > 0) {
            console.log(products)
            res.status(200).json({ data: products });
        }

    } catch (error) {
        console.error('Error al obtener categorias:', error);
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};
export const obtenerDatosDeCategoriaElegida = async (req, res) => {
    try {
        const { productType, category } = req.body
        console.log(productType, category)
        const products = await productService.obtenerDatosDeCategoriaElegida(productType, category)

        if (products.length > 0) {
            console.log(products)
            res.status(200).json({ data: products });
        }

    } catch (error) {
        console.error('Error al obtener categorias:', error);
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};
export const getProductsByProductType = async (req, res) => {
    try {


        const products = await productService.getProductsByProdType()
        console.log(products)
        if (products.length > 0) {
            res.status(200).json({ data: products });
        }

    } catch (error) {
        console.error('Error al obtener categorias:', error);
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};
export const registersearch = async (req, res) => {
    try {
        const { query } = req.body
        console.log(query);
        const products = await productService.rsearch(query)
        console.log("Coincidencias: " + products)
        if (products.length > 0) {
            res.status(200).json({ data: products });
        }

    } catch (error) {
        console.error('Error al obtener categorias:', error);
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};
export const deleteProd = async (req, res) => {
    try {
        const { id } = req.params

        const products = await productService.deleteProdu(id)
        if (products.acknowledged) {
            res.status(200).json({ success: 200, message: 'Producto eliminado exitosamente' });
        }

    } catch (error) {
        console.error('Error al obtener categorias:', error);
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};
export const getOrder = async (req, res) => {
    const token = req.cookies;
    try {

        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        // Decodificar el token

        const decoded = jwt.verify(token.sessionToken, process.env.JWT_SECRET);
        const orders = await oService.getOrderSimple(decoded)
        if (orders.length > 0) {
            console.log(orders)
            res.status(200).json({ success: 200, data: orders });
        }

    } catch (error) {
        console.error('Error al obtener categorias:', error);
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};
export const getOrderbyid = async (req, res) => {
    const token = req.cookies;
    const { id } = req.params
    try {
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const decoded = jwt.verify(token.sessionToken, process.env.JWT_SECRET);
        const orders = await oService.getOrderSimpleId(decoded, id)
        if (orders.length > 0) {
            console.log(orders)
            res.status(200).json({ success: 200, data: orders });
        }

    } catch (error) {
        console.error('Error al obtener categorias:', error);
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};




















export const deleteProduct = async (req, res) => {
    const token = req?.cookies;
    try {
        const { id } = req.params
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const decoded = jwt.verify(token.sessionToken, process.env.JWT_SECRET);

        const deleted = await productService.dProduct(decoded, id)
        if (deleted.deletedCount === 1) {
            console.log(deleted)
            res.status(200).json({ success: 200, data: deleted });
        }

    } catch (error) {
        console.error('Error al obtener categorias:', error);
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};


export const deleteImagep = async (req, res) => {
    const token = req.cookies;
    try {
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const { body: data, files: archivos } = req;
        const decoded = jwt.verify(token.sessionToken, process.env.JWT_SECRET);
        console.log("variantes data " + JSON.stringify(data.variantes))
        console.log("variantes archivos " + JSON.stringify(archivos))
        const cleanPath = (path) => (path ? path.replace(/\s+/g, "") : "default");
        const productoTipoP = cleanPath(data.productoTipo).toLowerCase();
        const categoriaC = cleanPath(data.categoria).toLowerCase();

        if (!productoTipoP || !categoriaC) {
            console.error("Parámetros faltantes o inválidos");
            return res.status(400).json({ error: "Faltan parámetros obligatorios" });
        }

        if (data.productoConVariantes === "no") {
            await manejarProductoSimple(decoded, data, archivos, productoTipoP, categoriaC);
        } else {
            await manejarProductoConVariantes(decoded, data, archivos, productoTipoP, categoriaC);
        }

        res.json({ message: "Producto actualizado exitosamente" });
    } catch (error) {
        console.error("Error actualizando el producto:", error);
        res.status(500).json({ error: "Error al actualizar el producto" });
    }
};


const manejarProductoSimple = async (decoded, data, archivos, productoTipoP, categoriaC) => {
    try {
        // Verificar si el campo `imagesAdded` ya existe, y asegurarse de que sea un array
        let imagesAdded = data.imagesAdded || [];

        // Si no hay archivos (imágenes) en el payload, solo actualizamos los datos textuales del producto
        if (archivos.length === 0) {
            await productService.upproduct(decoded, { ...data });
            console.log("Producto actualizado solo con datos textuales.");
            return { message: "Producto actualizado con datos textuales." };
        }

        // Procesar las imágenes subidas
        const nuevasImagenes = await Promise.all(
            archivos.map(async (archivo) => {
                // Crear objeto de imagen para procesar
                const imagen = {
                    originalname: archivo.originalname, // Nombre del archivo original
                    path: archivo.path, // Ruta del archivo temporal
                };

                // Subir la imagen a S3
                console.log(`Subiendo imagen ${imagen.originalname} a S3...`);
                const subidaExitosa = await uploadFileToS3(decoded, imagen, productoTipoP, categoriaC);
                if (!subidaExitosa) {
                    throw new Error(`Error al subir la imagen ${imagen.originalname}`);
                }

                return imagen.originalname; // Devolver solo el nombre de la imagen subida
            })
        );

        // Agregar las nuevas imágenes al campo `imagesAdded`
        imagesAdded = [...imagesAdded, ...nuevasImagenes];

        // Actualizar el producto en la base de datos con las nuevas imágenes
        const resultado = await productService.upproduct(decoded, {
            ...data,
            imagesAdded, // Actualizar el campo `imagesAdded`
        });

        console.log("Producto actualizado con nuevas imágenes.", resultado.modifiedCount);
        return { message: "Producto actualizado exitosamente." };
    } catch (error) {
        console.error("Error procesando imágenes del producto:", error);
        throw new Error("Error al procesar las imágenes del producto.");
    }
};






const manejarProductoConVariantes = async (decoded, data, archivos, productoTipoP, categoriaC) => {
    try {
        // Extraer las variantes del producto desde el payload
        let variantes = data.variantes || [];


        // Si no hay archivos (imágenes) en el payload, solo actualizamos los datos textuales del producto
        if (archivos.length === 0) {
            await productService.upproduct(decoded, {
                ...data,  // Mantener los datos originales del producto
                variantes,  // Mantener las variantes sin cambios
            });
            console.log("Producto actualizado solo con datos textuales.");
            return { message: "Producto actualizado con datos textuales." };
        }

        console.log("varintes" + JSON.stringify(data.variantes))

        // Procesar las imágenes de las variantes
        const variantesActualizadas = await Promise.all(
            variantes.map(async (variant, index) => {
                // Encontramos los archivos correspondientes a la variante actual
                const imagenCampo = `variantes[${index}][imagenes]`;
                const archivosDeLaVariante = archivos.filter(file => file.fieldname.startsWith(imagenCampo));


                if (archivosDeLaVariante.length > 0) {
                    // Si encontramos imágenes para la variante, procesamos los archivos
                    const imagenes = archivosDeLaVariante.map(archivo => {
                        // Aquí obtenemos tanto la imagen como el nombre
                        return {
                            originalname: archivo.originalname,  // Nombre de la imagen
                            path: archivo.path,
                        };
                    });
                    // Asignamos las imágenes procesadas a la variante
                    variant.imagenesExistentes = variant.imagenes?.map(v => v)         // Ruta local del archivo
                    variant.imagenes = imagenes.map(v => v.originalname);
                    console.log("variant  " + JSON.stringify(variant))
                    console.log(`Subiendo imagenes de la variante ${index} a S3...`);

                    // Subimos las imágenes a S3
                    for (const imagen of imagenes) {
                        const subidaExitosa = await uploadFileToS3(decoded, imagen, productoTipoP, categoriaC);
                        if (!subidaExitosa) {
                            throw new Error(`Error subiendo imagen para la variante ${index}`);
                        }
                    }
                } else {
                    console.warn(`No se encontraron imágenes para la variante ${index}`);
                    // Si no se encuentran imágenes, la variante no se actualiza en ese aspecto
                }

                return variant;  // Devolvemos la variante actualizada (con o sin imagenes)
            })
        );

        // Filtramos las variantes para eliminar aquellas que no tienen imagen

        variantes = variantesActualizadas.filter(variant => variant.imagenes && variant.imagenes.length > 0);
        // Si no hay variantes válidas con imagen, lanzamos un error
        if (variantes.length === 0) {
            throw new Error("No hay variantes válidas con imagen.");
        }

        // Actualizamos el producto con las variantes y los datos textuales
        await productService.upproduct(decoded, {
            ...data,  // Mantener los datos originales del producto
            variantes,  // Variantes actualizadas (con imágenes procesadas)
        });

        console.log("Producto con variantes actualizado exitosamente.");
        return { message: "Producto actualizado exitosamente." };
    } catch (error) {
        console.error("Error procesando imágenes de variantes:", error);
        throw new Error("Error al procesar las imágenes de variantes.");
    }
};
