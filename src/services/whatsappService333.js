const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const firebase = require('firebase-admin');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const FormData = require('form-data');

// Inicializar Firebase con tu service account
const serviceAccount = require('../../firebaseConfig.json'); // Tu firebaseConfig.js
firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: "https://bot-andy-copia-default-rtdb.firebaseio.com",
    storageBucket: "bot-andy-copia.appspot.com"
});
const db = firebase.database();

//! =======================================   T I E M P O   ==================================================
const horaAMinutos = (horaStr) => {
    const [horas, minutos] = horaStr.split(':').map(Number);
    if (horas < 0 || horas > 23 || minutos < 0 || minutos > 59) return null;
    return horas * 60 + minutos;
};

const minutosDesdeMedianoche = () => {
    const ahora = new Date();
    return ahora.getHours() * 60 + ahora.getMinutes();
};
//! ===========================================================================================================

//? =======================================  V A R I A B L E S  ==============================================
const hayVariablesActivas = async () => {
    const snapshot = await db.ref('variables').once('value');
    const variables = snapshot.val();
    if (!variables) return false;
    return Object.values(variables).some(v => v.state === true);
};
//? ==========================================================================================================

//! ====================================  E S T A D O   D E   A L A R M A  ==========================================
const verEstadoAlarma = async (msg) => {
    const variablesDB = await db.ref(`variables/`).once('value');
    const estadoAlarmaDB = await db.ref(`estado_alarma/`).once('value');
    const horariosAlarmaDB = await db.ref('horarios_alarma').once('value');
    const alertaDB = await db.ref('alerta').once('value');

    let estadoAlarma2 = estadoAlarmaDB.val() === true ? "Encendida" : "Apagada";
    let variable1State = variablesDB.val().variable1.state === true ? "Abierta" : "Cerrada";
    let variable2State = variablesDB.val().variable2.state === true ? "Abierta" : "Cerrada";
    let variable3State = variablesDB.val().variable3.state === true ? "Abierta" : "Cerrada";
    let alertaState = alertaDB.val() === true ? "Activa" : "Inactiva";

    const horarios = horariosAlarmaDB.val() || { inicio: "No seteado", fin: "No seteado", state: false };
    const mensajeVAR =
        variablesDB.val().variable1.name + ": " + "*" + variable1State + "*" + "\n" +
        variablesDB.val().variable2.name + ": " + "*" + variable2State + "*" + "\n" +
        variablesDB.val().variable3.name + ": " + "*" + variable3State + "*" + "\n" +
        "------------------------------" + "\n" +
        "Horario de activación:" + "\n" +
        "Inicio: " + "*" + horarios.inicio + "*" + "\n" +
        "Fin: " + "*" + horarios.fin + "*" + "\n" +
        "Estado: " + "*" + (horarios.state ? "Activado" : "Desactivado") + "*" + "\n" +
        "------------------------------" + "\n" +
        "Estado de Alarma: " + "*" + estadoAlarma2 + "*" + "\n" +
        "Estado de Alerta: " + "*" + alertaState + "*";
    await msg.reply(mensajeVAR);
};

const checkEstadoCambiado = async (msg, estadoNuevo, estadoAnterior) => {
    try {
        const estadoAlarmaDB = await db.ref(`estado_alarma/`).once('value');
        const estadoActual = estadoAlarmaDB.val();

        console.log(`estadoAnterior: ${estadoAnterior}`);
        console.log(`estadoNuevo: ${estadoNuevo}`);
        console.log(`estadoAlarma: ${estadoActual}`);

        if (estadoActual === null) {
            await msg.reply("Error: No se encontró el estado de la alarma en la base de datos.");
            return;
        }

        const estadoActualTexto = estadoActual ? "Encendida" : "Apagada";
        if (estadoActual === estadoNuevo) {
            if (estadoAnterior !== estadoNuevo) {
                await msg.reply(`La alarma se ${estadoNuevo ? "encendió" : "apagó"} correctamente. Ahora está ${estadoActualTexto}.`);
            } else {
                await msg.reply(`La alarma ya estaba ${estadoActualTexto}.`);
            }
        } else {
            await msg.reply(`No se pudo cambiar el estado. La alarma sigue ${estadoActualTexto}.`);
        }
    } catch (error) {
        console.error("Error en checkEstadoCambiado:", error);
        await msg.reply("Ocurrió un error al verificar el estado de la alarma.");
    }
};

