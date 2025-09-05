// Importar bibliotecas y módulos necesarios
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js'); // Cliente de WhatsApp para enviar/recibir mensajes
const qrcode = require('qrcode-terminal'); // Biblioteca para generar códigos QR en la terminal
const firebase = require('firebase-admin'); // SDK de Firebase Admin para operaciones con base de datos y almacenamiento
const fs = require('fs'); // Módulo de sistema de archivos para manejar operaciones con archivos
const axios = require('axios'); // Cliente HTTP para realizar solicitudes a APIs
const path = require('path'); // Módulo para manejar rutas de archivos
const FormData = require('form-data'); // Biblioteca para manejar datos multipart/form-data en solicitudes API

// Inicializar Firebase con credenciales de cuenta de servicio
const serviceAccount = require('../../firebaseConfig.json'); // Cargar configuración de Firebase desde un archivo JSON
firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount), // Autenticar con Firebase usando la cuenta de servicio
    databaseURL: "https://bot-andy-copia-default-rtdb.firebaseio.com", // URL de la base de datos en tiempo real de Firebase
    storageBucket: "bot-andy-copia.appspot.com" // URL del bucket de almacenamiento de Firebase
});
const db = firebase.database(); // Inicializar referencia a la base de datos en tiempo real de Firebase

//! ======================================= T I E M P O ==================================================
// Función para convertir una cadena de hora (HH:MM) a minutos desde medianoche
const horaAMinutos = (horaStr) => {
    const [horas, minutos] = horaStr.split(':').map(Number); // Divide la cadena de hora en horas y minutos y los convierte a números
    // Valida que las horas (0-23) y minutos (0-59) estén en rangos válidos
    if (horas < 0 || horas > 23 || minutos < 0 || minutos > 59) return null;
    return horas * 60 + minutos; // Convierte horas a minutos y suma los minutos para obtener el total desde medianoche
};

// Función para obtener la hora actual en minutos desde medianoche
const minutosDesdeMedianoche = () => {
    const ahora = new Date(); // Obtiene la fecha y hora actual
    return ahora.getHours() * 60 + ahora.getMinutes(); // Convierte las horas actuales a minutos y suma los minutos actuales
};
//! =====================================================================================================

//? ======================================= V A R I A B L E S ===========================================
// Función para verificar si hay sensores activos en Firebase
const hayVariablesActivas = async () => {
    const snapshot = await db.ref('variables').once('value'); // Obtiene las variables desde Firebase
    const variables = snapshot.val(); // Extrae el valor de las variables
    if (!variables) return false; // Retorna false si no existen variables
    // Verifica si alguna variable tiene el estado en true
    return Object.values(variables).some(v => v.state === true);
};
//? =====================================================================================================

//! ==================================== E S T A D O   D E   A L A R M A ================================
// Función para mostrar el estado actual del sistema de alarma y los sensores
const verEstadoAlarma = async (msg) => {
    // Obtiene datos de Firebase para variables, estado de alarma, horarios y estado de alerta
    const variablesDB = await db.ref(`variables/`).once('value');
    const estadoAlarmaDB = await db.ref(`datos/estadoAlarma/`).once('value');
    const horariosAlarmaDB = await db.ref('horarios_alarma').once('value');
    const alertaDB = await db.ref('alerta').once('value');

    // Convierte los valores de Firebase a estados legibles
    let estadoAlarma2 = estadoAlarmaDB.val() === true ? "Encendida" : "Apagada"; // Estado de la alarma
    let variable1State = variablesDB.val().variable1.state === true ? "Abierta" : "Cerrada"; // Estado del sensor 1
    let variable2State = variablesDB.val().variable2.state === true ? "Abierta" : "Cerrada"; // Estado del sensor 2
    let variable3State = variablesDB.val().variable3.state === true ? "Abierta" : "Cerrada"; // Estado del sensor 3
    let alertaState = alertaDB.val() === true ? "Activa" : "Inactiva"; // Estado de la alerta

    // Obtiene el horario de la alarma o establece valores por defecto si no está configurado
    const horarios = horariosAlarmaDB.val() || { inicio: "No seteado", fin: "No seteado", state: false };
    // Construye el mensaje con los estados de los sensores, horario y estados de alarma/alerta
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
    await msg.reply(mensajeVAR); // Envía el mensaje al usuario
};

