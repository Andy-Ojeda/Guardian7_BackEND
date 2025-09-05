const { db } = require('../config/firebaseConfig'); 
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const FormData = require('form-data');

const { verEstadoAlarma } = require("./verEstadoAlarma");
const { checkEstadoCambiado } = require("./checkEstadoCambiado");
const { actualizarEstadoAlarma } = require("./actualizarEstadoAlarma");
const { actualizarSirena } = require("./actualizarSirena");
const { checkEstadoSirena } = require("./checkEstadoSirena");
const { horaAMinutos } = require("./horaAMinutos");
const { notifyContacts } = require("./notifyContacts");

const handleMessage = async (msg) => {
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

                    const msgOptions = `Hola ${name}!! Tus opciones:\n- ✔ (Alarma-on) Enciende Alarma -\n- ❌(Alarma-off) Apaga Alarma -\n- 👁‍🗨(Alarma-ver) Ver Sensores -\n- 🔊(Sirena-on) Sonar sirena -\n- 🔈(Sirena-off) Apagar sirena -\n- ⏰ (Configurar alarma HH:MM-HH:MM) Define horarios -\n- ⏱ (Horario-off) Desactiva horarios -`;

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
};

module.exports = { handleMessage }; 