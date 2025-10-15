// api/routes/hotspots.js
import express from "express";
import Hotspot from "../models/Hotspot.js";

const router = express.Router();

// Obtener todos los hotspots
router.get("/", async (req, res) => {
  try {
    const hotspots = await Hotspot.find();
    res.json(hotspots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Crear un hotspot (para pruebas)
router.post("/", async (req, res) => {
  try {
    const newHotspot = new Hotspot(req.body);
    await newHotspot.save();
    res.status(201).json(newHotspot);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
