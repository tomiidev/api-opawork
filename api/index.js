import express from "express";
import { config } from "dotenv";
import cors from "cors";
// Tus rutas existentes
import resRoutes from "./routes/routes_advises.js"
import paymentsRoutes from "./routes/routes_subscriptions.js"


import userRoutes from "./routes/routes_user.js"
import patientsRoutes from "./routes/routes_patients.js"
import messageRoutes from "./routes/routes_farm.js"


import cookieParser from "cookie-parser";
config();

const app = express();
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "https://auth.opawork.app",
    "https://negocios.opawork.app"
];
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, origin); // 🔥 Devuelve dinámicamente el origen correcto
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true, // 🔥 Importante para enviar cookies en solicitudes
        methods: "GET, POST, PUT, DELETE, OPTIONS",
    })
);
/* app.options('*', cors()); */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use((err, req, res, next) => {
    if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
});
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    next();
  });
  

app.use('/api', userRoutes);
app.use('/api', paymentsRoutes);
app.use('/api', patientsRoutes);
app.use('/api', resRoutes);

app.use('/api', messageRoutes);

app.listen(3001, () => {
    console.log("Servidor escuchando en puerto 3001");
});