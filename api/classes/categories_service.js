import { clientDB } from "../../lib/database.js";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

class CategoryService {
    constructor() {
        this.collection = clientDB.db("tienda").collection('category'); // Nombre de la colección de usuarios
    }

    async addCategories(decoded, categoriesData) {
        console.log(JSON.stringify(categoriesData));
        const userId = decoded.id;  // Obtener el id del usuario desde el token decodificado
    
        // Obtener las categorías actuales desde la base de datos
        const currentCategories = await this.collection.findOne({
            user_id: new ObjectId(userId),
        });
    
        if (!currentCategories) {
            // Si no se encuentran categorías, insertamos las nuevas categorías directamente
            return await this.collection.insertMany(
                { user_id: new ObjectId(userId) },
                { $set: { categories: categoriesData[0].categories } },  // Notar que ahora accedemos correctamente a categories en categoriesData
                { upsert: true }
            );
        }
    
        // Obtener las categorías actuales y sus subcategorías
        const currentCategoryList = currentCategories.categories;
    
        // Preparar los datos para la actualización
        let categoriesToAddOrUpdate = [];
    
        // Iterar sobre las categorías recibidas para agregar o actualizar
        if (categoriesData && Array.isArray(categoriesData)) {
            for (const data of categoriesData) {
                if (data.categories && Array.isArray(data.categories)) {
                    for (const newCat of data.categories) {
                        const existingCategory = currentCategoryList.find((cat) =>
                            new ObjectId(cat._id).equals(new ObjectId(newCat._id))
                        );
    
                        if (existingCategory) {
                            // Si la categoría ya existe, actualizamos sus subcategorías
                            const updatedSubcategories = newCat.subcategories.map((newSubcat) => {
                                const existingSubcategory = existingCategory.subcategories.find((subcat) =>
                                    new ObjectId(subcat._id).equals(new ObjectId(newSubcat._id))
                                );
    
                                if (existingSubcategory) {
                                    // Actualizamos la subcategoría
                                    return {
                                        ...existingSubcategory,
                                        name: newSubcat.name || existingSubcategory.name,
                                    };
                                } else {
                                    // Si la subcategoría no existe, la agregamos
                                    return {
                                        _id: new ObjectId(),
                                        name: newSubcat.name,
                                        user_id: new ObjectId(userId),
                                        subcategories: [],
                                    };
                                }
                            });
    
                            categoriesToAddOrUpdate.push({
                                ...existingCategory,
                                name: newCat.name,
                                subcategories: updatedSubcategories,
                            });
                        } else {
                            // Si la categoría no existe, la agregamos
                            categoriesToAddOrUpdate.push({
                                _id: new ObjectId(),
                                name: newCat.name,
                                user_id: new ObjectId(userId),
                                subcategories: newCat.subcategories.map((newSubcat) => ({
                                    _id: new ObjectId(),
                                    name: newSubcat.name,
                                    user_id: new ObjectId(userId),
                                    subcategories: [],
                                })),
                            });
                        }
                    }
                }
            }
        }
    
        // Realizamos la actualización de categorías y subcategorías
        const updateResult = await this.collection.updateOne(
            { user_id: new ObjectId(userId) },
            { $set: { categories: categoriesToAddOrUpdate } },
            { upsert: true }
        );
    
        return {
            categoriesUpdated: updateResult.modifiedCount > 0,
        };
    }
    
    

    async getCategoriesByUser(decoded) {

        // Insertamos las categorías con _id y id_user en la base de datos
        const result = await this.collection.find({ user_id: new ObjectId(decoded.id) }).toArray();
        console.log(result);
        // Retornar el resultado de la inserción
        return result;
    }





}

export default CategoryService;
