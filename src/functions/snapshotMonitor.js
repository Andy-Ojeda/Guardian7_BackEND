
// const { db } = require('../config/firebaseConfig');
// const { DigestClient } = require('digest-fetch');
// const base64 = require('base-64');

// const monitorVariablesAndTakeSnapshot = (client) => {
//   const clientsRef = db.ref('clientes');

//   clientsRef.on('value', async (snapshot) => {
//     const clients = snapshot.val();
//     if (!clients) {
//       console.log('No se encontraron clientes en Firebase');
//       return;
//     }

//     for (const [clientId, clientData] of Object.entries(clients)) {
//       const variables = clientData.configuracion?.variables;
//       if (!variables) continue;

//       for (const [varKey, variable] of Object.entries(variables)) {
//         const previousState = variable.previousState || false;
//         const currentState = variable.state;

//         // console.log(`Verificando ${clientId}/${varKey}: state=${currentState}, previousState=${previousState}`);

//         if (currentState === true && !previousState) {
//           console.log('------------------------------------------------------------');
//           console.log(`Cambio detectado en ${clientId}, Variable: ${variable.name} (Clave: ${varKey})`);

//           const ipGlobal = clientData.configuracion.IP_global?.ip;
//           if (ipGlobal) {
//             console.log("IP_GLOBAL:: ", ipGlobal);
//           } else {
//             console.log("IP_GLOBAL NO ENCONTRADA!!");
//           }

//           const idDispositivo = clientData.configuracion.dispositivo_id;

//           // Intentar la captura solo si la IP y el ID están presentes
//           if (ipGlobal && typeof ipGlobal === 'string' && idDispositivo && typeof idDispositivo === 'string') {
//             console.log('IP Global del Dispositivo:', ipGlobal);
//             console.log('ID del Dispositivo:', idDispositivo);

//             const cameraConfig = {
//               url: `http://${ipGlobal}/cgi-bin/snapshot.cgi`,
//               channel: '1',
//               username: 'admin',
//               password: 'Royo12345'
//             };

//             const digestClient = new DigestClient(cameraConfig.username, cameraConfig.password);

//             try {
//               const fullUrl = `${cameraConfig.url}?channel=${cameraConfig.channel}&subtype=0`;
//               console.log('URL de la Cámara:', fullUrl);
//               const response = await digestClient.fetch(fullUrl, {
//                 method: 'GET',
//                 headers: { 'Accept': 'image/jpeg' }
//               });

//               if (response.status === 200) {
//                 console.log('Captura de Imagen OK...!!!');
//               } else {
//                 console.error(`Fallo al obtener snapshot para ${clientId}. Código: ${response.status}`);
//               }
//             } catch (error) {
//               console.error(`Error al tomar snapshot para ${clientId}:`, error.message);
//             }
//           } else {
//             console.log(`No se puede realizar captura para ${clientId} por falta de IP o ID`);
//           }

//           // Actualizar previousState siempre después de detectar el cambio
//           console.log(`Intentando actualizar previousState a true para ${clientId}/${varKey}`);
//           await db.ref(`clientes/${clientId}/configuracion/variables/${varKey}/previousState`).set(true);
//           console.log(`previousState actualizado a true para ${clientId}/${varKey}`);
//         }

//         if (currentState === false && previousState === true) {
//           console.log(`Intentando actualizar previousState a false para ${clientId}/${varKey}`);
//           await db.ref(`clientes/${clientId}/configuracion/variables/${varKey}/previousState`).set(false);
//           console.log(`previousState actualizado a false para ${clientId}/${varKey}`);
//         }
//       }
//     }
//   }, (error) => {
//     console.error('Error en el listener de clientes:', error.message);
//   });
// };

// module.exports = { monitorVariablesAndTakeSnapshot };




// const { db } = require('../config/firebaseConfig');
// const { DigestClient } = require('digest-fetch');
// const base64 = require('base-64');
// const { sendAlert } = require('./sendAlert'); // Ajusta la ruta según tu estructura

// const monitorVariablesAndTakeSnapshot = (client) => {
//   const clientsRef = db.ref('clientes');

//   clientsRef.on('value', async (snapshot) => {
//     const clients = snapshot.val();
//     if (!clients) {
//       console.log('No se encontraron clientes en Firebase');
//       return;
//     }

//     for (const [clientId, clientData] of Object.entries(clients)) {
//       const variables = clientData.configuracion?.variables;
//       if (!variables) continue;

//       console.log(`****************************************************************************`);
//       for (const [varKey, variable] of Object.entries(variables)) {
//         const previousState = variable.previousState || false;
//         const currentState = variable.state;