// Función para verificar si el cambio de estado de la alarma fue exitoso
const checkEstadoCambiado = async (msg, estadoNuevo, estadoAnterior) => {
    try {
        const estadoAlarmaDB = await db.ref(`datos/estadoAlarma/`).once('value'); // Obtiene el estado actual de la alarma
        const estadoActual = estadoAlarmaDB.val(); // Extrae el valor

        // Registra los estados para depuración
        console.log(`estadoAnterior: ${estadoAnterior}`);
        console.log(`estadoNuevo: ${estadoNuevo}`);
        console.log(`estadoAlarma: ${estadoActual}`);

        // Verifica si el estado de la alarma es nulo
        if (estadoActual === null) {
            await msg.reply("Error: No se encontró el estado de la alarma en la base de datos.");
            return;
        }

        const estadoActualTexto = estadoActual ? "Encendida" : "Apagada"; // Convierte el estado a texto
        // Verifica si el estado nuevo coincide con el estado actual
        if (estadoActual === estadoNuevo) {
            if (estadoAnterior !== estadoNuevo) {
                // El cambio de estado fue exitoso
                await msg.reply(`La alarma se ${estadoNuevo ? "encendió" : "apagó"} correctamente. Ahora está ${estadoActualTexto}.`);
            } else {
                // El estado ya era el mismo
                await msg.reply(`La alarma ya estaba ${estadoActualTexto}.`);
            }
        } else {
            // El cambio de estado falló
            await msg.reply(`No se pudo cambiar el estado. La alarma sigue ${estadoActualTexto}.`);
        }
    } catch (error) {
        console.error("Error en checkEstadoCambiado:", error); // Registra el error
        await msg.reply("Ocurrió un error al verificar el estado de la alarma."); // Notifica al usuario del error
    }
};

// Función para actualizar automáticamente el estado de la alarma según el horario
const actualizarEstadoAlarmaPorHorario = async (client) => {
    try {
        const snapshotHorarios = await db.ref('horarios_alarma').once('value'); // Obtiene el horario de la alarma
        const horarios = snapshotHorarios.val(); // Extrae los datos del horario

        // Verifica si los horarios no están configurados o están desactivados
        if (!horarios || !horarios.inicio || !horarios.fin || !horarios.state) {
            console.log('Horarios no configurados o desactivados.');
            return;
        }

        // Verifica si el horario está desactivado
        if (horarios.state !== true) {
            console.log('Horario configurado pero desactivado.');
            return;
        }

        // Convierte los tiempos del horario a minutos
        const inicioMinutos = horaAMinutos(horarios.inicio);
        const finMinutos = horaAMinutos(horarios.fin);
        const ahoraMinutos = minutosDesdeMedianoche(); // Obtiene la hora actual en minutos

        // Valida los tiempos del horario
        if (inicioMinutos === null || finMinutos === null) {
            console.log('Horarios inválidos en Firebase.');
            return;
        }

        // Determina si la hora actual está dentro del horario
        let enHorario;
        if (inicioMinutos < finMinutos) {
            enHorario = ahoraMinutos >= inicioMinutos && ahoraMinutos <= finMinutos; // Rango normal
        } else {
            enHorario = ahoraMinutos >= inicioMinutos || ahoraMinutos <= finMinutos; // Rango nocturno
        }

        // Obtiene los estados actuales de la alarma y la alerta
        const snapshotEstado = await db.ref('datos/estadoAlarma').once('value');
        const estadoAnterior = snapshotEstado.val();
        const snapshotAlerta = await db.ref('alerta').once('value');
        const alertaAnterior = snapshotAlerta.val();

        let nuevoEstadoAlarma = estadoAnterior; // Inicializa el nuevo estado de la alarma
        let nuevoEstadoAlerta = alertaAnterior; // Inicializa el nuevo estado de la alerta

        // Lógica para actualizar los estados de la alarma y la alerta según el horario y los sensores
        if (enHorario) {
            const variablesActivas = await hayVariablesActivas(); // Verifica si hay sensores activos
            if (variablesActivas && ahoraMinutos === inicioMinutos) {
                nuevoEstadoAlarma = false; // Desactiva la alarma si hay sensores activos al inicio del horario
                nuevoEstadoAlerta = true; // Activa la alerta
            } else if (!variablesActivas) {
                nuevoEstadoAlarma = true; // Activa la alarma si no hay sensores activos
                nuevoEstadoAlerta = false; // Desactiva la alerta
            }
        } else {
            nuevoEstadoAlarma = false; // Desactiva la alarma fuera del horario
            nuevoEstadoAlerta = false; // Desactiva la alerta fuera del horario
        }

        // Actualiza Firebase con los nuevos estados
        await db.ref('datos/estadoAlarma').set(nuevoEstadoAlarma);
        await db.ref('alerta').set(nuevoEstadoAlerta);
        console.log(`datos/estadoAlarma: ${nuevoEstadoAlarma}, alerta: ${nuevoEstadoAlerta} a las ${new Date().toLocaleTimeString()}`);

        // Notifica a los contactos si el estado de la alarma cambió
        if (estadoAnterior !== nuevoEstadoAlarma) {
            const mensaje = nuevoEstadoAlarma
                ? `Alarma *Activada* automáticamente a las ${horarios.inicio}.`
                : `Alarma *Desactivada* automáticamente a las ${horarios.fin}.`;
            await notifyContacts(client, mensaje);
        }

        // Notifica a los contactos si la alerta se activa
        if (alertaAnterior !== nuevoEstadoAlerta && nuevoEstadoAlerta === true) {
            await notifyContacts(client, `⚠️ *Alerta*: No se pudo activar la alarma a las ${horarios.inicio} porque hay sensores activos.`);
        }
    } catch (error) {
        console.error('Error al actualizar datos/estadoAlarma por horario:', error); // Registra el error
    }
};

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
//! =====================================================================================================

