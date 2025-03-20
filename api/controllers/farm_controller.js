
import serviceFarm from "../classes/farm_service.js"
const sFarm = new serviceFarm()
import jwt from "jsonwebtoken"

export const getMessages = async (req, res) => {
    const token = req.cookies?.sessionToken;
    try {
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const { id } = req.params;
        console.log(id)
        const messages = await sFarm.getChatMessages(id);
        if (messages.length > 0) {

            console.log("mensjes" + JSON.stringify(messages))
            return res.status(200).json({ data: messages, message: "Obtenidos" });
        }
    } catch (error) {
        console.error("Error en getMessages:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
};



export const sendMessage = async (req, res) => {
    const token = req.cookies?.sessionToken;

    try {
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { chats } = req.body;
  console.log(chats)

        if (!chats) return res.status(400).json({ error: "Faltan datos" });

        /* await sFarm.insertMessage(chats);
        const botResponse = await sFarm.generateBotResponse(decoded, chatId, text);
 */
        res.json({ response: botResponse });
    } catch (error) {
        console.error("Error en sendMessage:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
};

