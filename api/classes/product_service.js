import { ObjectId } from "mongodb";
import { clientDB } from "../../lib/database.js";

// services/ProductService.js
class ProductService {
    constructor() {
        this.collection = clientDB.db("tienda").collection('product'); // Nombre de la colección de usuarios
    }
    async getCategories() {
        /*   const categorias = await this.collection.distinct("categoria", { activo: true }); */
        const products = await this.collection.find({ activo: true }, { projection: { titulo: 1, _id: 1, categoria: 1, productoTipo: 1 } })
            .toArray();
        const categorias = [...new Set(products.map(product => product.categoria))];
        const productoTipos = [...new Set(products.map(product => product.productoTipo))];

        return { products, categorias, productoTipos };

    }

    async sumProducts(order) {
        for (let item of order.items) {
            const productoId = item.id; // El ID del producto que se compró
            const cantidadVendida = item.quantity; // La cantidad que se compró

            // Incrementamos el contador de ventas del producto
            const resultadoPago = await this.collection.updateOne(
                { _id: new ObjectId(productoId) }, // Filtro para encontrar el producto
                { $inc: { ventas: cantidadVendida } } // Incrementamos el número de ventas
            );
            return resultadoPago;
        }

        // Devolver el resultado de la inserción del pago

    }
    /*  async getAllProducts() {
         return this.collection.find().toArray();
     } */
    async getAllProducts(decoded) {
        console.log(decoded);
        return this.collection.find(
            {
                user_id: new ObjectId(decoded.id), // Filtra por user_id
            }


        ).toArray();
    }
    async getImageProduct(userId, image) {
        return this.collection.aggregate([
            {
                $match: {
                    user_id: new ObjectId(userId), // Filtra por user_id
                    imagenes: image // Filtra los productos que contienen la imagen
                }
            },
            {
                $project: {
                    _id: 1 // Devuelve solo el ID del producto
                }
            }
        ]).toArray();
    }

    /*   async getOnlyProductById(productId, category, subCategory) {
          return this.collection.find({ _id: new ObjectId(productId) }).toArray();
      } */
    async getOnlyProductByTitle(productTitle) {
        const product = await this.collection.findOne({ titulo: productTitle });

        return product;
    }

    async gProductById(decoded, id) {
        return await this.collection.findOne({ user_id: new ObjectId(decoded.id), _id: new ObjectId(id) });
    }




/*     async getProductById(productId) {
        return this.collection.aggregate([
            {
                $match: {
                    _id: new ObjectId(productId) // Filtramos por el product ID
                }
            },
            {
                $lookup: {
                    from: "user", // Nombre de la colección de aplicaciones
                    localField: "user_id", // Campo en la colección de trabajos que coincide con el ObjectId
                    foreignField: "_id", // Campo en la colección de aplicaciones que coincide con el ObjectId del trabajo
                    as: "user_details" // Nombre del array resultante
                }
            },
            {
                $unwind: "$user_details" // Desplazamos los datos del array de aplicaciones
            },
            {
                $lookup: {
                    from: "review", // Nombre de la colección de aplicaciones
                    localField: "_id", // Campo en la colección de trabajos que coincide con el ObjectId
                    foreignField: "product_id", // Campo en la colección de aplicaciones que coincide con el ObjectId del trabajo
                    as: "product_details" // Nombre del array resultante
                }
            }
        ]).toArray();
    } */


    async createProduct(decoded, product) {
        if (!ObjectId.isValid(decoded.id)) {
            throw new Error("Invalid user ID format");
        }
        const newProduct = {
            ...product, // Todos los detalles del producto proporcionados
            user_id: new ObjectId(decoded.id), // Asociar el producto con el usuario
            createdAt: new Date(), // Opcional: Fecha de creación
        };
        return this.collection.insertOne(newProduct)
    }
    async getProductByIdForUpdate(id) {
        return this.collection.collection("product").findOne({ _id: new ObjectId(id) });
    }
    async deleteProdu(id) {
        return this.collection.deleteOne({ _id: new ObjectId(id) });
    }



    async getProductsByCategory(decoded, category) {

        return this.collection.find(
            { user_id: new ObjectId(decoded.id), categoria: category }
        ).toArray();
    }