//         console.log(`Verificando ${clientId}/${varKey}: state=${currentState}, previousState=${previousState}`);
        
        
//         if (currentState === true && !previousState) {
//           console.log('------------------------------------------------------------');
//           console.log(`Cambio detectado en ${clientId}, Variable: ${variable.name} (Clave: ${varKey})`);
          
//           const ipGlobal = clientData.configuracion.IP_global?.ip;
//           if (ipGlobal) {
//             console.log("IP_GLOBAL:: ", ipGlobal);
//           } else {
//             console.log("IP_GLOBAL NO ENCONTRADA!!");
//           }
          
//           const idDispositivo = clientData.configuracion.dispositivo_id;
          
//           // Intentar la captura solo si la IP y el ID están presentes
//           if (ipGlobal && typeof ipGlobal === 'string' && idDispositivo && typeof idDispositivo === 'string') {
//             console.log('IP Global del Dispositivo:', ipGlobal);
//             console.log('ID del Dispositivo:', idDispositivo);
            
//             const cameraConfig = {
//               url: `http://${ipGlobal}/cgi-bin/snapshot.cgi`,
//               channel: '1',
//               username: 'admin',
//               password: 'Royo12345'
//             };
            
//             const digestClient = new DigestClient(cameraConfig.username, cameraConfig.password);
            
//             try {
//               const fullUrl = `${cameraConfig.url}?channel=${cameraConfig.channel}&subtype=0`;
//               console.log('URL de la Cámara:', fullUrl);
//               const response = await digestClient.fetch(fullUrl, {
//                 method: 'GET',
//                 headers: { 'Accept': 'image/jpeg' }
//               });
              
//               if (response.status === 200) {
//                 console.log('Captura de Imagen OK...!!!');
//               } else {
//                 console.error(`Fallo al obtener snapshot para ${clientId}. Código: ${response.status}`);
//               }
//             } catch (error) {
//               console.error(`Error al tomar snapshot para ${clientId}:`, error.message);
//             }
//           } else {
//             console.log(`No se puede realizar captura para ${clientId} por falta de IP o ID`);
//           }
//           // Enviar alerta a contactos
//           await sendAlert(client, clientId, varKey, variable.name);
          
//           // Actualizar previousState
//           console.log(`Intentando actualizar previousState a true para ${clientId}/${varKey}`);
//           await db.ref(`clientes/${clientId}/configuracion/variables/${varKey}/previousState`).set(true);
//           console.log(`previousState actualizado a true para ${clientId}/${varKey}`);
//         }
        
        
        
//         if (currentState === false && previousState === true) {
//           console.log(`Intentando actualizar previousState a false para ${clientId}/${varKey}`);
//           await db.ref(`clientes/${clientId}/configuracion/variables/${varKey}/previousState`).set(false);
//           console.log(`previousState actualizado a false para ${clientId}/${varKey}`);
//         }
//       }


//       console.log(`****************************************************************************`);
    
    
//     }
//   }, (error) => {
//     console.error('Error en el listener de clientes:', error.message);
//   });
// };

// module.exports = { monitorVariablesAndTakeSnapshot };



// const { db } = require('../config/firebaseConfig');
// const { DigestClient } = require('digest-fetch');
// const base64 = require('base-64');
// const { sendAlert } = require('./sendAlert');

// const monitorVariablesAndTakeSnapshot = (client) => {
//   const clientsRef = db.ref('clientes');

//   clientsRef.on('value', async (snapshot) => {
//     const clients = snapshot.val();
//     if (!clients) {
//       console.log('No se encontraron clientes en Firebase');
//       return;
//     }

//     for (const [clientId, clientData] of Object.entries(clients)) {
//       const variables = clientData.configuracion?.variables;
//       if (!variables) continue;

//       console.log(`****************************************************************************`);
//       for (const [varKey, variable] of Object.entries(variables)) {
//         const previousState = variable.previousState || false;
//         const currentState = variable.state;

//         console.log(`Verificando ${clientId}/${varKey}: state=${currentState}, previousState=${previousState}`);

//         if (currentState === true && !previousState) {
//           console.log('------------------------------------------------------------');
//           console.log(`Cambio detectado en ${clientId}, Variable: ${variable.name} (Clave: ${varKey})`);

//           const ipGlobal = clientData.configuracion.IP_global?.ip;
//           if (ipGlobal) {
//             console.log("IP_GLOBAL:: ", ipGlobal);
//           } else {
//             console.log("IP_GLOBAL NO ENCONTRADA!!");
//           }

//           const idDispositivo = clientData.configuracion.dispositivo_id;

//           if (ipGlobal && typeof ipGlobal === 'string' && idDispositivo && typeof idDispositivo === 'string') {
//             console.log('IP Global del Dispositivo:', ipGlobal);
//             console.log('ID del Dispositivo:', idDispositivo);