const actualizarEstadoAlarmaPorHorario = async (client) => {
    try {
        const snapshotHorarios = await db.ref('horarios_alarma').once('value');
        const horarios = snapshotHorarios.val();

        if (!horarios || !horarios.inicio || !horarios.fin || !horarios.state) {
            console.log('Horarios no configurados o desactivados.');
            return;
        }

        if (horarios.state !== true) {
            console.log('Horario configurado pero desactivado.');
            return;
        }

        const inicioMinutos = horaAMinutos(horarios.inicio);
        const finMinutos = horaAMinutos(horarios.fin);
        const ahoraMinutos = minutosDesdeMedianoche();

        if (inicioMinutos === null || finMinutos === null) {
            console.log('Horarios inválidos en Firebase.');
            return;
        }

        let enHorario;
        if (inicioMinutos < finMinutos) {
            enHorario = ahoraMinutos >= inicioMinutos && ahoraMinutos <= finMinutos;
        } else {
            enHorario = ahoraMinutos >= inicioMinutos || ahoraMinutos <= finMinutos;
        }

        const snapshotEstado = await db.ref('estado_alarma').once('value');
        const estadoAnterior = snapshotEstado.val();
        const snapshotAlerta = await db.ref('alerta').once('value');
        const alertaAnterior = snapshotAlerta.val();

        let nuevoEstadoAlarma = estadoAnterior;
        let nuevoEstadoAlerta = alertaAnterior;

        if (enHorario) {
            const variablesActivas = await hayVariablesActivas();
            if (variablesActivas && ahoraMinutos === inicioMinutos) {
                nuevoEstadoAlarma = false;
                nuevoEstadoAlerta = true;
            } else if (!variablesActivas) {
                nuevoEstadoAlarma = true;
                nuevoEstadoAlerta = false;
            }
        } else {
            nuevoEstadoAlarma = false;
            nuevoEstadoAlerta = false;
        }

        await db.ref('estado_alarma').set(nuevoEstadoAlarma);
        await db.ref('alerta').set(nuevoEstadoAlerta);
        console.log(`estado_alarma: ${nuevoEstadoAlarma}, alerta: ${nuevoEstadoAlerta} a las ${new Date().toLocaleTimeString()}`);

        if (estadoAnterior !== nuevoEstadoAlarma) {
            const mensaje = nuevoEstadoAlarma
                ? `Alarma *Activada* automáticamente a las ${horarios.inicio}.`
                : `Alarma *Desactivada* automáticamente a las ${horarios.fin}.`;
            await notifyContacts(client, mensaje);
        }

        if (alertaAnterior !== nuevoEstadoAlerta && nuevoEstadoAlerta === true) {
            await notifyContacts(client, `⚠️ *Alerta*: No se pudo activar la alarma a las ${horarios.inicio} porque hay sensores activos.`);
        }
    } catch (error) {
        console.error('Error al actualizar estado_alarma por horario:', error);
    }
};

const actualizarEstadoAlarma = async (estado) => {
    try {
        await db.ref('estado_alarma').set(estado);
        if (!estado) {
            await db.ref('sirena').set(estado);
        }
        console.log(`Estado de alarma actualizado a: ${estado ? 'Encendido' : 'Apagado'}`);
    } catch (error) {
        console.error('Error al actualizar el estado de alarma:', error.message);
    }
};

//! ===============================================================================================================

//? =============================================  S I R E N A  ===================================================
const actualizarSirena = async (estado) => {
    try {
        await db.ref('sirena').set(estado);
        console.log(`Estado de Sirena: ${estado ? 'Encendido' : 'Apagado'}`);
    } catch (error) {
        console.error('Error al actualizar el estado de alarma:', error.message);
    }
};

const checkEstadoSirena = async (msg, estadoNuevo, estadoAnteriorSirena) => {
    try {
        const estadoSirena = await db.ref(`sirena/`).once('value');
        const estadoActualSirena = estadoSirena.val();

        console.log(`EstadoAnterior: ${estadoAnteriorSirena}`);
        console.log(`EstadoNuevo: ${estadoNuevo}`);
        console.log(`EstadoAlarma: ${estadoActualSirena}`);

        if (estadoActualSirena === null) {
            await msg.reply("Error: No se encontró el estado de la Sirena en la base de datos.");
            return;
        }

        const estadoActualTexto = estadoActualSirena ? "Encendida" : "Apagada";
        if (estadoActualSirena === estadoNuevo) {
            if (estadoAnteriorSirena !== estadoNuevo) {
                await msg.reply(`La Sirena se ${estadoNuevo ? "encendió" : "apagó"} correctamente. Ahora está ${estadoActualTexto}.`);
            } else {
                await msg.reply(`La Sirena ya estaba ${estadoActualTexto}.`);
            }
        } else {
            await msg.reply(`No se pudo cambiar el estado. La Sirena sigue ${estadoActualTexto}.`);
        }
    } catch (error) {
        console.error("Error en checkEstadoSirena:", error);
        await msg.reply("Ocurrió un error al verificar el estado de la Sirena.");
    }
};
//? ===============================================================================================================

