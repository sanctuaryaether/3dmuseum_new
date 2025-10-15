// api/models/Hotspot.js
import mongoose from "mongoose";

const hotspotSchema = new mongoose.Schema({
  position: {
    x: Number,
    y: Number,
    z: Number,
  },
  title: String,
  description: String,
});

export default mongoose.model("Hotspot", hotspotSchema);