//? ============================================= S I R E N A ============================================
// Función para actualizar el estado de la sirena en Firebase
const actualizarSirena = async (estado) => {
    try {
        await db.ref('sirena').set(estado); // Actualiza el estado de la sirena
        console.log(`Estado de Sirena: ${estado ? 'Encendido' : 'Apagado'}`); // Registra la actualización
    } catch (error) {
        console.error('Error al actualizar el estado de alarma:', error.message); // Registra el error
    }
};

// Función para verificar si el cambio de estado de la sirena fue exitoso
const checkEstadoSirena = async (msg, estadoNuevo, estadoAnteriorSirena) => {
    try {
        const estadoSirena = await db.ref(`sirena/`).once('value'); // Obtiene el estado actual de la sirena
        const estadoActualSirena = estadoSirena.val(); // Extrae el valor

        // Registra los estados para depuración
        console.log(`EstadoAnterior: ${estadoAnteriorSirena}`);
        console.log(`EstadoNuevo: ${estadoNuevo}`);
        console.log(`EstadoAlarma: ${estadoActualSirena}`);

        // Verifica si el estado de la sirena es nulo
        if (estadoActualSirena === null) {
            await msg.reply("Error: No se encontró el estado de la Sirena en la base de datos.");
            return;
        }

        const estadoActualTexto = estadoActualSirena ? "Encendida" : "Apagada"; // Convierte el estado a texto
        // Verifica si el estado nuevo coincide con el estado actual
        if (estadoActualSirena === estadoNuevo) {
            if (estadoAnteriorSirena !== estadoNuevo) {
                // El cambio de estado fue exitoso
                await msg.reply(`La Sirena se ${estadoNuevo ? "encendió" : "apagó"} correctamente. Ahora está ${estadoActualTexto}.`);
            } else {
                // El estado ya era el mismo
                await msg.reply(`La Sirena ya estaba ${estadoActualTexto}.`);
            }
        } else {
            // El cambio de estado falló
            await msg.reply(`No se pudo cambiar el estado. La Sirena sigue ${estadoActualTexto}.`);
        }
    } catch (error) {
        console.error("Error en checkEstadoSirena:", error); // Registra el error
        await msg.reply("Ocurrió un error al verificar el estado de la Sirena."); // Notifica al usuario del error
    }
};
//? =====================================================================================================

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

//* ------------------------------------------------------------------------------------------------------
//* ------------------------------------------------------------------------------------------------------
//* ------------------------------------------------------------------------------------------------------

