const { db } = require('../config/firebaseConfig');

// Función para actualizar el estado de la alarma en Firebase
const actualizarEstadoAlarma = async (estado) => {
    try {
        await db.ref('datos/estadoAlarma').set(estado); // Actualiza el estado de la alarma
        if (!estado) {
            await db.ref('sirena').set(estado); // Apaga la sirena si la alarma se apaga
        }
        console.log(`Estado de alarma actualizado a: ${estado ? 'Encendido' : 'Apagado'}`); // Registra la actualización
    } catch (error) {
        console.error('Error al actualizar el estado de alarma:', error.message); // Registra el error
    }
};

module.exports = { actualizarEstadoAlarma };