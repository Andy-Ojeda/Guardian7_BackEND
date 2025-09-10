// const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
// const qrcode = require('qrcode-terminal');
// const { db } = require('../config/firebaseConfig');
// const fs = require('fs');
// const axios = require('axios');
// const path = require('path');
// const FormData = require('form-data');

// const { verEstadoAlarma } = require("../functions/verEstadoAlarma");
// const { checkEstadoCambiado } = require("../functions/checkEstadoCambiado");
// const { actualizarEstadoAlarmaPorHorario } = require("../functions/actualizarEstadoAlarmaPorHorario");
// const { actualizarEstadoAlarma } = require("../functions/actualizarEstadoAlarma");
// const { actualizarSirena } = require("../functions/actualizarSirena");
// const { checkEstadoSirena } = require("../functions/checkEstadoSirena");
// const { horaAMinutos } = require("../functions/horaAMinutos");
// const { notifyContacts } = require("../functions/notifyContacts");
// const { monitorVariablesAndTakeSnapshot } = require('../functions/snapshotMonitor');

// // const { handleMessage } = require("../functions/handleMessage"); // Verifica esta ruta   //!!!! -  VER PARA ARREGLAR EN UN FUTURO  -
// const handleMessage = require("../functions/handleMessage").handleMessage;





// //? ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// if (typeof handleMessage !== 'function') {
//     console.error('Error: handleMessage no está definido como función:', handleMessage);
//     throw new Error('handleMessage no es una función válida');
// }

// db.ref('conection_state').once('value', (snapshot) => {
//     const data = snapshot.val();
//     if (data) {
//         console.log('----> Estado de conexión con Firebase: ', data, " <----");
//     } else {
//         console.log('No se encontraron datos en el estado de conexión con Firebase');
//     }
// }, (error) => {
//     console.error('Error al leer datos de conexión con Firebase:', error.message);
// });

// const initWhatsAppClient = () => {
//     console.log('Inicializando cliente de WhatsApp...');

//     // Limpiar el directorio de autenticación local antes de iniciar
//     const authDir = path.join(require('os').homedir(), '.wwebjs_auth');
//     if (fs.existsSync(authDir)) {
//         fs.rmSync(authDir, { recursive: true, force: true });
//         console.log('Directorio de autenticación local limpiado');
//     }

//     const client = new Client({
//         authStrategy: new LocalAuth(),
//         puppeteer: { 
//             headless: true, 
//             args: ['--no-sandbox', '--disable-setuid-sandbox']
//         },
//         takeoverOnConflict: false
//     });

//     client.on('qr', (qr) => {
//         console.log("Escanea este QR para iniciar sesión:");
//         qrcode.generate(qr, { small: true });
//     });

//     client.on('ready', () => {
//         console.log("Cliente WhatsApp listo");
//         monitorVariablesAndTakeSnapshot(client);
//         // setInterval(() => actualizarEstadoAlarmaPorHorario(client), 60 * 1000);

//         // const variablesRef = db.ref('variables');
//         // variablesRef.on('value', async (snapshot) => {
//         //     const variables = snapshot.val();
//         //     if (!variables) return;
//         //     for (const [key, variable] of Object.entries(variables)) {
//         //         if (variable.state === true) {
//         //             console.log(`Estado de ${variable.name} -ACTIVADA-`);
//         //             await notifyContacts(client, `${variable.name} -ACTIVADO-`);
//         //         }
//         //     }
//         // });
//     });

//     client.on('message', handleMessage); // Verifica que handleMessage esté definido

//     client.on('error', (error) => {
//         console.error('Error en el cliente de WhatsApp:', error);
//     });

//     client.on('auth_failure', (msg) => {
//         console.error('Fallo de autenticación:', msg);
//     });

//     client.on('disconnected', (reason) => {
//         console.error('Cliente desconectado. Razón:', reason);
//     });

//     client.initialize().catch((error) => {
//         console.error('Error al inicializar el cliente:', error);
//     });

//     return client;
// };

// module.exports = initWhatsAppClient;





// const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
// const qrcode = require('qrcode-terminal');
// const { db } = require('../config/firebaseConfig');
// const fs = require('fs');
// const axios = require('axios');
// const path = require('path');
// const FormData = require('form-data');

