// Importar bibliotecas y módulos necesarios
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js'); // Cliente de WhatsApp para enviar/recibir mensajes
const qrcode = require('qrcode-terminal'); // Biblioteca para generar códigos QR en la terminal
const firebase = require('firebase-admin'); // SDK de Firebase Admin para operaciones con base de datos y almacenamiento
const fs = require('fs'); // Módulo de sistema de archivos para manejar operaciones con archivos
const axios = require('axios'); // Cliente HTTP para realizar solicitudes a APIs
const path = require('path'); // Módulo para manejar rutas de archivos
const FormData = require('form-data'); // Biblioteca para manejar datos multipart/form-data en solicitudes API


const { verEstadoAlarma } = require("../functions/verEstadoAlarma");
const { checkEstadoCambiado } = require("../functions/checkEstadoCambiado");
const { actualizarEstadoAlarmaPorHorario } = require("../functions/actualizarEstadoAlarmaPorHorario");
const { actualizarEstadoAlarma } = require("../functions/actualizarEstadoAlarma");
const { actualizarSirena } = require("../functions/actualizarSirena");
const { checkEstadoSirena } = require("../functions/checkEstadoSirena");
const { horaAMinutos } = require("../functions/horaAMinutos");
const { notifyContacts } = require("../functions/notifyContacts");

const { monitorVariablesAndTakeSnapshot } = require('../functions/snapshotMonitor'); 



// Inicializar Firebase con credenciales de cuenta de servicio
const serviceAccount = require('../../firebaseConfig.json'); // Cargar configuración de Firebase desde un archivo JSON
firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount), // Autenticar con Firebase usando la cuenta de servicio
    databaseURL: "https://bot-andy-copia-default-rtdb.firebaseio.com", // URL de la base de datos en tiempo real de Firebase
    storageBucket: "bot-andy-copia.appspot.com" // URL del bucket de almacenamiento de Firebase
});
console.log('Firebase inicializado correctamente');
const db = firebase.database();