// Envío de mensaje a números registrados
const notifyContacts = async (client, message, media = null) => {
    try {
        const snapshot = await db.ref('contactos').once('value');
        const contactos = snapshot.val();

        if (!contactos) {
            console.log("No se encontraron contactos en la base de datos.");
            return [];
        }

        for (const [phoneNumber, { name, state }] of Object.entries(contactos)) {
            if (state === true) {
                console.log(`Enviando mensaje a ${name} (-${phoneNumber}-): ${message}`);
                const chatId = `${phoneNumber}@c.us`;
                if (media) {
                    await client.sendMessage(chatId, media, { caption: message });
                } else {
                    await client.sendMessage(chatId, message);
                }
            }
        }
    } catch (error) {
        console.error('Error al notificar a los contactos:', error.message);
    }
};

//* ------------------------------------------------------------------------------------------------------
//* ------------------------------------------------------------------------------------------------------
//* ------------------------------------------------------------------------------------------------------

const initWhatsAppClient = () => {
    const client = new Client({
        authStrategy: new LocalAuth(),
    });

    client.on('qr', (qr) => {
        console.log("Escanea este QR para iniciar sesión:");
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.log("Cliente WhatsApp listo");
        setInterval(() => actualizarEstadoAlarmaPorHorario(client), 60 * 1000);

        // Escucha en tiempo real el estado de las Variables
        const variablesRef = db.ref('variables');
        variablesRef.on('value', async (snapshot) => {
            const variables = snapshot.val();
            if (!variables) return;

            for (const [key, variable] of Object.entries(variables)) {
                if (variable.state === true) {
                    console.log(`Estado de ${variable.name} -ACTIVADA-`);
                    await notifyContacts(client, `${variable.name} -ACTIVADO-`);
                }
            }
        });

        // Escucha en tiempo real los snapshots en Storage
        const snapshotsRef = db.ref('snapshots');
        snapshotsRef.on('child_added', async (snapshot) => {
            const key = snapshot.key;
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/bot-andy-copia.appspot.com/o/snapshots%2F${key}?alt=media`;
            const media = await MessageMedia.fromUrl(imageUrl);
            await notifyContacts(client, `Captura de ${key.split('_')[0]} activada`, media);
            snapshotsRef.child(key).remove(); // Opcional: limpia la referencia
        });
    });

    client.on('message', async (msg) => {
        const phoneNumber = msg.from.split('@')[0];

        let name;

        if (phoneNumber !== "status") {
            try {
                const snapshot = await db.ref(`contactos/${phoneNumber}`).once('value');
                const estadoAlarmaDB = await db.ref(`estado_alarma/`).once('value');
                const estadoSirena = await db.ref(`sirena/`).once('value');

                if (snapshot.exists()) {
                    ({ name, state } = snapshot.val());

                    console.log(`Mensaje recibido de ${name} (-${phoneNumber}-) ${state}`);

                    if (state) {
                        let msgText = "";
                        let transcription = "";
                        let intent = "";

                        msgOptions = `Hola ${name}!! Tus opciones:\n- ✔ (Alarma-on) Enciende Alarma -\n- ❌(Alarma-off) Apaga Alarma -\n- 👁‍🗨(Alarma-ver) Ver Sensores -\n- 🔊(Sirena-on) Sonar sirena -\n- 🔈(Sirena-off) Apagar sirena -\n- ⏰ (Configurar alarma HH:MM-HH:MM) Define horarios -\n- ⏱ (Horario-off) Desactiva horarios -`;

                        if (msg.hasMedia || msg.type === 'audio') {
                            console.log(`Mensaje de AUDIO`);
                            const media = await msg.downloadMedia();
                            const audioDir = 'C:/audioPythonTemp';
                            const audioPath = path.join(audioDir, `audio_${Date.now()}.ogg`);

                            if (!fs.existsSync(audioDir)) {
                                fs.mkdirSync(audioDir, { recursive: true });
                            }

                            fs.writeFileSync(audioPath, media.data, { encoding: 'base64' });

                            const formData = new FormData();
                            formData.append('audio', fs.createReadStream(audioPath));

                            try {
                                const response = await axios.post('http://127.0.0.1:5000/transcribe-audio', formData, {
                                    headers: { 'Content-Type': 'multipart/form-data' },
                                });

                                transcription = response.data.transcription;
                                intent = response.data.intent;

                                console.log('Transcripción:', transcription);
                                console.log('Intención:', intent);
                            } catch (error) {
                                console.error('Error al transcribir:', error);
                                msg.reply('No pude transcribir el audio.');
                            }

                            fs.unlinkSync(audioPath);
                        } else {
                            msgText = msg.body.toLowerCase();
                            console.log(`Mensaje de TEXTO: <<<< ${msgText} >>>>`);
                        }

                        const estadoAnterior = estadoAlarmaDB.val();
                        const estadoAnteriorSirena = estadoSirena.val();

                        if (msgText.startsWith('configurar alarma')) {
                            const match = msgText.match(/configurar alarma (\d{2}:\d{2})-(\d{2}:\d{2})/);
                            if (match) {
                                const [, inicio, fin] = match;
                                const inicioMinutos = horaAMinutos(inicio);
                                const finMinutos = horaAMinutos(fin);

                                if (inicioMinutos === null || finMinutos === null) {
                                    await msg.reply('Hora inválida. Usa formato HH:MM con horas (00-23) y minutos (00-59).');
                                } else {
                                    try {
                                        await db.ref('horarios_alarma').set({ inicio, fin, state: true });
                                        await msg.reply(`Horarios configurados y activados: Alarma de ${inicio} a ${fin}.`);
                                        console.log(`Horarios configurados: ${inicio}-${fin}, state: true`);
                                    } catch (error) {
                                        await msg.reply('Error al configurar los horarios.');
                                        console.error('Error al configurar horarios:', error);
                                    }
                                }
                            } else {
                                await msg.reply('Formato incorrecto. Usa: "configurar alarma HH:MM-HH:MM" (ej. "configurar alarma 23:00-05:00")');
                            }
                        } else if (msgText === 'horario-off') {
                            try {
                                await db.ref('horarios_alarma/state').set(false);
                                await msg.reply('Horarios desactivados. La alarma no se activará automáticamente.');
                                console.log('Horarios desactivados.');
                            } catch (error) {
                                await msg.reply('Error al desactivar los horarios.');
                                console.error('Error al desactivar horarios:', error);
                            }
                        } else if (intent === "activar_alarma" || msgText === "alarma-on") {
                            await actualizarEstadoAlarma(true);
                            await msg.reply("Encendiendo Alarma");
                            await checkEstadoCambiado(msg, true, estadoAnterior);
                        } else if (intent === "desactivar_alarma" || msgText === "alarma-off") {
                            await actualizarEstadoAlarma(false);
                            await msg.reply("Apagando Alarma");
                            await checkEstadoCambiado(msg, false, estadoAnterior);
                        } else if (intent === "estado_alarma" || msgText === "alarma-ver") {
                            await verEstadoAlarma(msg);
                        } else if (intent === "saludo" || msgText === "hermes") {
                            await msg.reply(msgOptions);
                        } else if (intent === "sirena_on" || msgText === "sirena-on") {
                            await actualizarSirena(true);
                            await msg.reply("Encendiendo SIRENA");
                            await checkEstadoSirena(msg, true, estadoAnteriorSirena);
                        } else if (intent === "sirena_off" || msgText === "sirena-off") {
                            await actualizarSirena(false);
                            await msg.reply("Apagando SIRENA");
                            await checkEstadoSirena(msg, false, estadoAnteriorSirena);
                        } else {
                            await msg.reply(`No entendí bien: "${transcription || msgText}". ¿Puedes reformularlo?`);
                        }

                        console.log(`Respuesta enviada a ${name}`);
                    } else {
                        console.log(`El usuario ${name} tiene el estado en false.`);
                    }
                } else {
                    console.log(`El número ${phoneNumber} no está registrado en la base de datos.`);
                }

                console.log(`--------------------------------------------------------------------`);
            } catch (error) {
                console.error('Error al procesar el mensaje:', error.message);
            }
        }
    });

    client.initialize();

    return client;
};

module.exports = initWhatsAppClient;






// const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
// const qrcode = require('qrcode-terminal');
// const db = require("../database");
// const fs = require("fs");
// const axios = require("axios");
// const path = require('path');
// const FormData = require('form-data');


// //! =======================================   T I E M P O   ==================================================
// // Función para convertir hora (HH:MM) a minutos desde medianoche
// const horaAMinutos = (horaStr) => {
//   const [horas, minutos] = horaStr.split(':').map(Number);
//   if (horas < 0 || horas > 23 || minutos < 0 || minutos > 59) return null; // Validación
//   return horas * 60 + minutos;
// };

// // Función para obtener minutos actuales
// const minutosDesdeMedianoche = () => {
//   const ahora = new Date();
//   return ahora.getHours() * 60 + ahora.getMinutes();
// };
// //! ===========================================================================================================




// //? =======================================  V A R I A B L E S  ==============================================
// // Función para chequear el estado de las variables
// const hayVariablesActivas = async () => {
//   const snapshot = await db.ref('variables').once('value');
//   const variables = snapshot.val();
//   if (!variables) return false;
  
//   return Object.values(variables).some(v => v.state === true);
// };
// //? ==========================================================================================================



// //! ====================================  E S T A D O   D E   A L A R M A  ==========================================
// // Leo estado de las variables de la DB y envío por mensaje
// const verEstadoAlarma = async (msg) => {
//   const variablesDB = await db.ref(`variables/`).once('value');
//   const estadoAlarmaDB = await db.ref(`estado_alarma/`).once('value');
//   const horariosAlarmaDB = await db.ref('horarios_alarma').once('value');
//   const alertaDB = await db.ref('alerta').once('value');
  
//   let estadoAlarma2 = estadoAlarmaDB.val() === true ? "Encendida" : "Apagada";
//   let variable1State = variablesDB.val().variable1.state === true ? "Abierta" : "Cerrada";
//   let variable2State = variablesDB.val().variable2.state === true ? "Abierta" : "Cerrada";
//   let variable3State = variablesDB.val().variable3.state === true ? "Abierta" : "Cerrada";
//   let alertaState = alertaDB.val() === true ? "Activa" : "Inactiva";

//   const horarios = horariosAlarmaDB.val() || { inicio: "No seteado", fin: "No seteado", state: false };
//   const mensajeVAR = 
//     variablesDB.val().variable1.name + ": " + "*" + variable1State + "*" + "\n" +
//     variablesDB.val().variable2.name + ": " + "*" + variable2State + "*" + "\n" +
//     variablesDB.val().variable3.name + ": " + "*" + variable3State + "*" + "\n" +
//     "------------------------------" + "\n" +
//     "Horario de activación:" + "\n" +
//     "Inicio: " + "*" + horarios.inicio + "*" + "\n" +
//     "Fin: " + "*" + horarios.fin + "*" + "\n" +
//     "Estado: " + "*" + (horarios.state ? "Activado" : "Desactivado") + "*" + "\n" +
//     "------------------------------" + "\n" +
//     "Estado de Alarma: " + "*" + estadoAlarma2 + "*" + "\n" +
//     "Estado de Alerta: " + "*" + alertaState + "*";
//   await msg.reply(mensajeVAR);
// };



// const checkEstadoCambiado = async (msg, estadoNuevo, estadoAnterior) => {
//   try {
//     const estadoAlarmaDB = await db.ref(`estado_alarma/`).once('value');
//     const estadoActual = estadoAlarmaDB.val();

//     console.log(`estadoAnterior: ${estadoAnterior}`);
//     console.log(`estadoNuevo: ${estadoNuevo}`);
//     console.log(`estadoAlarma: ${estadoActual}`);

//     if (estadoActual === null) {
//       await msg.reply("Error: No se encontró el estado de la alarma en la base de datos.");
//       return;
//     }

//     const estadoActualTexto = estadoActual ? "Encendida" : "Apagada";
//     if (estadoActual === estadoNuevo) {
//       if (estadoAnterior !== estadoNuevo) {
//         await msg.reply(`La alarma se ${estadoNuevo ? "encendió" : "apagó"} correctamente. Ahora está ${estadoActualTexto}.`);
//       } else {
//         await msg.reply(`La alarma ya estaba ${estadoActualTexto}.`);
//       }
//     } else {
//       await msg.reply(`No se pudo cambiar el estado. La alarma sigue ${estadoActualTexto}.`);
//     }
//   } catch (error) {
//     console.error("Error en checkEstadoCambiado:", error);
//     await msg.reply("Ocurrió un error al verificar el estado de la alarma.");
//   }
// };




// // Función para chequear y actualizar estado_alarma según horarios
// const actualizarEstadoAlarmaPorHorario = async (client) => {
//   try {
//     const snapshotHorarios = await db.ref('horarios_alarma').once('value');
//     const horarios = snapshotHorarios.val();

//     if (!horarios || !horarios.inicio || !horarios.fin || !horarios.state) {
//       console.log('Horarios no configurados o desactivados.');
//       return;
//     }

//     if (horarios.state !== true) {
//       console.log('Horario configurado pero desactivado.');
//       return;
//     }

//     const inicioMinutos = horaAMinutos(horarios.inicio);
//     const finMinutos = horaAMinutos(horarios.fin);
//     const ahoraMinutos = minutosDesdeMedianoche();

//     if (inicioMinutos === null || finMinutos === null) {
//       console.log('Horarios inválidos en Firebase.');
//       return;
//     }

//     let enHorario;
//     if (inicioMinutos < finMinutos) {
//       enHorario = ahoraMinutos >= inicioMinutos && ahoraMinutos <= finMinutos;
//     } else {
//       enHorario = ahoraMinutos >= inicioMinutos || ahoraMinutos <= finMinutos;
//     }

//     const snapshotEstado = await db.ref('estado_alarma').once('value');
//     const estadoAnterior = snapshotEstado.val();
//     const snapshotAlerta = await db.ref('alerta').once('value');
//     const alertaAnterior = snapshotAlerta.val();

//     let nuevoEstadoAlarma = estadoAnterior;
//     let nuevoEstadoAlerta = alertaAnterior;

//     if (enHorario) {
//       const variablesActivas = await hayVariablesActivas();
//       if (variablesActivas && ahoraMinutos === inicioMinutos) {
//         // Si hay variables en true al inicio del horario, no activar alarma y poner alerta
//         nuevoEstadoAlarma = false;
//         nuevoEstadoAlerta = true;
//       } else if (!variablesActivas) {
//         // Si no hay variables activas, activar alarma y desactivar alerta
//         nuevoEstadoAlarma = true;
//         nuevoEstadoAlerta = false;
//       }
//     } else {
//       // Fuera del horario, desactivar alarma y alerta
//       nuevoEstadoAlarma = false;
//       nuevoEstadoAlerta = false;
//     }

//     await db.ref('estado_alarma').set(nuevoEstadoAlarma);
//     await db.ref('alerta').set(nuevoEstadoAlerta);
//     console.log(`estado_alarma: ${nuevoEstadoAlarma}, alerta: ${nuevoEstadoAlerta} a las ${new Date().toLocaleTimeString()}`);

//     if (estadoAnterior !== nuevoEstadoAlarma) {
//       const mensaje = nuevoEstadoAlarma
//         ? `Alarma *Activada* automáticamente a las ${horarios.inicio}.`
//         : `Alarma *Desactivada* automáticamente a las ${horarios.fin}.`;
//       await notifyContacts(client, mensaje);
//     }

//     if (alertaAnterior !== nuevoEstadoAlerta && nuevoEstadoAlerta === true) {
//       await notifyContacts(client, `⚠️ *Alerta*: No se pudo activar la alarma a las ${horarios.inicio} porque hay sensores activos.`);
//     }
//   } catch (error) {
//     console.error('Error al actualizar estado_alarma por horario:', error);
//   }
// };


// // Actualizo el estado de alarma
// const actualizarEstadoAlarma = async (estado) => {
//   try {
//     await db.ref('estado_alarma').set(estado);
//     if (!estado) {
//       await db.ref('sirena').set(estado);
//     }
//     console.log(`Estado de alarma actualizado a: ${estado ? 'Encendido' : 'Apagado'}`);
//   } catch (error) {
//     console.error('Error al actualizar el estado de alarma:', error.message);
//   }
// };

// //! ===============================================================================================================


// //? =============================================  S I R E N A  ===================================================
// const actualizarSirena = async (estado) => {
//   try {
//     await db.ref('sirena').set(estado);
//     console.log(`Estado de Sirena: ${estado ? 'Encendido' : 'Apagado'}`);
//   } catch (error) {
//     console.error('Error al actualizar el estado de alarma:', error.message);
//   }
// };


// const checkEstadoSirena = async (msg, estadoNuevo, estadoAnteriorSirena) => {
//   try {
//     const estadoSirena = await db.ref(`sirena/`).once('value');
//     const estadoActualSirena = estadoSirena.val();
    
//     console.log(`EstadoAnterior: ${estadoAnteriorSirena}`);
//     console.log(`EstadoNuevo: ${estadoNuevo}`);
//     console.log(`EstadoAlarma: ${estadoActualSirena}`);
    
//     if (estadoActualSirena === null) {
//       await msg.reply("Error: No se encontró el estado de la Sirena en la base de datos.");
//       return;
//     }
    
//     const estadoActualTexto = estadoActualSirena ? "Encendida" : "Apagada";
//     if (estadoActualSirena === estadoNuevo) {
//       if (estadoAnteriorSirena !== estadoNuevo) {
//         await msg.reply(`La Sirena se ${estadoNuevo ? "encendió" : "apagó"} correctamente. Ahora está ${estadoActualTexto}.`);
//       } else {
//         await msg.reply(`La Sirena ya estaba ${estadoActualTexto}.`);
//       }
//     } else {
//       await msg.reply(`No se pudo cambiar el estado. La Sirena sigue ${estadoActualTexto}.`);
//     }
//   } catch (error) {
//     console.error("Error en checkEstadoSirena:", error);
//     await msg.reply("Ocurrió un error al verificar el estado de la Sirena.");
//   }
// };
// //? ===============================================================================================================



// // Envío de mensaje a números registrados
// const notifyContacts = async (client, message) => {
//   try {
//     const snapshot = await db.ref('contactos').once('value');
//     const contactos = snapshot.val();

//     if (!contactos) {
//       console.log("No se encontraron contactos en la base de datos.");
//       return [];
//     }

//     for (const [phoneNumber, { name, state }] of Object.entries(contactos)) {
//       if (state === true) {
//         console.log(`Enviando mensaje a ${name} (-${phoneNumber}-): ${message}`);
//         const chatId = `${phoneNumber}@c.us`;
//         await client.sendMessage(chatId, message);
//       }
//     }
//   } catch (error) {
//     console.error('Error al notificar a los contactos:', error.message);
//   }
// };
















// //* ------------------------------------------------------------------------------------------------------
// //* ------------------------------------------------------------------------------------------------------
// //* ------------------------------------------------------------------------------------------------------



// const initWhatsAppClient = () => {
//   const client = new Client({
//     authStrategy: new LocalAuth(),
//   });

//   client.on('qr', (qr) => {
//     console.log("Escanea este QR para iniciar sesión:");
//     qrcode.generate(qr, { small: true });
//   });


//   //*  Escucha en tiempo real el estado de las Variables
//   client.on('ready', () => {
//     console.log("Cliente WhatsApp listo");
//     setInterval(() => actualizarEstadoAlarmaPorHorario(client), 60 * 1000);

//     const variablesRef = db.ref('variables');
//     variablesRef.on('value', async (snapshot) => {
//       const variables = snapshot.val();
//       if (!variables) return;

//       for (const [key, variable] of Object.entries(variables)) {
//         if (variable.state === true) {
//           console.log(`Estado de ${variable.name} -ACTIVADA-`);
//           await notifyContacts(client, `${variable.name} -ACTIVADO-`);
//         }
//       }
//     });
//   });


//   //* Escucha en tiempo real los mensajes entrantes
//   client.on('message', async (msg) => {
//     const phoneNumber = msg.from.split('@')[0];             //? Guardo el numero de celular (limpio)

//     let name;

//     if (phoneNumber !== "status") {
//       try {
//         const snapshot = await db.ref(`contactos/${phoneNumber}`).once('value');
//         // const variablesDB = await db.ref(`variables/`).once('value');
//         const estadoAlarmaDB = await db.ref(`estado_alarma/`).once('value');
//         const estadoSirena = await db.ref(`sirena/`).once('value');

//         if (snapshot.exists()) {
//           ({ name, state } = snapshot.val());

//           console.log(`Mensaje recibido de ${name} (-${phoneNumber}-) ${state}`);
          
//           if (state) {
//             let msgText = "";
//             let transcription = "";
//             let intent = "";

//             msgOptions = `Hola ${name}!! Tus opciones:\n- ✔ (Alarma-on) Enciende Alarma -\n- ❌(Alarma-off) Apaga Alarma -\n- 👁‍🗨(Alarma-ver) Ver Sensores -\n- 🔊(Sirena-on) Sonar sirena -\n- 🔈(Sirena-off) Apagar sirena -\n- ⏰ (Configurar alarma HH:MM-HH:MM) Define horarios -\n- ⏱ (Horario-off) Desactiva horarios -`;

//             if (msg.hasMedia || msg.type === 'audio') {
//               console.log(`Mensaje de AUDIO`);
//               const media = await msg.downloadMedia();
//               const audioDir = 'C:/audioPythonTemp';
//               const audioPath = path.join(audioDir, `audio_${Date.now()}.ogg`);
              
//               if (!fs.existsSync(audioDir)) {
//                 fs.mkdirSync(audioDir, { recursive: true });
//               }

//               fs.writeFileSync(audioPath, media.data, { encoding: 'base64' });
              
//               const formData = new FormData();
//               formData.append('audio', fs.createReadStream(audioPath));
              
//               try {
//                 const response = await axios.post('http://127.0.0.1:5000/transcribe-audio', formData, {
//                   headers: { 'Content-Type': 'multipart/form-data' },
//                 });

//                 transcription = response.data.transcription;
//                 intent = response.data.intent;

//                 console.log('Transcripción:', transcription);
//                 console.log('Intención:', intent);
//               } catch (error) {
//                 console.error('Error al transcribir:', error);
//                 msg.reply('No pude transcribir el audio.');
//               }
              
//               fs.unlinkSync(audioPath);
//             } else {
//               msgText = msg.body.toLowerCase();
//               console.log(`Mensaje de TEXTO: <<<< ${msgText} >>>>`);
//             }

//             const estadoAnterior = estadoAlarmaDB.val();
//             const estadoAnteriorSirena = estadoSirena.val();

//             if (msgText.startsWith('configurar alarma')) {
//               const match = msgText.match(/configurar alarma (\d{2}:\d{2})-(\d{2}:\d{2})/);
//               if (match) {
//                 const [, inicio, fin] = match;
//                 const inicioMinutos = horaAMinutos(inicio);
//                 const finMinutos = horaAMinutos(fin);

//                 if (inicioMinutos === null || finMinutos === null) {
//                   await msg.reply('Hora inválida. Usa formato HH:MM con horas (00-23) y minutos (00-59).');
//                 } else {
//                   try {
//                     await db.ref('horarios_alarma').set({ inicio, fin, state: true });
//                     await msg.reply(`Horarios configurados y activados: Alarma de ${inicio} a ${fin}.`);
//                     console.log(`Horarios configurados: ${inicio}-${fin}, state: true`);
//                   } catch (error) {
//                     await msg.reply('Error al configurar los horarios.');
//                     console.error('Error al configurar horarios:', error);
//                   }
//                 }
//               } else {
//                 await msg.reply('Formato incorrecto. Usa: "configurar alarma HH:MM-HH:MM" (ej. "configurar alarma 23:00-05:00")');
//               }
//             } else if (msgText === 'horario-off') {
//               try {
//                 await db.ref('horarios_alarma/state').set(false);
//                 await msg.reply('Horarios desactivados. La alarma no se activará automáticamente.');
//                 console.log('Horarios desactivados.');
//               } catch (error) {
//                 await msg.reply('Error al desactivar los horarios.');
//                 console.error('Error al desactivar horarios:', error);
//               }
//             } else if (intent === "activar_alarma" || msgText === "alarma-on") {
//               await actualizarEstadoAlarma(true);
//               await msg.reply("Encendiendo Alarma");
//               await checkEstadoCambiado(msg, true, estadoAnterior);
//             } else if (intent === "desactivar_alarma" || msgText === "alarma-off") {
//               await actualizarEstadoAlarma(false);
//               await msg.reply("Apagando Alarma");
//               await checkEstadoCambiado(msg, false, estadoAnterior);
//             } else if (intent === "estado_alarma" || msgText === "alarma-ver") {
//               await verEstadoAlarma(msg);
//             } else if (intent === "saludo" || msgText === "hermes") {
//               await msg.reply(msgOptions);
//             } else if (intent === "sirena_on" || msgText === "sirena-on") {
//               await actualizarSirena(true);
//               await msg.reply("Encendiendo SIRENA");
//               await checkEstadoSirena(msg, true, estadoAnteriorSirena);
//             } else if (intent === "sirena_off" || msgText === "sirena-off") {
//               await actualizarSirena(false);
//               await msg.reply("Apagando SIRENA");
//               await checkEstadoSirena(msg, false, estadoAnteriorSirena);
//             } else {
//               await msg.reply(`No entendí bien: "${transcription || msgText}". ¿Puedes reformularlo?`);
//             }

//             console.log(`Respuesta enviada a ${name}`);
//           } else {
//             console.log(`El usuario ${name} tiene el estado en false.`);
//           }
//         } else {
//           console.log(`El número ${phoneNumber} no está registrado en la base de datos.`);
//         }

//         console.log(`--------------------------------------------------------------------`);
//       } catch (error) {
//         console.error('Error al procesar el mensaje:', error.message);
//       }
//     }
//   });

//   client.initialize();

//   return client;
// };



// module.exports = initWhatsAppClient;