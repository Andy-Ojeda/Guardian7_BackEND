
// const { db } = require('../config/firebaseConfig');

// const { DigestClient } = require('digest-fetch'); // Añadir dependencia
// const base64 = require('base-64'); // Añadir si no está disponible globalmente
// const firebase = require('firebase-admin'); // Asegúrate de que esté disponible

// // Función para monitorear cambios en variables y tomar snapshot con la IP del cliente
// const monitorVariablesAndTakeSnapshot = (client, db) => {
//   // Referencia a todos los clientes en Firebase
  
//   const clientsRef = db.ref('clientes');

//   // Escuchar cambios en tiempo real en las variables de todos los clientes
//   clientsRef.on('value', async (snapshot) => {
//     const clients = snapshot.val();
//     // console.log("Clientes: ", clients); // Depuración

//     if (!clients) {
//       console.log("No se encontraron clientes en Firebase");
//       return;
//     }

//     // Iterar sobre cada cliente
//     for (const [clientId, clientData] of Object.entries(clients)) {
//       const variables = clientData.configuracion?.variables;
//       if (!variables) continue;

//       // Verificar si alguna variable cambió a 'true'
//       let variableChanged = false;
//       let changedVariableName = '';
//       for (const [varKey, variable] of Object.entries(variables)) {
//         // Inicializar previousState si no existe
//         // if (variable.previousState === undefined) {
//         //   await db.ref(`clientes/${clientId}/configuracion/variables/${varKey}/previousState`).set(false);
//         // }
//         if (variable.state === true && !variable.previousState) {
//           variableChanged = true;
//           changedVariableName = variable.name;
//           break;
//         }
//       }

//       if (variableChanged) {
//         console.log("------------------------------------------------------------");
//         console.log(`Cambio detectado en ${clientId}, Sensor: ${changedVariableName}`);

//         // Obtener la IP global e ID de dispositivo del Cliente
//         const ipGlobal = clientData.configuracion.IP_global?.ip;
//         const idDispositivo = clientData.configuracion.dispositivo_id && clientData.configuracion.dispositivo_id;

//         if (!ipGlobal || typeof ipGlobal !== 'string') {
//           console.error(`IP no encontrada para el cliente ${clientId}`);
//           continue;
//         }
//         if (!idDispositivo || typeof idDispositivo !== 'string') {
//           console.error(`ID del dispositivo no encontrado. ID_Cliente: ${clientId}`);
//           continue;
//         }

//         console.log("ipGlobal del Dispositivo: ", ipGlobal);
//         console.log("ID del Dispositivo: ", idDispositivo);
//         console.log("------------------------------------------------------------");

//         // Configuración de la cámara con la IP del cliente
//         const cameraConfig = {
//           url: `http://${ipGlobal}/cgi-bin/snapshot.cgi`,
//           channel: '1',
//           username: 'admin',
//           password: 'Royo12345'
//         };

//         // Crear cliente con autenticación Digest
//         const digestClient = new DigestClient(cameraConfig.username, cameraConfig.password);

//         try {
//           // Realizar la solicitud del snapshot
//           const fullUrl = `${cameraConfig.url}?channel=${cameraConfig.channel}&subtype=0`;
//           console.log("URL de la Cámara: ", fullUrl);
//           const response = await digestClient.fetch(fullUrl, {
//             method: 'GET',
//             headers: { 'Accept': 'image/jpeg' }
//           });

//           if (response.status === 200) {
//             console.log("Captura de Imagen OK...!!!")
//         //     const arrayBuffer = await response.arrayBuffer();
//         //     const imageBuffer = Buffer.from(arrayBuffer);
//         //     const imageBase64 = base64.encode(imageBuffer.toString('binary'));

//         //     // Subir la imagen a Firebase Storage
//         //     const storage = firebase.storage();
//         //     const snapshotKey = `snapshot_${clientId}_${Date.now()}`;
//         //     const storageRef = storage.ref(`snapshots/${snapshotKey}.jpg`);
//         //     await storageRef.put(Buffer.from(imageBuffer), { contentType: 'image/jpeg' });

//         //     // Guardar la referencia en la base de datos Realtime
//         //     await db.ref(`clientes/${clientId}/snapshots/${snapshotKey}`).set({
//         //       timestamp: Date.now(),
//         //       source: changedVariableName
//         //     });

//         //     // Notificar a los contactos del cliente
//         //     const message = `${changedVariableName} activada en ${clientId}. Snapshot tomado.`;
//         //     await notifyContacts(client, message, null, clientId);

//         //     console.log(`Snapshot tomado para ${clientId} y guardado como ${snapshotKey}`);
//           } else {
//             console.error(`Fallo al obtener snapshot para ${clientId}. Código: ${response.status}`);
//           }
//         } catch (error) {
//           console.error(`Error al tomar snapshot para ${clientId}:`, error.message);
//         }

//         // // Actualizar previousState
//         // for (const [varKey, variable] of Object.entries(variables)) {
//         //   if (variable.state === true) {
//         //     await db.ref(`clientes/${clientId}/configuracion/variables/${varKey}/previousState`).set(true);
//         //   }
//         // }
//       }
//     }
//   }, (error) => {
//     console.error('Error en el listener de clientes:', error); // Manejar errores del listener
//   });
// };

