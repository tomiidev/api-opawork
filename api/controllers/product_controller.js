import { ObjectId } from 'mongodb';
import ProductService from '../classes/product_service.js';
import { deleteFileFromS3, getObjectFromS3, uploadFileToS3 } from "../s3/s3.js"
import jwt from "jsonwebtoken"
import UserService from '../classes/user_service.js';
import OrderService from '../classes/order_service.js';
import { Payment, Preference, MercadoPagoConfig } from 'mercadopago';
const productService = new ProductService();
const oService = new OrderService();
// SDK de Mercado Pago
// Agrega credenciales

const clientMP = new MercadoPagoConfig({ accessToken: 'APP_USR-6666012562184757-121615-07b1f0e92942a7caff5c29f2adfaf100-1187609678' });


export const createProduct = async (req, res) => {
    try {
        const { body: data, files: archivos } = req;
        // Validar datos básicos

        if (!data || !data.titulo || !data.productoTipo || !data.categoria || !data.stock || !data.productoConVariantes) {
            return res.status(400).json({ message: 'Datos incompletos en el cuerpo de la solicitud.' });
        }
        // Parsear las variantes e imágenes del body
        const variantes = data.variantes || '[]'; // Variantes como JSON
        const imagenesGenerales = archivos.filter(file => file.fieldname.startsWith('imagenes')); // Imágenes generales


        // Validar si el producto es único o tiene variantes
        const esProductoConVariantes = data.productoConVariantes === "no" ? false : true;
        /*  const esProductoConVariantes = variantes.length > 0; */


        if (esProductoConVariantes === true) {
            // Validar que todas las variantes tengan datos completos
            for (let variant of variantes) {
                if (variant.dato_1_col === "" || variant.dato_2_mul === "" || variant.dato_3_pre === "" || variant.imagen === "") {
                    return res.status(400).json({ message: 'Datos incompletos en una o más variantes.' });
                }
            }


            // Asignar imágenes subidas a las variantes
            variantes.forEach((variant, index) => {
                const imagenCampo = `variantes[${index}][imagen]`;
                const archivo = archivos.find(file => file.fieldname === imagenCampo);
                if (archivo) {
                    variant.imagen = archivo.originalname;
                    variant.path = archivo.path;
                }
            });

        } /* else {
            // Validar que existan imágenes generales si no hay variantes
            if (imagenesGenerales.length === 0) {
                return res.status(400).json({ message: 'Se requieren imágenes para un producto sin variantes.' });
                }
                } */

        // Preparar el objeto del producto
        const product = {
            creado: new Date(),
            titulo: data.titulo,
            descripcion: data.descripcion,
            productoTipo: data.productoTipo,
            categoria: data.categoria,
            precio: Number(data.precio === 0) ? data.variantes[0].dato_3_pre : Number(data.precio),
            productoConVariantes: data.productoConVariantes,
            stock: Number(data.stock),
            imagesAdded: esProductoConVariantes ? [] : imagenesGenerales.map(file => ({
                nombre: file.originalname,
                /*   imagen: file.path */
            })),
            estado: true,
            ventas: 0,
            color: data.color ? data.color : "",
            variantes: esProductoConVariantes ? variantes.map(variant => ({
                _id: new ObjectId(),
                dato_1_col: variant.dato_1_col,
                dato_2_mul: variant.dato_2_mul,
                dato_3_pre: Number(variant.dato_3_pre),
                imagen: variant.imagen.toLowerCase(),
                color: variant.color,
                /* imagen: variant.imagen,
                 peso: variant.peso */
            })) : []
        };



        // Subir imágenes de variantes (si las hay)
        if (esProductoConVariantes) {
            await Promise.all(
                variantes.map(async (variant, index) => {

                    if (variant.imagen && variant.path) {
                        try {
                            const subidaExitosa = await uploadFileToS3(variant, data.productoTipo, data.categoria);
                            if (!subidaExitosa) {
                                console.error(`Error al subir la imagen de la variante ${index}`);
                            } else {
                                console.log(`Imagen de la variante ${index} subida exitosamente.`);
                            }
                        } catch (error) {
                            console.error(`Error al subir la imagen de la variante ${index}:`, error);
                        }
                    }
                })
            );
        }

        // Subir imágenes generales (si no hay variantes)
        if (!esProductoConVariantes) {
            console.log(imagenesGenerales)
            await Promise.all(
                imagenesGenerales.map(async (file, index) => {
                    try {
                        const subidaExitosa = await uploadFileToS3(file, data.productoTipo, data.categoria);
                        if (!subidaExitosa) {
                            console.error(`Error al subir la imagen general ${index}`);
                        } else {
                            console.log(`Imagen general ${index} subida exitosamente.`);
                        }
                    } catch (error) {
                        console.error(`Error al subir la imagen general ${index}:`, error);
                    }
                })
            );
        }

        // Crear producto en la base de datos
        const createdProduct = await productService.createProduct(product);
        if (!createdProduct) {
            return res.status(500).json({ message: 'Error al guardar el producto en la base de datos.' });
        }

        // Responder con éxito
        res.status(200).json({
            message: 'Producto creado exitosamente',
            /*    producto: createdProduct */
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
export const getProductById = async (req, res) => {
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
};
export const gProductForEdit = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(id)
        // Validación mejorada de los parámetros
        if (!id) {
            return res.status(400).json({ message: 'Both id and idProduct are required' });
        }

        const product = await productService.gProductById(id);
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        if (product.length > 0) {
            return res.status(200).json({ data: product[0] });
        } else {
            return res.status(404).json({ message: 'No products found for the given ID' });
        }

    } catch (error) {
        console.error('Error al obtener el producto:', error);
        res.status(500).json({ message: 'Error al obtener el producto' });
    }
};






export const getOnlyProductById = async (req, res) => {
    try {
        // Capturar el ID del producto desde los parámetros de la URL
        const { id } = req.params;

        // Capturar subCategory desde el cuerpo de la solicitud
        const { subcategory } = req.body.parametros || {}; // Manejo de casos donde no se envíen parámetros

        console.log("ID del producto:", id);
        console.log("Subcategoría:", subcategory);

        // Validaciones
        if (!id) {
            return res.status(400).json({ message: 'El ID del producto es requerido.' });
        }
        if (!subcategory) {
            return res.status(400).json({ message: 'La subcategoría es requerida.' });
        }

        // Obtener el producto y los relacionados
        const result = await productService.getOnlyProductById(id, subcategory);

        console.log("Producto y relacionados:", result);

        if (!result.product) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }

        // Responder con éxito
        return res.status(200).json({
            success: true,
            data: {
                product: result.product,
                relatedProducts: result.relatedProducts,
            },
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
    try {
        const { category } = req.body

        const products = await productService.getProductsByCategory(category)

        if (products.length > 0) {
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
    try {

        const orders = await oService.getOrderSimple()
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
    try {
        const { id } = req.params
        const orders = await oService.getOrderSimpleId(id)
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
    try {
        const { id } = req.params

        const deleted = await productService.dProduct(id)
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
    try {
        const { body: data, files: archivos } = req;
        console.log(data.imagesDeleted)
        console.log(data.descripcion)
        const cleanPath = (path) => (path ? path.replace(/\s+/g, "") : "default");
        const productoTipoP = cleanPath(data.productoTipo).toLowerCase();
        const categoriaC = cleanPath(data.categoria).toLowerCase();

        if (!productoTipoP || !categoriaC) {
            console.error("Parámetros faltantes o inválidos");
            return res.status(400).json({ error: "Faltan parámetros obligatorios" });
        }

        if (data.productoConVariantes === "no") {
            await manejarProductoSimple(data, archivos, productoTipoP, categoriaC);
        } else {
            await manejarProductoConVariantes(data, archivos, productoTipoP, categoriaC);
        }

        res.json({ message: "Producto actualizado exitosamente" });
    } catch (error) {
        console.error("Error actualizando el producto:", error);
        res.status(500).json({ error: "Error al actualizar el producto" });
    }
};


const manejarProductoSimple = async (data, archivos, productoTipoP, categoriaC) => {
    if (archivos.length === 0 && !data.imagesDeleted) {
        // Si no hay archivos, actualizamos el producto sin modificar las imágenes
        await productService.upproduct(data);
        console.log("No hay imágenes para subir. Producto actualizado.");
        return;
    }

    // Procesamos los archivos recibidos y los preparamos para S3
    const imagenes = archivos.map(file => ({
        originalname: file.originalname,
        path: file.path,
    }));

    try {
        const resultados = await Promise.all(
            imagenes.map(async (imagen) => {
                console.log(`Subiendo imagen ${imagen.originalname} a S3...`);
                const subidaExitosa = await uploadFileToS3(imagen, productoTipoP, categoriaC);
                if (!subidaExitosa) {
                    throw new Error(`Error subiendo imagen ${imagen.originalname}`);
                }
                return { nombre: imagen.originalname }; // Aquí agregamos el nombre de la imagen
            })
        );

        // Actualizamos el campo `imagesAdded` con los resultados de las nuevas imágenes
        if (resultados.length > 0) {
            data.imagesAdded = data.imagesAdded ? [...data.imagesAdded, ...resultados] : resultados;
        }

        // Eliminar imágenes si se especificaron
        if (data.imagesDeleted && data.imagesDeleted.length > 0) {


            await productService.upproduct(data);
        }

        const e = await productService.upproduct(data);
        console.log("Producto simple actualizado con nuevas imágenes.", e.modifiedCount);
    } catch (error) {
        console.error("Error procesando imágenes del producto simple:", error);
        throw error;
    }
};


const manejarProductoConVariantes = async (data, archivos, productoTipoP, categoriaC) => {
    // Copiar datos del producto para evitar sobrescribir información importante
    let variantes = data.variantes || [];

    // Verificar si se proporcionaron archivos para variantes (imágenes)
    if (archivos.length === 0 && !data.imagesDeleted) {
        // Si no hay archivos, actualizamos solo los datos textuales y dejamos las variantes sin cambios
        await productService.upproduct({
            ...data,  // Mantener los datos originales del producto
            variantes, // Mantener las variantes actuales sin cambios
            imagenes: [], // No cambiar las imágenes generales del producto
        });
        console.log("Producto actualizado solo con datos textuales.");
        return;
    }

    try {
        // Procesamos las imágenes de las variantes y eliminamos las variantes sin imagen
        const variantesActualizadas = await Promise.all(
            variantes.map(async (variant, index) => {
                const imagenCampo = `variantes[${index}][imagen]`;
                const archivo = archivos.find(file => file.fieldname === imagenCampo);

                if (archivo) {
                    // Si se encuentra una imagen, la asignamos a la variante
                    variant.imagen = archivo.originalname;
                    variant.path = archivo.path;

                    console.log(`Subiendo imagen de la variante ${index} (${variant.imagen}) a S3...`);
                    const subidaExitosa = await uploadFileToS3(variant, productoTipoP, categoriaC);
                    if (!subidaExitosa) {
                        throw new Error(`Error subiendo imagen para la variante ${index}`);
                    }
                } else {
                    console.warn(`No se encontró imagen para la variante ${index}`);
                    // Si no hay imagen para esta variante, eliminamos la variante
                    return null;  // Devolver null para variantes sin imagen
                }

                return variant;  // Devolver la variante con imagen
            })
        );

        // Filtramos las variantes para eliminar las que no tienen imagen
        variantes = variantesActualizadas.filter(variant => variant !== null);

        // Si no hay variantes después del filtrado, devolvemos un error o mensaje adecuado
        if (variantes.length === 0) {
            throw new Error("No hay variantes válidas con imagen.");
        }

        // Actualizamos el campo `imagesAdded` con las nuevas imágenes
        const nuevasImagenes = variantes.map(variant => ({
            nombre: variant.imagen,
        }));

        data.imagesAdded = (data.imagesAdded || []).concat(nuevasImagenes);  // Concatenamos nuevas imágenes sin sobrescribir
        console.log(data.imagesAdded); //
        // Ahora actualizamos el producto manteniendo los datos textuales y otras propiedades
        await productService.upproduct({
            ...data,  // Mantener los datos originales del producto
            variantes,  // Mantener las variantes actualizadas
            // Agregar otros campos adicionales si se necesitan
        });

        console.log("Producto con variantes y datos textuales actualizado exitosamente.");
    } catch (error) {
        console.error("Error procesando imágenes de variantes:", error);
        throw error;
    }
};
