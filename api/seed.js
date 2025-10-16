import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const hotspotSchema = new mongoose.Schema({
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    z: { type: Number, default: 0 }
  },
  title: String,
  description: String,
  image: String,
  text: String,
  schedule: String
});

const Hotspot = mongoose.model("Hotspot", hotspotSchema);

const hotspots = [
  {
    title: 'De Aek',
    image: 'images/aek.jpg',
    text: "Huisje ‘de Aek’ herbergt de permanente expositie…"
  },
  {
    title: "Wadlopen",
    image: "images/wadlopen.jpeg",
    text: "De expeditie naar de Peazemerrede...",
    schedule: `
      <table class="schedule-table">
        <thead>
          <tr><th>September</th><th>Datum & Tijd</th></tr>
        </thead>
        <tbody>
          <tr><td>di, 2.</td><td>10.00 uur Avonturentocht</td></tr>
          <tr><td>ma. 8.</td><td>16.00 uur Avonturentocht</td></tr>
        </tbody>
      </table>
    `
  },
  {
    title: "De L.A.Buma",
    image: "images/labuma.jpg",
    text: "Geschiedenis: Naam van de boot: De L.A. Buma..."
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Conectado a MongoDB Atlas");
    await Hotspot.deleteMany(); // Limpia la colección
    await Hotspot.insertMany(hotspots);
    console.log("🌍 Hotspots insertados correctamente");
  } catch (err) {
    console.error("❌ Error al insertar:", err);
  } finally {
    mongoose.connection.close();
  }
}

seed();
