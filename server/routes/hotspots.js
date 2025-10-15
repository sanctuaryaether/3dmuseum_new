import express from "express";
import Hotspot from "../models/Hotspot.js";

const router = express.Router();

// Obtener todos los hotspots
router.get("/", async (req, res) => {
  try {
    const hotspots = await Hotspot.find();
    res.json(hotspots);
  } catch (error) {
    console.error("❌ Error al obtener hotspots:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

export default router;