    async obtenerDatosDeCategoriaElegida(p, c) {

        return this.collection.aggregate([
            {
                $match: { categoria: c, productoTipo: p }
            }
        ]).toArray();
    }
    async rsearch(q) {
        return this.collection.aggregate([
            {
                $match: {
                    titulo: {
                        $regex: q,
                        $options: "i", // Insensible a mayúsculas/minúsculas
                    },
                },
            },
            {
                $project: {
                    titulo: 1, // Incluir el campo título
                    productoTipo: 1, // Incluir el campo productoTipo
                    categoria: 1, // Incluir el campo categoria
                    variantes: 1,
                    precio: 1,
                    imagenes: 1
                },
            },
        ]).toArray();
    }

    async getProductsByProdType() {
        try {
            const results = await this.collection.aggregate([
                {
                    $group: {
                        _id: "$productoTipo", // Agrupar por productoTipo
                        categorias: { $addToSet: "$categoria" } // Consolidar categorías únicas en un array
                    }
                },
                {
                    $project: {
                        _id: 0, // Excluir el _id del resultado
                        productoTipo: "$_id", // Renombrar _id a productoTipo
                        categorias: 1 // Incluir las categorías
                    }
                }
            ]).toArray();
            console.log(results)
            return results;
        } catch (error) {
            console.error("Error fetching products and categories:", error);
            throw new Error("Could not fetch products and categories");
        }
    }

    async getSuppliers() {
        try {
            // Accede directamente a la colección de productos desde `this.collection`
            const suppliers = await this.collection.distinct("categoria");

            return suppliers;
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            throw new Error('Could not fetch suppliers');
        }
    }
    async getDestacados() {
        try {
            // Encuentra los productos y ordénalos por el atributo "ventas" en orden descendente
            const destacados = await this.collection
                .find().sort({ ventas: -1 }) // Ordenar por "ventas" en orden descendente
                .limit(10) // Opcional: limitar la cantidad de productos destacados
                .toArray()
            return destacados;
        } catch (error) {
            console.error('Error fetching destacados:', error);
            throw new Error('Could not fetch destacados');
        }
    }




    async editProduct(product) {
        // Extraemos el `_id` del producto y eliminamos este campo del objeto `updateData`
        const { id, ...updateData } = product;

        // Realizamos la operación de actualización usando `$set`
        const productUpdate = await this.collection.updateOne(
            { _id: new ObjectId(id) }, // Filtrar por el ID del producto
            { $set: updateData } // Solo actualizamos los campos enviados
        );

        // Retornamos el resultado de la operación
        return productUpdate;
    }
    async saveImages(data) {
        console.log(data)
        try {
            // Validar que los parámetros sean válidos
            if (!data) {
                throw new Error('Parámetros insuficientes');
            }

            // Actualizar solo la imagen de la variante específica
            if (data.productoConVariantes === "no") {

                const updateQuery = {
                    titulo: data.titulo,
                    descripcion: data.descripcion,
                    imagenes: data.imagenes,
                    productoTipo: data.productoTipo,
                    categoria: data.categoria,
                    color: data.color,
                    precio: data.precio,
                    variantes: []
                };

                console.log(updateQuery)
                const productUpdate = await this.collection.updateOne(
                    { _id: new ObjectId(data.id) }, // Filtrar por ID del producto
                    {
                        $set: updateQuery, // Solo actualizar los campos proporcionados
                    }
                );

                if (productUpdate.matchedCount === 0) {
                    console.warn(`No se encontró el producto con ID: ${productId}`);
                    return null; // Indicar que no se encontró el producto
                }


                return productUpdate;
            }
            else {
                const updateQuery = {
                    titulo: data.titulo,
                    descripcion: data.descripcion,
                    productoTipo: data.productoTipo,
                    imagenes: [],
                    categoria: data.categoria,
                    variantes: data.variantes.map(variant => ({
                        dato_1_col: variant.dato_1_col,
                        dato_2_mul: variant.dato_2_mul,
                        dato_3_pre: variant.dato_3_pre,
                        imagen: variant.imagen
                    }))
                };

                console.log(updateQuery)
                const productUpdate = await this.collection.updateOne(
                    { _id: new ObjectId(data.id) }, // Filtrar por ID del producto
                    {
                        $set: updateQuery, // Solo actualizar los campos proporcionados
                    }
                );

                if (productUpdate.matchedCount === 0) {
                    console.warn(`No se encontró el producto con ID: ${productId}`);
                    return null; // Indicar que no se encontró el producto
                }


                return productUpdate;
            }
        } catch (error) {
            console.error('Error actualizando la imagen de la variante:', error);
            throw error; // Propagar el error para manejarlo en el flujo superior
        }
    }



