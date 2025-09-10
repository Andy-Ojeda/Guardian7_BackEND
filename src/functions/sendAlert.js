// const { db } = require('../config/firebaseConfig');

// async function sendAlert(client, clientId, varKey, variableName) {
//   try {
//     // Referencia al nodo de contactos para el cliente específico
//     const contactosRef = db.ref(`clientes/${clientId}/configuracion/contactos`);
//     const snapshot = await contactosRef.once('value');
//     const contactos = snapshot.val();

//     if (!contactos) {
//       console.log(`No se encontraron contactos para el cliente ${clientId}`);
//       return;
//     }

//     // Filtrar contactos con state en true
//     const contactosActivos = Object.entries(contactos)
//       .filter(([_, contacto]) => contacto.state === true)
//       .map(([numero, contacto]) => ({
//         numero: numero.replace(/\D/g, ''), // Limpiar el número (quitar caracteres no numéricos)
//         nombre: contacto.name || 'Contacto'
//       }));

//     if (contactosActivos.length === 0) {
//       console.log(`No hay contactos activos con state true para ${clientId}`);
//       return;
//     }

//     // Enviar mensaje a cada contacto activo
//     for (const { numero, nombre } of contactosActivos) {
//       const mensaje = `¡Alerta! ${nombre}, el sensor "${variableName}" (${varKey}) en el cliente ${clientId} se ha activado.`;
//       const phoneNumber = `+${numero}`; // Asegura el formato internacional

//       try {
//         console.log("NÚMERO DE CELULAR: ", phoneNumber);
//         console.log("MENSAJE: ", mensaje);

//         await client.sendMessage(phoneNumber, mensaje);
//         console.log(`Mensaje enviado a ${nombre} (${phoneNumber}): ${mensaje}`);
//       } catch (error) {
//         console.error(`Error al enviar mensaje a ${nombre} (${phoneNumber}):`, error.message);
//       }
//     }
//   } catch (error) {
//     console.error(`Error al procesar la alerta para ${clientId}:`, error.message);
//   }
// }

// module.exports = { sendAlert };


// const { db } = require('../config/firebaseConfig');

// async function sendAlert(client, clientId, varKey, variableName) {
//   try {
//     // Verificar si el cliente está listo
//     if (!client || typeof client.sendMessage !== 'function' || !client.info || !client.info.wid) {
//       console.error('Cliente de WhatsApp no está inicializado o autenticado');
//       return;
//     }

//     // Referencia al nodo de contactos para el cliente específico
//     const contactosRef = db.ref(`clientes/${clientId}/configuracion/contactos`);
//     const snapshot = await contactosRef.once('value');
//     const contactos = snapshot.val();

//     if (!contactos) {
//       console.log(`No se encontraron contactos para el cliente ${clientId}`);
//       return;
//     }

//     // Filtrar contactos con state en true
//     const contactosActivos = Object.entries(contactos)
//     console.log("CONTACTOS ACTIVOS::: ", contactosActivos)
//       .filter(([_, contacto]) => contacto.state === true)
//       .map(([numero, contacto]) => ({
//         numero: numero.replace(/\D/g, ''), // Limpiar el número (quitar caracteres no numéricos)
//         nombre: contacto.name || 'Contacto'
//       }));

//     if (contactosActivos.length === 0) {
//       console.log(`No hay contactos activos con state true para ${clientId}`);
//       return;
//     }

//     // Enviar mensaje a cada contacto activo
//     for (const { numero, nombre } of contactosActivos) {
//       const mensaje = `¡Alerta! ${nombre}, el sensor "${variableName}" (${varKey}) en el cliente ${clientId} se ha activado.`;
//       const chatId = `${numero}@c.us`; // Formato correcto para WhatsApp Web

//       console.log("CHAT ID:", chatId);
//       console.log("MENSAJE:", mensaje);

//       try {
//         // Verificar si el chat ID es válido
//         if (!/^\d{10,}@c.us$/.test(chatId)) {
//           console.error(`Chat ID inválido: ${chatId}`);
//           continue;
//         }

//         await client.sendMessage(chatId, mensaje);
//         console.log(`Mensaje enviado a ${nombre} (${chatId}): ${mensaje}`);
//       } catch (error) {
//         console.error(`Error al enviar mensaje a ${nombre} (${chatId}):`, error);
//         if (error.message.includes('Evaluation failed')) {
//           console.error('Posible problema: Cliente no autenticado o sesión expirada. Verifica el QR o la conexión.');
//         }
//       }
//     }
//   } catch (error) {
//     console.error(`Error al procesar la alerta para ${clientId}:`, error.message);
//   }
// }

// module.exports = { sendAlert };




// functions/sendAlert.js
const { db } = require('../config/firebaseConfig');

async function sendAlert(client, clientId, varKey, variableName) {
  try {
    if (!client || typeof client.sendMessage !== 'function') {
      console.error('Cliente de WhatsApp no está inicializado o autenticado');
      return;
    }

    const contactosRef = db.ref(`clientes/${clientId}/configuracion/contactos`);
    const snapshot = await contactosRef.once('value');
    const contactos = snapshot.val();

    if (!contactos) {
      console.log(`No se encontraron contactos para el cliente ${clientId}`);
      return;
    }

    const activos = Object.entries(contactos)
      .filter(([_, c]) => c && c.state === true)
      .map(([numero, c]) => ({
        numero: String(numero).replace(/\D/g, ''),
        nombre: c.name || 'Contacto',
      }));

    if (!activos.length) {
      console.log(`No hay contactos activos con state true para ${clientId}`);
      return;
    }

    for (const { numero, nombre } of activos) {
      const mensaje = `¡Alerta! ${nombre}, el sensor "${variableName}" (${varKey}) en el cliente ${clientId} se ha activado.`;

      try {
        // Verificamos si es un número válido en WhatsApp
        const numberId = await client.getNumberId(numero);
        if (!numberId) {
          console.error(`El número no está en WhatsApp o no es válido: ${numero}`);
          continue;
        }

        const chatId = numberId._serialized; // e.g. "54911...@c.us"
        await client.sendMessage(chatId, mensaje);

        console.log(`Mensaje enviado a ${nombre} (${chatId}): ${mensaje}`);
      } catch (error) {
        console.error(`Error al enviar mensaje a ${nombre} (${numero}):`, error?.message || error);
        if (String(error?.message || '').includes('Evaluation failed')) {
          console.error('Posible problema: Cliente no autenticado o sesión expirada. Verifica el QR o la conexión.');
        }
      }
    }
  } catch (error) {
    console.error(`Error al procesar la alerta para ${clientId}:`, error?.message || error);
  }
}

module.exports = { sendAlert };
