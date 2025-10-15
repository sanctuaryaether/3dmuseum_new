import mongoose from "mongoose";

const hotspotSchema = new mongoose.Schema({
  title: String,
  image: String,
  text: String,
  schedule: String
});

export default mongoose.model("Hotspot", hotspotSchema);
