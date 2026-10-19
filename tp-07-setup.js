const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

console.log("=== INICIANDO CONFIGURACIÓN AUTOMÁTICA TP07 ===");

// 1. Crear carpetas necesarias
const carpetas = [
  path.join(__dirname, "src", "config"),
  path.join(__dirname, "src", "modelos"),
  path.join(__dirname, "scripts")
];

carpetas.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Carpeta creada: ${dir}`);
  }
});

// 2. Archivo: .env.example
fs.writeFileSync(
  path.join(__dirname, ".env.example"),
  `PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://USUARIO:CLAVE@HOST/reservas_salas_u7?retryWrites=true&w=majority
`
);

// 3. Archivo: src/config/entorno.js
fs.writeFileSync(
  path.join(__dirname, "src", "config", "entorno.js"),
  `function leerConfiguracion(entorno = process.env) {
  const puerto = Number(entorno.PORT ?? 3000);
  if (!Number.isInteger(puerto) || puerto < 1 || puerto > 65535) {
    throw new Error("PORT debe ser un entero entre 1 y 65535");
  }
  const formatoRegistro = entorno.NODE_ENV === "production" ? "combined" : "dev";
  return { puerto, formatoRegistro };
}

function leerUriMongo(entorno = process.env) {
  const uri = entorno.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error("Falta MONGODB_URI en el entorno.");
  }
  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    throw new Error("MONGODB_URI debe comenzar con mongodb:// o mongodb+srv://.");
  }
  return uri;
}

module.exports = { leerConfiguracion, leerUriMongo };
`
);

// 4. Archivo: src/config/base-datos.js
fs.writeFileSync(
  path.join(__dirname, "src", "config", "base-datos.js"),
  `const mongoose = require("mongoose");
const dns = require("node:dns");
const { leerUriMongo } = require("./entorno");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

async function conectarBaseDatos() {
  await mongoose.connect(leerUriMongo(), {
    serverSelectionTimeoutMS: 5000
  });
}

async function desconectarBaseDatos() {
  await mongoose.disconnect();
}

module.exports = { conectarBaseDatos, desconectarBaseDatos };
`
);

// 5. Archivo: src/modelos/reserva.js
fs.writeFileSync(
  path.join(__dirname, "src", "modelos", "reserva.js"),
  `const mongoose = require("mongoose");

const reservaSchema = new mongoose.Schema(
  {
    estudiante: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, match: /@/ },
    sala: {
      type: String,
      required: true,
      trim: true,
      enum: ["Sala Norte", "Sala Sur", "Sala Multimedia"]
    },
    fecha: { type: String, required: true, trim: true },
    turno: {
      type: String,
      required: true,
      trim: true,
      enum: ["Mañana", "Tarde", "Noche"]
    },
    personas: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
      validate: {
        validator: Number.isInteger,
        message: "Debe ser un número entero"
      }
    }
  },
  { collection: "reservas" }
);

module.exports = mongoose.model("Reserva", reservaSchema);
`
);

// 6. Archivo: scripts/comprobar-conexion.js
fs.writeFileSync(
  path.join(__dirname, "scripts", "comprobar-conexion.js"),
  `const { conectarBaseDatos, desconectarBaseDatos } = require("../src/config/base-datos");

async function main() {
  try {
    await conectarBaseDatos();
    console.log("Conexión con MongoDB establecida.");
  } finally {
    await desconectarBaseDatos();
  }
}

main().catch((error) => {
  console.error("No se pudo completar la conexión:", error.name);
  process.exitCode = 1;
});
`
);

// 7. Archivo: scripts/crear-reserva.js
fs.writeFileSync(
  path.join(__dirname, "scripts", "crear-reserva.js"),
  `const { conectarBaseDatos, desconectarBaseDatos } = require("../src/config/base-datos");
const Reserva = require("../src/modelos/reserva");

async function main() {
  try {
    await conectarBaseDatos();
    const reserva = await Reserva.create({
      estudiante: "Juan Pérez",
      email: "juan.perez@estudiante.edu.ar",
      sala: "Sala Norte",
      fecha: "2026-10-25",
      turno: "Mañana",
      personas: 3
    });
    console.log("Reserva guardada. _id:", reserva._id.toString());
  } finally {
    await desconectarBaseDatos();
  }
}

main().catch((error) => {
  console.error("No se pudo crear la reserva:", error.name);
  if (error.errors) {
    console.error("Campos a revisar:", Object.keys(error.errors).join(", "));
  }
  process.exitCode = 1;
});
`
);

// 8. Archivo: scripts/listar-reservas.js
fs.writeFileSync(
  path.join(__dirname, "scripts", "listar-reservas.js"),
  `const { conectarBaseDatos, desconectarBaseDatos } = require("../src/config/base-datos");
const Reserva = require("../src/modelos/reserva");

async function main() {
  try {
    await conectarBaseDatos();
    const reservas = await Reserva.find({});
    console.table(
      reservas.map((r) => ({
        _id: r._id.toString(),
        estudiante: r.estudiante,
        sala: r.sala,
        fecha: r.fecha,
        turno: r.turno,
        personas: r.personas
      }))
    );
    console.log("Total de reservas recuperadas:", reservas.length);
  } finally {
    await desconectarBaseDatos();
  }
}

main().catch((error) => {
  console.error("No se pudo consultar las reservas:", error.name);
  process.exitCode = 1;
});
`
);

console.log("✓ Todos los archivos del laboratorio han sido creados exitosamente.");

// 9. Instalación de Mongoose
console.log("\nInstalando Mongoose...");
try {
  execSync("npm install mongoose@9.10.3 --save-exact", { stdio: "inherit" });
  console.log("✓ Mongoose instalado.");
} catch (e) {
  console.error("Error al instalar dependencies:", e.message);
}

console.log("\n==================================================");
console.log("PASOS FINALES PARA PROBAR EN LA TERMINAL:");
console.log("1. Copia tu archivo .env.example a .env");
console.log("2. Reemplaza MONGODB_URI en .env con tus credenciales reales de Atlas");
console.log("3. Ejecuta los comandos del laboratorio:");
console.log("   node --env-file .env scripts/comprobar-conexion.js");
console.log("   node --env-file .env scripts/crear-reserva.js");
console.log("   node --env-file .env scripts/listar-reservas.js");
console.log("==================================================");