    /*  async editProduct(productId, updateData) {
         const productUpdate = await this.collection.updateOne(
             { _id: new ObjectId(productId) },
             { $set: updateData }
         );
         return productUpdate
     } */


    async dProduct(decoded, productId) {
        const productDeleted = await this.collection.deleteOne(
            { user_id: new ObjectId(decoded.id), _id: new ObjectId(productId) }
        );
        return productDeleted

    }



    async upproduct(decoded, data) {
        try {
            // Verifica si el producto tiene variantes
            if (data.productoConVariantes === "no") {
                function sanitizeFileName(fileName) {
                    return fileName
                        .toLowerCase()                   // Convierte todo a minúsculas
                        .replace(/ /g, '')              // Reemplaza espacios con guiones bajos
                        .replace(/-/g, '')               // Elimina guiones
                        .replace(/[^a-z0-9_.]/g, '');    // Elimina caracteres especiales, dejando solo letras, números, guiones bajos y puntos
                }
                const imagenesNuevas = Array.isArray(data.imagesAdded) ?
                    data.imagesAdded?.map(imagen => sanitizeFileName(imagen)) : [];

                // Concatenar las imágenes existentes con las nuevas imágenes
                const imagenesExistentes = Array.isArray(data?.imagenesExistentes) ?
                    data.imagenesExistentes : [];
                // Producto sin variantes, actualizamos solo los campos generales
                console.log("final data" + JSON.stringify(data))
                const updateData = {
                    creado: data.creado,
                    productoConVariantes: data.productoConVariantes,
                    titulo: data.titulo,
                    imagesAdded: [...imagenesExistentes, ...imagenesNuevas],
                    descripcion: data.descripcion,
                    productoTipo: data.productoTipo,
                    categoria: data.categoria,
                    color: data.color,
                    activo: data.activo,
                    estadoProducto: data.estadoProducto,
                    garantia: data.garantia,
                    stock: Number(data.stock),
                    ventas: Number(data.ventas),
                    precio: Number(data.precio),
                    variantes: []  // No hay variantes en este producto,
                };

                const updateQuery = {
                    $set: updateData
                };

                // Ejecuta la actualización del producto sin variantes
                await this.collection.updateOne(
                    { user_id: new ObjectId(decoded.id), _id: new ObjectId(data.id) },
                    updateQuery
                );

                console.log("Producto actualizado correctamente (sin variantes).");
                return { message: "Producto actualizado correctamente (sin variantes)." };

            } else {
                // Producto con variantes, actualizamos las variantes y otros campos
                const updateSetQuery = {};

                // Verificar si hay cambios en los datos generales del producto
                if (data.titulo) updateSetQuery.titulo = data.titulo;
                if (data.descripcion) updateSetQuery.descripcion = data.descripcion;
                if (data.productoTipo) updateSetQuery.productoTipo = data.productoTipo;
                if (data.categoria) updateSetQuery.categoria = data.categoria;
                if (data.color) updateSetQuery.color = data.color;


                // Si se han realizado cambios, actualizamos el producto
                if (Object.keys(updateSetQuery).length > 0) {
                    await this.collection.updateOne(
                        { user_id: new ObjectId(decoded.id), _id: new ObjectId(data.id) },
                        { $set: updateSetQuery }
                    );
                    console.log("Producto actualizado con nuevos datos.");
                }

                // Si hay variantes, se manejan de forma separada
                console.log("data variantes:" + JSON.stringify(data.variantes))

                const actualizarVariantes = async () => {
                    // Función para limpiar el nombre de la imagen
                    function sanitizeFileName(fileName) {
                        return fileName
                            .toLowerCase()                   // Convierte todo a minúsculas
                            .replace(/ /g, '')              // Reemplaza espacios con guiones bajos
                            .replace(/-/g, '')               // Elimina guiones
                            .replace(/[^a-z0-9_.]/g, '');    // Elimina caracteres especiales, dejando solo letras, números, guiones bajos y puntos
                    }

                    // Procesar las variantes: cada variante puede tener imágenes dentro
                    const variantesActualizadas = data.variantes?.map(variante => {
                        const imagenesNuevas = Array.isArray(variante.imagenes) ?
                            variante.imagenes?.map(imagen => sanitizeFileName(imagen)) : [];

                        // Concatenar las imágenes existentes con las nuevas imágenes
                        const imagenesExistentes = Array.isArray(variante?.imagenesExistentes) ?
                            variante.imagenesExistentes : [];
                        console.log("imgs existentes " + JSON.stringify(imagenesExistentes))
                        const varianteActualizada = {
                            _id: variante._id || new ObjectId(), // Si la variante no tiene _id, asignamos uno nuevo
                            dato_1_col: sanitizeFileName(variante.dato_1_col),  // Limpiar texto de dato_1_col
                            dato_2_mul: sanitizeFileName(variante.dato_2_mul),  // Limpiar texto de dato_2_mul
                            dato_3_pre: Number(variante.dato_3_pre) || 0,       // Convertir el precio a número
                            dato_4_stock: Number(variante.dato_4_stock) || 0,       // Convertir el precio a número
                            imagenes: [...imagenesExistentes, ...imagenesNuevas],  // Concatenar las imágenes existentes con las nuevas
                            creado: variante.creado,
                            garantia: variante.garantia,
                            estadoProducto: variante.estadoProducto,
                            ventas: Number(variante.ventas),
                            activo: variante.activo
                        };

                        return varianteActualizada;
                    });

                    // Aquí puedes proceder con la actualización de las variantes con el array de nombres de imágenes concatenado
                    try {
                        // Buscar el producto por ID
                        const producto = await this.collection.findOne({ user_id: new ObjectId(decoded.id), _id: new ObjectId(data.id) });

                        if (!producto) {
                            throw new Error("Producto no encontrado");
                        }

                        // Usamos el operador $set para actualizar las variantes
                        const updateQuery = {
                            $set: {
                                variantes: variantesActualizadas // Reemplazar las variantes con las nuevas variantes
                            }
                        };

                        // Realizamos la actualización en la base de datos
                        const result = await this.collection.updateOne(
                            { user_id: new ObjectId(decoded.id), _id: new ObjectId(data.id) },
                            updateQuery
                        );

                        console.log("Variantes actualizadas correctamente:", result);
                        return result;

                    } catch (error) {
                        console.error("Error al actualizar variantes:", error);
                        throw new Error("Error al actualizar variantes");
                    }
                };



                // Llamamos a la función para actualizar las variantes
                await actualizarVariantes(decoded);

                console.log("Producto y variantes actualizados correctamente.");
                return { message: "Producto y variantes actualizados correctamente." };
            }
        } catch (error) {
            console.error("Error al actualizar el producto: ", error);
            throw new Error("Error al actualizar el producto");
        }
    }