//             const cameraConfig = {
//               url: `http://${ipGlobal}/cgi-bin/snapshot.cgi`,
//               channel: '1',
//               username: 'admin',
//               password: 'Royo12345'
//             };

//             const digestClient = new DigestClient(cameraConfig.username, cameraConfig.password);

//             try {
//               const fullUrl = `${cameraConfig.url}?channel=${cameraConfig.channel}&subtype=0`;
//               console.log('URL de la Cámara:', fullUrl);
//               const response = await digestClient.fetch(fullUrl, {
//                 method: 'GET',
//                 headers: { 'Accept': 'image/jpeg' }
//               });

//               if (response.status === 200) {
//                 console.log('Captura de Imagen OK...!!!');
//               } else {
//                 console.error(`Fallo al obtener snapshot para ${clientId}. Código: ${response.status}`);
//               }
//             } catch (error) {
//               console.error(`Error al tomar snapshot para ${clientId}:`, error.message);
//             }
//           } else {
//             console.log(`No se puede realizar captura para ${clientId} por falta de IP o ID`);
//           }

//           // Enviar alerta a contactos

//           console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
//           // console.log("CLIENTE::: ", client);
//           console.log("CLIENTE ID::: ", clientId);
//           console.log("VAR KEY::: ", varKey);
//           console.log("VARIABLE NAME::: ", variable.name);
//           console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
//           await sendAlert(client, clientId, varKey, variable.name);

//           // Actualizar previousState solo si el cambio es nuevo
//           if (!previousState) {
//             console.log(`Intentando actualizar previousState a true para ${clientId}/${varKey}`);
//             await db.ref(`clientes/${clientId}/configuracion/variables/${varKey}/previousState`).set(true);
//             console.log(`previousState actualizado a true para ${clientId}/${varKey}`);
//           }
//         }

//         if (currentState === false && previousState === true) {
//           console.log(`Intentando actualizar previousState a false para ${clientId}/${varKey}`);
//           await db.ref(`clientes/${clientId}/configuracion/variables/${varKey}/previousState`).set(false);
//           console.log(`previousState actualizado a false para ${clientId}/${varKey}`);
//         }
//       }
//       console.log(`****************************************************************************`);
//     }
//   }, (error) => {
//     console.error('Error en el listener de clientes:', error.message);
//   });
// };

// module.exports = { monitorVariablesAndTakeSnapshot };





// functions/snapshotMonitor.js
const { db } = require('../config/firebaseConfig');
const { DigestClient } = require('digest-fetch');
const { sendAlert } = require('./sendAlert');

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

      // console.log(`****************************************************************************`);
      for (const [varKey, variable] of Object.entries(variables)) {
        const previousState = variable.previousState || false;
        const currentState = variable.state;

        // console.log(`Verificando ${clientId}/${varKey}: state=${currentState}, previousState=${previousState}`);

        if (currentState === true && !previousState) {
          console.log('------------------------------------------------------------');
          console.log(`Cambio detectado en ${clientId}, Variable: ${variable.name} (Clave: ${varKey})`);

          const ipGlobal = clientData.configuracion.IP_global?.ip;
          const idDispositivo = clientData.configuracion.dispositivo_id;

          if (ipGlobal && typeof ipGlobal === 'string' && idDispositivo && typeof idDispositivo === 'string') {
            console.log('IP Global del Dispositivo:', ipGlobal);
            console.log('ID del Dispositivo:', idDispositivo);

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
                // Si querés, acá podrías guardar el buffer: await response.arrayBuffer()
              } else {
                console.error(`Fallo al obtener snapshot para ${clientId}. Código: ${response.status}`);
              }
            } catch (error) {
              console.error(`Error al tomar snapshot para ${clientId}:`, error.message);
            }
          } else {
            console.log(`No se puede realizar captura para ${clientId} por falta de IP o ID`);
          }

          await sendAlert(client, clientId, varKey, variable.name);

          // Marcar previousState -> true
          if (!previousState) {
            console.log(`Intentando actualizar previousState a true para ${clientId}/${varKey}`);
            await db.ref(`clientes/${clientId}/configuracion/variables/${varKey}/previousState`).set(true);
            console.log(`previousState actualizado a true para ${clientId}/${varKey}`);
          }
        }

        if (currentState === false && previousState === true) {
          console.log(`Intentando actualizar previousState a false para ${clientId}/${varKey}`);
          await db.ref(`clientes/${clientId}/configuracion/variables/${varKey}/previousState`).set(false);
          console.log(`previousState actualizado a false para ${clientId}/${varKey}`);
        }
      }
      // console.log(`****************************************************************************`);
    }
  }, (error) => {
    console.error('Error en el listener de clientes:', error.message);
  });
};

module.exports = { monitorVariablesAndTakeSnapshot };