// const { verEstadoAlarma } = require("../functions/verEstadoAlarma");
// const { checkEstadoCambiado } = require("../functions/checkEstadoCambiado");
// const { actualizarEstadoAlarmaPorHorario } = require("../functions/actualizarEstadoAlarmaPorHorario");
// const { actualizarEstadoAlarma } = require("../functions/actualizarEstadoAlarma");
// const { actualizarSirena } = require("../functions/actualizarSirena");
// const { checkEstadoSirena } = require("../functions/checkEstadoSirena");
// const { horaAMinutos } = require("../functions/horaAMinutos");
// const { notifyContacts } = require("../functions/notifyContacts");
// const { monitorVariablesAndTakeSnapshot } = require('../functions/snapshotMonitor');
// const { handleMessage } = require("../functions/handleMessage");

// if (typeof handleMessage !== 'function') {
//     console.error('Error: handleMessage no está definido como función:', handleMessage);
//     throw new Error('handleMessage no es una función válida');
// }

// db.ref('conection_state').once('value', (snapshot) => {
//     const data = snapshot.val();
//     if (data) {
//         console.log('----> Estado de conexión con Firebase: ', data, " <----");
//     } else {
//         console.log('No se encontraron datos en el estado de conexión con Firebase');
//     }
// }, (error) => {
//     console.error('Error al leer datos de conexión con Firebase:', error.message);
// });

// const initWhatsAppClient = () => {
//     console.log('Inicializando cliente de WhatsApp...');

//     // Solo limpiar el directorio de autenticación si es la primera ejecución o se forza
//     const authDir = path.join(require('os').homedir(), '.wwebjs_auth');
//     let isFirstRun = !fs.existsSync(authDir);
//     if (isFirstRun) {
//         if (fs.existsSync(authDir)) {
//             fs.rmSync(authDir, { recursive: true, force: true });
//             console.log('Directorio de autenticación local limpiado');
//         }
//     }

//     const client = new Client({
//         authStrategy: new LocalAuth(),
//         puppeteer: { 
//             headless: true, 
//             args: ['--no-sandbox', '--disable-setuid-sandbox']
//         },
//         takeoverOnConflict: true // Permitir tomar el control si hay conflicto
//     });

//     client.on('qr', (qr) => {
//         console.log("Escanea este QR para iniciar sesión:");
//         qrcode.generate(qr, { small: true });
//     });

//     client.on('ready', async() => {
//         console.log("Cliente WhatsApp listo");
//         monitorVariablesAndTakeSnapshot(client);

//         // Prueba de envío de mensaje
//         const testNumber = '5491162604602@c.us';
//         const testMessage = '¡Prueba de conexión! Este es un mensaje de prueba desde el cliente de WhatsApp.';
//         console.log(`Intentando enviar mensaje de prueba a ${testNumber}: ${testMessage}`);
//         try {
//             await client.sendMessage(testNumber, testMessage);
//             console.log(`Mensaje de prueba enviado exitosamente a ${testNumber}`);
//         } catch (error) {
//             console.error(`Error al enviar mensaje de prueba a ${testNumber}:`, error);
//         }

//         // setInterval(() => actualizarEstadoAlarmaPorHorario(client), 60 * 1000);
//     });

//     client.on('message', handleMessage);

//     client.on('error', (error) => {
//         console.error('Error en el cliente de WhatsApp:', error);
//     });

//     client.on('auth_failure', (msg) => {
//         console.error('Fallo de autenticación:', msg);
//         // Forzar reinicio si falla la autenticación
//         client.initialize();
//     });

//     client.on('disconnected', (reason) => {
//         console.error('Cliente desconectado. Razón:', reason);
//         // Reintentar conexión
//         client.initialize();
//     });

//     client.initialize().catch((error) => {
//         console.error('Error al inicializar el cliente:', error);
//     });

//     return client;
// };

// module.exports = initWhatsAppClient;






// const { Client, LocalAuth } = require('whatsapp-web.js');
// const qrcode = require('qrcode-terminal');
// const { db } = require('../config/firebaseConfig');
// const fs = require('fs');
// const path = require('path');

// const { monitorVariablesAndTakeSnapshot } = require('../functions/snapshotMonitor');
// const { handleMessage } = require("../functions/handleMessage");

// if (typeof handleMessage !== 'function') {
//     console.error('Error: handleMessage no está definido como función:', handleMessage);
//     throw new Error('handleMessage no es una función válida');
// }

