import express from "express";
import { config } from "dotenv";
import cors from "cors";
// Tus rutas existentes
import appRoutes from "./routes/routes_appointments.js"
import resRoutes from "./routes/routes_resources.js"


import userRoutes from "./routes/routes_user.js"
import wRoutes from "./routes/routes_wait.js"
import patientsRoutes from "./routes/routes_patients.js"


import cookieParser from "cookie-parser";
import path from "path";
/* import orderRoutes from "./routes/routes_orders.js" */
config();

const app = express();
app.use(cors({ origin: ["https://contygo.vercel.app", "http://localhost:5173","http://localhost:5174","https://opawork.app"], methods: "GET, POST, PUT, DELETE, OPTIONS", credentials: true }));
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


app.use('/api', userRoutes);
app.use('/api', wRoutes);
app.use('/api', patientsRoutes);
app.use('/api', resRoutes);
app.use('/api', appRoutes);


app.listen(3001, () => {
    console.log("Servidor escuchando en puerto 3001");
});