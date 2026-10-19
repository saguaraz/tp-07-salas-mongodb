const { conectarBaseDatos, desconectarBaseDatos } = require("../src/config/base-datos");

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
