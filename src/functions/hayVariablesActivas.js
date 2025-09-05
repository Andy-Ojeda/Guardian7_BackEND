const { db } = require('../config/firebaseConfig');

// Función para verificar si hay sensores activos en Firebase
const hayVariablesActivas = async () => {
    const snapshot = await db.ref('variables').once('value'); // Obtiene las variables desde Firebase
    const variables = snapshot.val(); // Extrae el valor de las variables
    if (!variables) return false; // Retorna false si no existen variables
    // Verifica si alguna variable tiene el estado en true
    return Object.values(variables).some(v => v.state === true);
};

module.exports = { hayVariablesActivas };