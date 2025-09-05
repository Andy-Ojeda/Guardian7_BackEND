const { db } = require('../config/firebaseConfig');

// Función para verificar si el cambio de estado de la alarma fue exitoso
const checkEstadoCambiado = async (msg, estadoNuevo, estadoAnterior) => {
    try {
        const estadoAlarmaDB = await db.ref(`datos/estadoAlarma/`).once('value'); // Obtiene el estado actual de la alarma
        const estadoActual = estadoAlarmaDB.val(); // Extrae el valor

        // Registra los estados para depuración
        console.log(`estadoAnterior: ${estadoAnterior}`);
        console.log(`estadoNuevo: ${estadoNuevo}`);
        console.log(`estadoAlarma: ${estadoActual}`);

        // Verifica si el estado de la alarma es nulo
        if (estadoActual === null) {
            await msg.reply("Error: No se encontró el estado de la alarma en la base de datos.");
            return;
        }

        const estadoActualTexto = estadoActual ? "Encendida" : "Apagada"; // Convierte el estado a texto
        // Verifica si el estado nuevo coincide con el estado actual
        if (estadoActual === estadoNuevo) {
            if (estadoAnterior !== estadoNuevo) {
                // El cambio de estado fue exitoso
                await msg.reply(`La alarma se ${estadoNuevo ? "encendió" : "apagó"} correctamente. Ahora está ${estadoActualTexto}.`);
            } else {
                // El estado ya era el mismo
                await msg.reply(`La alarma ya estaba ${estadoActualTexto}.`);
            }
        } else {
            // El cambio de estado falló
            await msg.reply(`No se pudo cambiar el estado. La alarma sigue ${estadoActualTexto}.`);
        }
    } catch (error) {
        console.error("Error en checkEstadoCambiado:", error); // Registra el error
        await msg.reply("Ocurrió un error al verificar el estado de la alarma."); // Notifica al usuario del error
    }
};

module.exports = { checkEstadoCambiado };