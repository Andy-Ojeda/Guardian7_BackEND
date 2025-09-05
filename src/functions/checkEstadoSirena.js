const { db } = require('../config/firebaseConfig');

// Función para verificar si el cambio de estado de la sirena fue exitoso
const checkEstadoSirena = async (msg, estadoNuevo, estadoAnteriorSirena) => {
    try {
        const estadoSirena = await db.ref(`sirena/`).once('value'); // Obtiene el estado actual de la sirena
        const estadoActualSirena = estadoSirena.val(); // Extrae el valor

        // Registra los estados para depuración
        console.log(`EstadoAnterior: ${estadoAnteriorSirena}`);
        console.log(`EstadoNuevo: ${estadoNuevo}`);
        console.log(`EstadoAlarma: ${estadoActualSirena}`);

        // Verifica si el estado de la sirena es nulo
        if (estadoActualSirena === null) {
            await msg.reply("Error: No se encontró el estado de la Sirena en la base de datos.");
            return;
        }

        const estadoActualTexto = estadoActualSirena ? "Encendida" : "Apagada"; // Convierte el estado a texto
        // Verifica si el estado nuevo coincide con el estado actual
        if (estadoActualSirena === estadoNuevo) {
            if (estadoAnteriorSirena !== estadoNuevo) {
                // El cambio de estado fue exitoso
                await msg.reply(`La Sirena se ${estadoNuevo ? "encendió" : "apagó"} correctamente. Ahora está ${estadoActualTexto}.`);
            } else {
                // El estado ya era el mismo
                await msg.reply(`La Sirena ya estaba ${estadoActualTexto}.`);
            }
        } else {
            // El cambio de estado falló
            await msg.reply(`No se pudo cambiar el estado. La Sirena sigue ${estadoActualTexto}.`);
        }
    } catch (error) {
        console.error("Error en checkEstadoSirena:", error); // Registra el error
        await msg.reply("Ocurrió un error al verificar el estado de la Sirena."); // Notifica al usuario del error
    }
};

module.exports = { checkEstadoSirena };