    async uploadImageOfProduct(productId, image) {

        const productUpdate = await this.collection.updateOne(
            { _id: new ObjectId(productId) },

            {
                $push: {
                    imagenes: image  // Elimina la imagen específica del array de imágenes
                }
            }
        );
        return productUpdate
    }
    /*   async getAllImages(userId) {
          const products = await this.collection.find(
              { user_id: new ObjectId(userId) }, // Filtra por user_id
              { projection: { imagenes: 1 } } // Proyecta solo el campo 'imagenes'
          ).toArray();
      
          // Extraer todas las imágenes de los productos
          const allImages = products.flatMap(product => product.imagenes);
      
          return allImages;
      } */
    async getAllImages(userId) {
        const products = await this.collection.find(
            { user_id: new ObjectId(userId) }, // Filtra por user_id
            { projection: { imagenes: 1, user_id: 1 } } // Proyecta los campos necesarios
        ).toArray();

        // Extraer las imágenes junto con _id y user_id
        const allImagesWithDetails = products.flatMap(product =>
            product.imagenes.map(image => ({
                image: image, // Asumiendo que 'image' es una cadena o un objeto con la URL
                productId: product._id, // ID del producto
                userId: product.user_id // user_id del producto
            }))
        );

        return allImagesWithDetails;
    }


}

export default ProductService;