// db.ref('conection_state').once('value', (snapshot) => {
//     const data = snapshot.val();
//     if (data) {
//         console.log('----> Estado de conexión con Firebase: ', data, " <----");
//     } else {
//         console.log('No se encontraron datos en el estado de conexión con Firebase');
//     }
// }, (error) => {
//     console.error('Error al leer datos de conexión con Firebase:', error.message);
// });

// const initWhatsAppClient = () => {
//     console.log('Inicializando cliente de WhatsApp...');

//     const authDir = path.join(require('os').homedir(), '.wwebjs_auth');
//     const sessionDir = path.join(authDir, 'session-Guardian7');

//     // Crear directorio si no existe
//     if (!fs.existsSync(authDir)) {
//         try {
//             fs.mkdirSync(authDir, { recursive: true });
//             console.log('Directorio de autenticación creado:', authDir);
//         } catch (err) {
//             console.error('Error al crear el directorio de autenticación:', err.message);
//             return;
//         }
//     }

//     // No limpiar la sesión automáticamente durante reconexión
//     if (!fs.existsSync(sessionDir) && process.env.RESTART !== 'true') {
//         try {
//             fs.rmSync(sessionDir, { recursive: true, force: true });
//             console.log('Directorio de sesión local limpiado:', sessionDir);
//         } catch (err) {
//             console.error('Error al limpiar el directorio de sesión:', err.message);
//         }
//     }

//     const client = new Client({
//         authStrategy: new LocalAuth({
//             clientId: 'Guardian7',
//             dataPath: authDir,
//             backupSyncIntervalMs: 300000 // Guardar sesión cada 5 minutos
//         }),
//         puppeteer: { 
//             headless: true,
//             args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
//             handleSIGINT: false
//         },
//         takeoverOnConflict: false
//     });

//     client.on('qr', (qr) => {
//         console.log("Escanea este QR para iniciar sesión:");
//         qrcode.generate(qr, { small: true });
//     });

//     client.on('authenticated', () => {
//         console.log('Sesión autenticada exitosamente');
//         console.log('Verificando directorio de sesión:', fs.existsSync(sessionDir) ? 'Existe' : 'No existe');
//     });

//     client.on('auth_failure', (msg) => {
//         console.error('Fallo de autenticación:', msg);
//     });

//     client.on('ready', async () => {
//         console.log('Cliente WhatsApp listo');
//         console.log('Verificando directorio de sesión después de ready:', fs.existsSync(sessionDir) ? 'Existe' : 'No existe');
//         monitorVariablesAndTakeSnapshot(client);

//         const testNumber = '5491162604602@c.us';
//         const testMessage = '¡Prueba de conexión! Este es un mensaje de prueba desde el cliente de WhatsApp.';
//         let hasSentTest = false;
//         if (!hasSentTest) {
//             // Añadir retraso de 5 segundos para estabilizar la sesión
//             await new Promise(resolve => setTimeout(resolve, 5000));
//             try {
//                 const chat = await client.getChatById(testNumber);
//                 await chat.sendMessage(testMessage);
//                 console.log(`Mensaje de prueba enviado exitosamente a ${testNumber}`);
//                 hasSentTest = true;
//             } catch (error) {
//                 console.error(`Error al enviar mensaje de prueba a ${testNumber}:`, error.message);
//             }
//         }
//     });

//     client.on('message', handleMessage);

//     client.on('error', (error) => {
//         console.error('Error en el cliente de WhatsApp:', error);
//     });

//     client.on('disconnected', (reason) => {
//         console.error('Cliente desconectado. Razón:', reason);
//         console.log('Verificando directorio de sesión después de desconexión:', fs.existsSync(sessionDir) ? 'Existe' : 'No existe');
//         // Intentar reconectar solo una vez con un retraso
//         if (!process.env.RESTART) {
//             process.env.RESTART = 'true';
//             setTimeout(() => {
//                 console.log('Intentando reconectar...');
//                 initWhatsAppClient(); // Reiniciar cliente
//             }, 10000); // Esperar 10 segundos antes de reconectar
//         }
//     });

//     client.initialize().catch((error) => {
//         console.error('Error al inicializar el cliente:', error);
//     });

//     return client;
// };

// module.exports = initWhatsAppClient;





