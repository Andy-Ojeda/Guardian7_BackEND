const { db } = require('../config/firebaseConfig');

// Función para actualizar el estado de la sirena en Firebase
const actualizarSirena = async (estado) => {
    try {
        await db.ref('sirena').set(estado); // Actualiza el estado de la sirena
        console.log(`Estado de Sirena: ${estado ? 'Encendido' : 'Apagado'}`); // Registra la actualización
    } catch (error) {
        console.error('Error al actualizar el estado de alarma:', error.message); // Registra el error
    }
};

module.exports = { actualizarSirena };