// // // Función auxiliar para notificar contactos de un cliente específico
// // const notifyContacts = async (client, message, media = null, clientId) => {
// //   try {
// //     const snapshot = await db.ref(`clientes/${clientId}/configuracion/contactos`).once('value');
// //     const contactos = snapshot.val();

// //     if (!contactos) {
// //       console.log(`No se encontraron contactos para el cliente ${clientId}`);
// //       return;
// //     }

// //     for (const [phoneNumber, { name, state }] of Object.entries(contactos)) {
// //       if (state === true) {
// //         console.log(`Enviando mensaje a ${name} (${phoneNumber}) del cliente ${clientId}: ${message}`);
// //         const chatId = `${phoneNumber}@c.us`;
// //         if (media) {
// //           await client.sendMessage(chatId, media, { caption: message });
// //         } else {
// //           await client.sendMessage(chatId, message);
// //         }
// //       }
// //     }
// //   } catch (error) {
// //     console.error(`Error al notificar contactos del cliente ${clientId}:`, error.message);
// //   }
// // };

// // Exporta la función para usarla en otros módulos
// module.exports = { monitorVariablesAndTakeSnapshot };



const { db } = require('../config/firebaseConfig');
const { DigestClient } = require('digest-fetch');
const base64 = require('base-64');

const monitorVariablesAndTakeSnapshot = (client) => {
  const clientsRef = db.ref('clientes');

  clientsRef.on('value', async (snapshot) => {
    const clients = snapshot.val();
    if (!clients) {
      console.log('No se encontraron clientes en Firebase');
      return;
    }

    for (const [clientId, clientData] of Object.entries(clients)) {
      const variables = clientData.configuracion?.variables;
      if (!variables) continue;

      let variableChanged = false;
      let changedVariableName = '';
      let changedVarKey = '';

      // Verificar si alguna variable cambió a 'true'
      for (const [varKey, variable] of Object.entries(variables)) {
        const previousState = variable.previousState || false;
        if (variable.state === true && !previousState) {
          variableChanged = true;
          changedVariableName = variable.name;
          changedVarKey = varKey;
          break;
        }
      }

      if (variableChanged) {
          console.log('------------------------------------------------------------');
          console.log(`Cambio detectado en ${clientId}, Variable: ${changedVariableName} (Clave: ${changedVarKey})`);

          // Obtener la IP global e ID del dispositivo
          const ipGlobal = clientData.configuracion.IP_global?.ip;
          const idDispositivo = clientData.configuracion.dispositivo_id;

          if (!ipGlobal || typeof ipGlobal !== 'string') {
              console.error(`IP no encontrada para el cliente ${clientId}`);
              continue;
          }
          if (!idDispositivo || typeof idDispositivo !== 'string') {
              console.error(`ID del dispositivo no encontrado para ${clientId}`);
              continue;
          }

          console.log('IP Global del Dispositivo:', ipGlobal);
          console.log('ID del Dispositivo:', idDispositivo);
          console.log('------------------------------------------------------------');

          // Configuración de la cámara
          const cameraConfig = {
              url: `http://${ipGlobal}/cgi-bin/snapshot.cgi`,
              channel: '1',
              username: 'admin',
              password: 'Royo12345'
          };

          const digestClient = new DigestClient(cameraConfig.username, cameraConfig.password);

        try {
            const fullUrl = `${cameraConfig.url}?channel=${cameraConfig.channel}&subtype=0`;
            console.log('URL de la Cámara:', fullUrl);
            const response = await digestClient.fetch(fullUrl, {
              method: 'GET',
              headers: { 'Accept': 'image/jpeg' }
            });

            if (response.status === 200) {
              console.log('Captura de Imagen OK...!!!');
              const arrayBuffer = await response.arrayBuffer();
              const imageBuffer = Buffer.from(arrayBuffer);
              const imageBase64 = base64.encode(imageBuffer.toString('binary'));

              // Aquí podrías guardar o procesar la imagen (ejemplo comentado)
              console.log(`Snapshot tomado para ${clientId}, Variable: ${changedVariableName}`);
            } else {
              console.error(`Fallo al obtener snapshot para ${clientId}. Código: ${response.status}`);
            }
        } catch (error) {
            console.error(`Error al tomar snapshot para ${clientId}:`, error.message);
        }

        // Actualizar previousState
        await db.ref(`clientes/${clientId}/configuracion/variables/${changedVarKey}/previousState`).set(true);
      } else {
          // Verificar si alguna variable cambió a false para reiniciar previousState
          for (const [varKey, variable] of Object.entries(variables)) {
              if (variable.state === false && variable.previousState === true) {
                  await db.ref(`clientes/${clientId}/configuracion/variables/${varKey}/previousState`).set(false);
              }
          }
      }
    }
  }, (error) => {
    console.error('Error en el listener de clientes:', error.message);
  });
};

module.exports = { monitorVariablesAndTakeSnapshot };