// // services/whatsappService.js
// const { Client, LocalAuth } = require('whatsapp-web.js');
// const qrcode = require('qrcode-terminal');
// const fs = require('fs');
// const path = require('path');
// const os = require('os');

// const { db } = require('../config/firebaseConfig');
// const { monitorVariablesAndTakeSnapshot } = require('../functions/snapshotMonitor');
// const { handleMessage } = require("../functions/handleMessage");

// // Guardas y checks
// if (typeof handleMessage !== 'function') {
//   console.error('Error: handleMessage no está definido como función:', handleMessage);
//   throw new Error('handleMessage no es una función válida');
// }

// // Log de conexión Firebase (opcional)
// db.ref('conection_state').once('value', (snapshot) => {
//   const data = snapshot.val();
//   if (data) {
//     console.log('----> Estado de conexión con Firebase: ', data, " <----");
//   } else {
//     console.log('No se encontraron datos en el estado de conexión con Firebase');
//   }
// }, (error) => {
//   console.error('Error al leer datos de conexión con Firebase:', error.message);
// });

// // Estado interno (singleton)
// let client = null;
// let isReady = false;
// let initInProgress = false;
// const sendQueue = []; // { to, message }

// function formatJid(numberOrJid) {
//   // Acepta "549..." o "...@c.us"
//   if (/@c\.us$/.test(numberOrJid)) return numberOrJid;
//   const digits = String(numberOrJid).replace(/\D/g, '');
//   return `${digits}@c.us`;
// }

// async function drainQueue() {
//   if (!isReady || !client) return;
//   while (sendQueue.length) {
//     const { to, message } = sendQueue.shift();
//     try {
//       await client.sendMessage(to, message);
//       console.log(`📩 Enviado (cola) a ${to}: ${message}`);
//     } catch (err) {
//       console.error(`❌ Error enviando (cola) a ${to}:`, err?.message || err);
//     }
//   }
// }

// async function sendWhatsApp(toNumberOrJid, message) {
//   const to = formatJid(toNumberOrJid);
//   if (!client) {
//     console.warn('Cliente no inicializado todavía, encolo envío...');
//     sendQueue.push({ to, message });
//     return;
//   }
//   if (!isReady) {
//     console.log('Cliente no ready, encolando...');
//     sendQueue.push({ to, message });
//     return;
//   }
//   try {
//     await client.sendMessage(to, message);
//     console.log(`📩 Enviado a ${to}: ${message}`);
//   } catch (err) {
//     console.error(`❌ Error enviando a ${to}:`, err?.message || err);
//   }
// }

// function initWhatsAppClient() {
//   if (client || initInProgress) return client;
//   initInProgress = true;

//   console.log('Inicializando cliente de WhatsApp...');
//   const authDir = path.join(os.homedir(), '.wwebjs_auth');
//   const sessionId = 'Guardian7';
//   const sessionDir = path.join(authDir, `session-${sessionId}`);

//   // Asegurar carpeta base
//   if (!fs.existsSync(authDir)) {
//     try {
//       fs.mkdirSync(authDir, { recursive: true });
//       console.log('Directorio de autenticación creado:', authDir);
//     } catch (err) {
//       console.error('Error al crear el directorio de autenticación:', err.message);
//       initInProgress = false;
//       return null;
//     }
//   }

//   // Limpieza de sesión SOLO si existe y NO estamos en reinicio controlado
//   if (fs.existsSync(sessionDir) && process.env.RESTART !== 'true') {
//     try {
//       fs.rmSync(sessionDir, { recursive: true, force: true });
//       console.log('Directorio de sesión local limpiado:', sessionDir);
//     } catch (err) {
//       console.error('Error al limpiar el directorio de sesión:', err.message);
//     }
//   }

//   client = new Client({
//     authStrategy: new LocalAuth({
//       clientId: sessionId,
//       dataPath: authDir,
//       backupSyncIntervalMs: 300000, // 5 min
//     }),
//     puppeteer: {
//       headless: true,
//       args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
//     },
//     takeoverOnConflict: true,          // nos adueñamos si hay conflicto
//     takeoverTimeoutMs: 0,              // inmediato
//   });

//   client.on('qr', (qr) => {
//     console.log("Escaneá este QR para iniciar sesión:");
//     qrcode.generate(qr, { small: true });
//   });

