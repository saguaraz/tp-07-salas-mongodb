const { conectarBaseDatos, desconectarBaseDatos } = require("../src/config/base-datos");
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
