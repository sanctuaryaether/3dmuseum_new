import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import hotspotsRoutes from "./routes/hotspots.js";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Conexión a MongoDB (solo una vez)
const mongoURI = process.env.MONGODB_URI;
if (!mongoose.connection.readyState) {
  mongoose.connect(mongoURI)
    .then(() => console.log("✅ Conectado a MongoDB Atlas"))
    .catch((err) => console.error("❌ Error de conexión:", err));
}

// 🔹 Rutas API
app.use("/api/hotspots", hotspotsRoutes);

// 🔹 Exporta como handler para Vercel
export default app;