//   client.on('authenticated', () => {
//     console.log('✅ Sesión autenticada');
//     console.log('Session dir:', fs.existsSync(sessionDir) ? 'Existe' : 'No existe');
//   });

//   client.on('auth_failure', (msg) => {
//     console.error('❌ Fallo de autenticación:', msg);
//   });

//   client.on('ready', async () => {
//     console.log('✅ Cliente WhatsApp listo');
//     isReady = true;

//     // Arranca el monitor (si depende del cliente)
//     try {
//       monitorVariablesAndTakeSnapshot(client);
//     } catch (e) {
//       console.error('Error iniciando monitor de snapshots:', e?.message || e);
//     }

//     // Mensaje de prueba (tu requisito)
//     try {
//       await sendWhatsApp('5491162604602', 'Hola! El servidor Express ya está conectado 🚀');
//     } catch (e) {
//       console.error('Error enviando mensaje de arranque:', e?.message || e);
//     }

//     // Drenar cola
//     drainQueue();
//   });

//   client.on('message', handleMessage);

//   client.on('change_state', (state) => {
//     console.log('Estado WA:', state);
//   });

//   client.on('disconnected', async (reason) => {
//     console.error('⚠️ Cliente desconectado. Razón:', reason);
//     isReady = false;

//     // Intento de reconexión controlada
//     try {
//       await client.destroy().catch(()=>{});
//     } catch {}
//     client = null;

//     if (process.env.RESTART !== 'true') {
//       process.env.RESTART = 'true';
//       setTimeout(() => {
//         console.log('Reiniciando cliente WA...');
//         initInProgress = false;
//         initWhatsAppClient();
//       }, 10000);
//     } else {
//       // Si ya estábamos en RESTART, dejamos el flag y no hacemos loops infinitos
//       initInProgress = false;
//     }
//   });

//   client.on('error', (error) => {
//     console.error('Error en el cliente de WhatsApp:', error);
//   });

//   client.initialize()
//     .then(() => { initInProgress = false; })
//     .catch((error) => {
//       console.error('Error al inicializar el cliente:', error);
//       initInProgress = false;
//     });

//   return client;
// }

// // Para usar desde otros módulos
// function getClient() {
//   return client;
// }

// module.exports = {
//   initWhatsAppClient,
//   getClient,
//   sendWhatsApp,
// };


const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

function initWhatsAppClient() {
    // const client = new Client({
    //     authStrategy: new LocalAuth({
    //         clientId: 'Guardian7',       // identificador único de sesión
    //         dataPath: './session'        // carpeta donde guarda la sesión
    //     }),
    //     puppeteer: {
    //         headless: true,
    //         args: ['--no-sandbox', '--disable-setuid-sandbox']
    //     }
    // });


        // const client = new Client({
        //     authStrategy: new LocalAuth({
        //         clientId: 'Guardian7'  // solo el ID, sin dataPath
        //     }),
        //     puppeteer: {
        //         headless: true,
        //         args: ['--no-sandbox', '--disable-setuid-sandbox']
        //     }
        // });





        const wwebVersion = '2.2412.54'; 

this.client = new Client({
  authStrategy: new LocalAuth({
    clientId: "client-one"
  }),
  puppeteer: {
    args: ["--no-sandbox"],
  },
  webVersionCache: {
    type: 'remote',
    remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`,
  },
});



    client.on('qr', (qr) => {
        console.log('⚡ Escanea este QR para iniciar sesión:');
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', async () => {
        console.log('✅ Cliente WhatsApp listo');
        try {
            await client.sendMessage(
                '5491162604602@c.us',
                '¡Prueba de conexión! Este es un mensaje de prueba desde el cliente de WhatsApp.'
            );
            console.log('Mensaje inicial enviado correctamente ✅');
        } catch (error) {
            console.error('Error al enviar mensaje inicial:', error.message);
        }
    });

    client.on('authenticated', () => {
        console.log('🔑 Sesión autenticada');
    });

    client.on('auth_failure', (msg) => {
        console.error('❌ Fallo de autenticación:', msg);
    });

    client.on('disconnected', async (reason) => {
        console.log('⚠️ Cliente desconectado:', reason);
        try {
            await client.initialize(); // reintentar automáticamente
        } catch (e) {
            console.error('Error al reintentar conexión:', e);
        }
    });


    client.initialize();
    return client;
}

module.exports = initWhatsAppClient;
