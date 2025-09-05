const { db } = require('../config/firebaseConfig');

// Función para enviar mensajes a contactos registrados
const notifyContacts = async (client, message, media = null) => {
    try {
        const snapshot = await db.ref('contactos').once('value'); // Obtiene los contactos desde Firebase
        const contactos = snapshot.val(); // Extrae los datos de los contactos

        // Verifica si existen contactos
        if (!contactos) {
            console.log("No se encontraron contactos en la base de datos.");
            return [];
        }

        // Itera a través de los contactos
        for (const [phoneNumber, { name, state }] of Object.entries(contactos)) {
            if (state === true) { // Solo envía a contactos activos
                console.log(`Enviando mensaje a ${name} (-${phoneNumber}-): ${message}`);
                const chatId = `${phoneNumber}@c.us`; // Formatea el ID de chat de WhatsApp
                if (media) {
                    // Envía mensaje con medios (por ejemplo, imagen)
                    await client.sendMessage(chatId, media, { caption: message });
                } else {
                    // Envía mensaje de texto
                    await client.sendMessage(chatId, message);
                }
            }
        }
    } catch (error) {
        console.error('Error al notificar a los contactos:', error.message); // Registra el error
    }
};

module.exports = { notifyContacts };