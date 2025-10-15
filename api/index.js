// api/index.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import hotspotsRoutes from "./routes/hotspots.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a MongoDB Atlas
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Conectado a MongoDB Atlas"))
  .catch((err) => console.error("❌ Error de conexión a MongoDB:", err));

// Rutas
app.use("/api/hotspots", hotspotsRoutes);

// Exporta la app (no app.listen en Vercel)
export default app;