// Función para inicializar y configurar el cliente de WhatsApp
const initWhatsAppClient = () => {
    // Crea un nuevo cliente de WhatsApp con autenticación local
    const client = new Client({
        authStrategy: new LocalAuth(),
    });

    // Manejador de eventos para la generación de códigos QR (para autenticación de WhatsApp)
    client.on('qr', (qr) => {
        console.log("Escanea este QR para iniciar sesión:");
        qrcode.generate(qr, { small: true }); // Muestra el código QR en la terminal
    });

    // Manejador de eventos cuando el cliente está listo
    client.on('ready', () => {
        console.log("Cliente WhatsApp listo"); // Registra que el cliente está listo
        // Establece un intervalo para verificar y actualizar el estado de la alarma cada minuto
        setInterval(() => actualizarEstadoAlarmaPorHorario(client), 60 * 1000);

        // Escucha actualizaciones en tiempo real de las variables (sensores) en Firebase
        const variablesRef = db.ref('variables');
        variablesRef.on('value', async (snapshot) => {
            const variables = snapshot.val(); // Obtiene los datos de las variables
            if (!variables) return; // Sale si no hay variables

            // Notifica a los contactos cuando se activa un sensor
            for (const [key, variable] of Object.entries(variables)) {
                if (variable.state === true) {
                    console.log(`Estado de ${variable.name} -ACTIVADA-`);
                    await notifyContacts(client, `${variable.name} -ACTIVADO-`);
                }
            }
        });

        // Escucha nuevas capturas (imágenes) añadidas a Firebase
        const snapshotsRef = db.ref('snapshots');
        snapshotsRef.on('child_added', async (snapshot) => {
            const key = snapshot.key; // Obtiene la clave de la captura
            // Construye la URL de la imagen en Firebase Storage
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/bot-andy-copia.appspot.com/o/snapshots%2F${key}?alt=media`;
            const media = await MessageMedia.fromUrl(imageUrl); // Descarga la imagen
            // Notifica a los contactos con la imagen y un mensaje
            await notifyContacts(client, `Captura de ${key.split('_')[0]} activada`, media);
            snapshotsRef.child(key).remove(); // Opcionalmente elimina la referencia de la captura
        });
    });

    // Manejador de eventos para mensajes entrantes
    client.on('message', async (msg) => {
        const phoneNumber = msg.from.split('@')[0]; // Extrae el número de teléfono del remitente

        let name;

        // Ignora los mensajes de estado
        if (phoneNumber !== "status") {
            try {
                // Obtiene los datos del contacto y los estados de alarma/sirena desde Firebase
                const snapshot = await db.ref(`contactos/${phoneNumber}`).once('value');
                const estadoAlarmaDB = await db.ref(`datos/estadoAlarma/`).once('value');
                const estadoSirena = await db.ref(`sirena/`).once('value');

                // Verifica si el contacto existe en la base de datos
                if (snapshot.exists()) {
                    ({ name, state } = snapshot.val()); // Obtiene el nombre y estado del contacto

                    console.log(`Mensaje recibido de ${name} (-${phoneNumber}-) ${state}`);

                    // Procesa el mensaje si el contacto está activo
                    if (state) {
                        let msgText = "";
                        let transcription = "";
                        let intent = "";

                        // Define los comandos disponibles para el usuario
                        msgOptions = `Hola ${name}!! Tus opciones:\n- ✔ (Alarma-on) Enciende Alarma -\n- ❌(Alarma-off) Apaga Alarma -\n- 👁‍🗨(Alarma-ver) Ver Sensores -\n- 🔊(Sirena-on) Sonar sirena -\n- 🔈(Sirena-off) Apagar sirena -\n- ⏰ (Configurar alarma HH:MM-HH:MM) Define horarios -\n- ⏱ (Horario-off) Desactiva horarios -`;

                        // Maneja mensajes de audio
                        if (msg.hasMedia || msg.type === 'audio') {
                            console.log(`Mensaje de AUDIO`);
                            const media = await msg.downloadMedia(); // Descarga el audio
                            const audioDir = 'C:/audioPythonTemp'; // Directorio para archivos de audio temporales
                            const audioPath = path.join(audioDir, `audio_${Date.now()}.ogg`); // Ruta única para el archivo de audio

                            // Crea el directorio si no existe
                            if (!fs.existsSync(audioDir)) {
                                fs.mkdirSync(audioDir, { recursive: true });
                            }

                            // Guarda el archivo de audio
                            fs.writeFileSync(audioPath, media.data, { encoding: 'base64' });

                            // Prepara los datos para la API de transcripción de audio
                            const formData = new FormData();
                            formData.append('audio', fs.createReadStream(audioPath));

                            try {
                                // Envía el audio a la API de transcripción
                                const response = await axios.post('http://127.0.0.1:5000/transcribe-audio', formData, {
                                    headers: { 'Content-Type': 'multipart/form-data' },
                                });

                                transcription = response.data.transcription; // Obtiene el texto transcrito
                                intent = response.data.intent; // Obtiene la intención detectada

                                console.log('Transcripción:', transcription);
                                console.log('Intención:', intent);
                            } catch (error) {
                                console.error('Error al transcribir:', error); // Registra el error
                                msg.reply('No pude transcribir el audio.'); // Notifica al usuario
                            }

                            fs.unlinkSync(audioPath); // Elimina el archivo de audio temporal
                        } else {
                            msgText = msg.body.toLowerCase(); // Obtiene el mensaje de texto y lo convierte a minúsculas
                            console.log(`Mensaje de TEXTO: <<<< ${msgText} >>>>`);
                        }

                        // Almacena los estados previos de la alarma y la sirena
                        const estadoAnterior = estadoAlarmaDB.val();
                        const estadoAnteriorSirena = estadoSirena.val();

                        // Maneja los comandos según el texto o la intención del audio
                        if (msgText.startsWith('configurar alarma')) {
                            // Analiza el comando de configuración de horario (ej. "configurar alarma 23:00-05:00")
                            const match = msgText.match(/configurar alarma (\d{2}:\d{2})-(\d{2}:\d{2})/);
                            if (match) {
                                const [, inicio, fin] = match; // Extrae las horas de inicio y fin
                                const inicioMinutos = horaAMinutos(inicio); // Convierte la hora de inicio a minutos
                                const finMinutos = horaAMinutos(fin); // Convierte la hora de fin a minutos

                                // Valida el formato de las horas
                                if (inicioMinutos === null || finMinutos === null) {
                                    await msg.reply('Hora inválida. Usa formato HH:MM con horas (00-23) y minutos (00-59).');
                                } else {
                                    try {
                                        // Actualiza el horario en Firebase
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
                            // Desactiva el horario de la alarma
                            try {
                                await db.ref('horarios_alarma/state').set(false);
                                await msg.reply('Horarios desactivados. La alarma no se activará automáticamente.');
                                console.log('Horarios desactivados.');
                            } catch (error) {
                                await msg.reply('Error al desactivar los horarios.');
                                console.error('Error al desactivar horarios:', error);
                            }
                        } else if (intent === "activar_alarma" || msgText === "alarma-on") {
                            // Enciende la alarma
                            await actualizarEstadoAlarma(true);
                            await msg.reply("Encendiendo Alarma");
                            await checkEstadoCambiado(msg, true, estadoAnterior);
                        } else if (intent === "desactivar_alarma" || msgText === "alarma-off") {
                            // Apaga la alarma
                            await actualizarEstadoAlarma(false);
                            await msg.reply("Apagando Alarma");
                            await checkEstadoCambiado(msg, false, estadoAnterior);
                        } else if (intent === "datos/estadoAlarma" || msgText === "alarma-ver") {
                            // Muestra los estados de la alarma y los sensores
                            await verEstadoAlarma(msg);
                        } else if (intent === "saludo" || msgText === "guardian" || msgText === "hola") {
                            // Responde con los comandos disponibles
                            await msg.reply(msgOptions);
                        } else if (intent === "sirena_on" || msgText === "sirena-on") {
                            // Enciende la sirena
                            await actualizarSirena(true);
                            await msg.reply("Encendiendo SIRENA");
                            await checkEstadoSirena(msg, true, estadoAnteriorSirena);
                        } else if (intent === "sirena_off" || msgText === "sirena-off") {
                            // Apaga la sirena
                            await actualizarSirena(false);
                            await msg.reply("Apagando SIRENA");
                            await checkEstadoSirena(msg, false, estadoAnteriorSirena);
                        } else {
                            // Maneja comandos no reconocidos
                            await msg.reply(`No entendí bien: "${transcription || msgText}". ¿Puedes reformularlo?`);
                        }

                        console.log(`Respuesta enviada a ${name}`); // Registra la respuesta enviada
                    } else {
                        console.log(`El usuario ${name} tiene el estado en false.`); // Registra si el contacto está inactivo
                    }
                } else {
                    console.log(`El número ${phoneNumber} no está registrado en la base de datos.`); // Registra si el contacto no está registrado
                }

                console.log(`--------------------------------------------------------------------`); // Registra un separador
            } catch (error) {
                console.error('Error al procesar el mensaje:', error.message); // Registra el error
            }
        }
    });

    client.initialize(); // Inicia el cliente de WhatsApp

    return client; // Retorna el cliente inicializado
};

// Exporta la función de inicialización
module.exports = initWhatsAppClient ;