// Prueba de lectura
db.ref('conection_state').once('value', (snapshot) => {
  const data = snapshot.val();
  if (data) {
    console.log('----> Estado de conexión con Firebase: ', data, " <----");
  } else {
    console.log('No se encontraron datos en el estado de conexión con Firebase');
  }
}, (error) => {
  console.error('Error al leer datos de conexión con Firebase:', error.message);
});








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
        
        // Inicia el monitoreo de variables y snapshots
        monitorVariablesAndTakeSnapshot(client, db);

        
        
        
        // Establece un intervalo para verificar y actualizar el estado de la alarma cada minuto
        // setInterval(() => actualizarEstadoAlarmaPorHorario(client), 60 * 1000);

        // Escucha actualizaciones en tiempo real de las variables (sensores) en Firebase
        // const variablesRef = db.ref('variables');
        // variablesRef.on('value', async (snapshot) => {
        //     const variables = snapshot.val(); // Obtiene los datos de las variables
        //     if (!variables) return; // Sale si no hay variables

        //     // Notifica a los contactos cuando se activa un sensor
        //     for (const [key, variable] of Object.entries(variables)) {
        //         if (variable.state === true) {
        //             console.log(`Estado de ${variable.name} -ACTIVADA-`);
        //             await notifyContacts(client, `${variable.name} -ACTIVADO-`);
        //         }
        //     }
        // });

        // Escucha nuevas capturas (imágenes) añadidas a Firebase
        // const snapshotsRef = db.ref('snapshots');
        // snapshotsRef.on('child_added', async (snapshot) => {
        //     const key = snapshot.key; // Obtiene la clave de la captura
        //     // Construye la URL de la imagen en Firebase Storage
        //     const imageUrl = `https://firebasestorage.googleapis.com/v0/b/bot-andy-copia.appspot.com/o/snapshots%2F${key}?alt=media`;
        //     const media = await MessageMedia.fromUrl(imageUrl); // Descarga la imagen
        //     // Notifica a los contactos con la imagen y un mensaje
        //     await notifyContacts(client, `Captura de ${key.split('_')[0]} activada`, media);
        //     snapshotsRef.child(key).remove(); // Opcionalmente elimina la referencia de la captura
        // });
    });



    client.on('error', (error) => {
        console.error('Error en el cliente de WhatsApp:', error);
    });

    client.on('auth_failure', (msg) => {
        console.error('Fallo de autenticación:', msg);
    });

    client.initialize().catch((error) => {
        console.error('Error al inicializar el cliente:', error);
    });





    // Manejador de eventos para mensajes entrantes
    // client.on('message', async (msg) => {
    //     const phoneNumber = msg.from.split('@')[0]; // Extrae el número de teléfono del remitente

    //     let name;

    //     // Ignora los mensajes de estado
    //     if (phoneNumber !== "status") {
    //         try {
    //             // Obtiene los datos del contacto y los estados de alarma/sirena desde Firebase
    //             const snapshot = await db.ref(`contactos/${phoneNumber}`).once('value');
    //             const estadoAlarmaDB = await db.ref(`datos/estadoAlarma/`).once('value');
    //             const estadoSirena = await db.ref(`sirena/`).once('value');

    //             // Verifica si el contacto existe en la base de datos
    //             if (snapshot.exists()) {
    //                 ({ name, state } = snapshot.val()); // Obtiene el nombre y estado del contacto

    //                 console.log(`Mensaje recibido de ${name} (-${phoneNumber}-) ${state}`);

    //                 // Procesa el mensaje si el contacto está activo
    //                 if (state) {
    //                     let msgText = "";
    //                     let transcription = "";
    //                     let intent = "";

    //                     // Define los comandos disponibles para el usuario
    //                     msgOptions = `Hola ${name}!! Tus opciones:\n- ✔ (Alarma-on) Enciende Alarma -\n- ❌(Alarma-off) Apaga Alarma -\n- 👁‍🗨(Alarma-ver) Ver Sensores -\n- 🔊(Sirena-on) Sonar sirena -\n- 🔈(Sirena-off) Apagar sirena -\n- ⏰ (Configurar alarma HH:MM-HH:MM) Define horarios -\n- ⏱ (Horario-off) Desactiva horarios -`;

    //                     // Maneja mensajes de audio
    //                     if (msg.hasMedia || msg.type === 'audio') {
    //                         console.log(`Mensaje de AUDIO`);
    //                         const media = await msg.downloadMedia(); // Descarga el audio
    //                         const audioDir = 'C:/audioPythonTemp'; // Directorio para archivos de audio temporales
    //                         const audioPath = path.join(audioDir, `audio_${Date.now()}.ogg`); // Ruta única para el archivo de audio

    //                         // Crea el directorio si no existe
    //                         if (!fs.existsSync(audioDir)) {
    //                             fs.mkdirSync(audioDir, { recursive: true });
    //                         }

    //                         // Guarda el archivo de audio
    //                         fs.writeFileSync(audioPath, media.data, { encoding: 'base64' });

    //                         // Prepara los datos para la API de transcripción de audio
    //                         const formData = new FormData();
    //                         formData.append('audio', fs.createReadStream(audioPath));

    //                         try {
    //                             // Envía el audio a la API de transcripción
    //                             const response = await axios.post('http://127.0.0.1:5000/transcribe-audio', formData, {
    //                                 headers: { 'Content-Type': 'multipart/form-data' },
    //                             });

    //                             transcription = response.data.transcription; // Obtiene el texto transcrito
    //                             intent = response.data.intent; // Obtiene la intención detectada

    //                             console.log('Transcripción:', transcription);
    //                             console.log('Intención:', intent);
    //                         } catch (error) {
    //                             console.error('Error al transcribir:', error); // Registra el error
    //                             msg.reply('No pude transcribir el audio.'); // Notifica al usuario
    //                         }

    //                         fs.unlinkSync(audioPath); // Elimina el archivo de audio temporal
    //                     } else {
    //                         msgText = msg.body.toLowerCase(); // Obtiene el mensaje de texto y lo convierte a minúsculas
    //                         console.log(`Mensaje de TEXTO: <<<< ${msgText} >>>>`);
    //                     }

    //                     // Almacena los estados previos de la alarma y la sirena
    //                     const estadoAnterior = estadoAlarmaDB.val();
    //                     const estadoAnteriorSirena = estadoSirena.val();

    //                     // Maneja los comandos según el texto o la intención del audio
    //                     if (msgText.startsWith('configurar alarma')) {
    //                         // Analiza el comando de configuración de horario (ej. "configurar alarma 23:00-05:00")
    //                         const match = msgText.match(/configurar alarma (\d{2}:\d{2})-(\d{2}:\d{2})/);
    //                         if (match) {
    //                             const [, inicio, fin] = match; // Extrae las horas de inicio y fin
    //                             const inicioMinutos = horaAMinutos(inicio); // Convierte la hora de inicio a minutos
    //                             const finMinutos = horaAMinutos(fin); // Convierte la hora de fin a minutos

    //                             // Valida el formato de las horas
    //                             if (inicioMinutos === null || finMinutos === null) {
    //                                 await msg.reply('Hora inválida. Usa formato HH:MM con horas (00-23) y minutos (00-59).');
    //                             } else {
    //                                 try {
    //                                     // Actualiza el horario en Firebase
    //                                     await db.ref('horarios_alarma').set({ inicio, fin, state: true });
    //                                     await msg.reply(`Horarios configurados y activados: Alarma de ${inicio} a ${fin}.`);
    //                                     console.log(`Horarios configurados: ${inicio}-${fin}, state: true`);
    //                                 } catch (error) {
    //                                     await msg.reply('Error al configurar los horarios.');
    //                                     console.error('Error al configurar horarios:', error);
    //                                 }
    //                             }
    //                         } else {
    //                             await msg.reply('Formato incorrecto. Usa: "configurar alarma HH:MM-HH:MM" (ej. "configurar alarma 23:00-05:00")');
    //                         }
    //                     } else if (msgText === 'horario-off') {
    //                         // Desactiva el horario de la alarma
    //                         try {
    //                             await db.ref('horarios_alarma/state').set(false);
    //                             await msg.reply('Horarios desactivados. La alarma no se activará automáticamente.');
    //                             console.log('Horarios desactivados.');
    //                         } catch (error) {
    //                             await msg.reply('Error al desactivar los horarios.');
    //                             console.error('Error al desactivar horarios:', error);
    //                         }
    //                     } else if (intent === "activar_alarma" || msgText === "alarma-on") {
    //                         // Enciende la alarma
    //                         await actualizarEstadoAlarma(true);
    //                         await msg.reply("Encendiendo Alarma");
    //                         await checkEstadoCambiado(msg, true, estadoAnterior);
    //                     } else if (intent === "desactivar_alarma" || msgText === "alarma-off") {
    //                         // Apaga la alarma
    //                         await actualizarEstadoAlarma(false);
    //                         await msg.reply("Apagando Alarma");
    //                         await checkEstadoCambiado(msg, false, estadoAnterior);
    //                     } else if (intent === "datos/estadoAlarma" || msgText === "alarma-ver") {
    //                         // Muestra los estados de la alarma y los sensores
    //                         await verEstadoAlarma(msg);
    //                     } else if (intent === "saludo" || msgText === "guardian" || msgText === "hola") {
    //                         // Responde con los comandos disponibles
    //                         await msg.reply(msgOptions);
    //                     } else if (intent === "sirena_on" || msgText === "sirena-on") {
    //                         // Enciende la sirena
    //                         await actualizarSirena(true);
    //                         await msg.reply("Encendiendo SIRENA");
    //                         await checkEstadoSirena(msg, true, estadoAnteriorSirena);
    //                     } else if (intent === "sirena_off" || msgText === "sirena-off") {
    //                         // Apaga la sirena
    //                         await actualizarSirena(false);
    //                         await msg.reply("Apagando SIRENA");
    //                         await checkEstadoSirena(msg, false, estadoAnteriorSirena);
    //                     } else {
    //                         // Maneja comandos no reconocidos
    //                         await msg.reply(`No entendí bien: "${transcription || msgText}". ¿Puedes reformularlo?`);
    //                     }

    //                     console.log(`Respuesta enviada a ${name}`); // Registra la respuesta enviada
    //                 } else {
    //                     console.log(`El usuario ${name} tiene el estado en false.`); // Registra si el contacto está inactivo
    //                 }
    //             } else {
    //                 console.log(`El número ${phoneNumber} no está registrado en la base de datos.`); // Registra si el contacto no está registrado
    //             }

    //             console.log(`--------------------------------------------------------------------`); // Registra un separador
    //         } catch (error) {
    //             console.error('Error al procesar el mensaje:', error.message); // Registra el error
    //         }
    //     }
    // });

    client.initialize(); // Inicia el cliente de WhatsApp

    return client; // Retorna el cliente inicializado
};

// Exporta la función de inicialización
module.exports = initWhatsAppClient ;