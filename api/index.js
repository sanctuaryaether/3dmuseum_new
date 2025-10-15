import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import hotspotsRoutes from "./routes/hotspots.js";

dotenv.config();

const app = express();

// Enable CORS for all origins (or restrict to your frontend domain)
app.use(cors({
  origin: "*" // Replace "*" with "https://museum-3d-map-test.vercel.app" in production
}));

app.use(express.json());

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// API routes
app.use("/api/hotspots", hotspotsRoutes);

// Export app (for Vercel deployment)
export default app;
