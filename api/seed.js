import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Tu schema y modelo
const hotspotSchema = new mongoose.Schema({
  position: { x: Number, y: Number, z: Number },
  title: String,
  description: String,
});

const Hotspot = mongoose.model("Hotspot", hotspotSchema);

const hotspots = [
  {
    title: 'De Aek',
    image: 'images/aek.jpg',
    text: "Huisje ‘de Aek’ herbergt de permanente expositie ‘Vissers van Wad en Gat’. Bij binnenkomst links staat een vitrine met houtsnijwerk en voorwerpen die herinneren aan de ramp van 1883 waarbij 83 vissers verdronken. In een andere vitrine zijn herinneringen aan het reddingsstation te Moddergat te zien. Een tweetal diorama's met scheepsmodellen en vistechnieken. Ook staat hier een diorama met de redding van Gerben Basteleur. In de ruimte staat een maquette van het dorp omstreeks 1900. In 1816 wordt het huis dubbel bewoond, want dan staat ook zijn zoon Bote Klases Groen als eigenaar vermeld. In 1819 strandt Bote met zijn snik op het strand van Schiermonnikoog, samen met 8 andere snikken. In 1839 wordt het huis dubbel bewoond, want behalve het gezin van Willem Hendriks Mans woont er ook het jonge gezin van zijn zwager Gooitzen Jelles Basteleur. Hij is getrouwd met Mintje Minnes Zeilinga en er zijn twee kinderen, Martje en Jelle."
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