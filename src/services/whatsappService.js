const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { db } = require('../config/firebaseConfig');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const FormData = require('form-data');

const { verEstadoAlarma } = require("../functions/verEstadoAlarma");
const { checkEstadoCambiado } = require("../functions/checkEstadoCambiado");
const { actualizarEstadoAlarmaPorHorario } = require("../functions/actualizarEstadoAlarmaPorHorario");
const { actualizarEstadoAlarma } = require("../functions/actualizarEstadoAlarma");
const { actualizarSirena } = require("../functions/actualizarSirena");
const { checkEstadoSirena } = require("../functions/checkEstadoSirena");
const { horaAMinutos } = require("../functions/horaAMinutos");
const { notifyContacts } = require("../functions/notifyContacts");
const { monitorVariablesAndTakeSnapshot } = require('../functions/snapshotMonitor');

// const { handleMessage } = require("../functions/handleMessage"); // Verifica esta ruta   //!!!! -  VER PARA ARREGLAR EN UN FUTURO  -
const handleMessage = require("../functions/handleMessage").handleMessage;





//? ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
if (typeof handleMessage !== 'function') {
    console.error('Error: handleMessage no está definido como función:', handleMessage);
    throw new Error('handleMessage no es una función válida');
}

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

const initWhatsAppClient = () => {
    console.log('Inicializando cliente de WhatsApp...');

    // Limpiar el directorio de autenticación local antes de iniciar
    const authDir = path.join(require('os').homedir(), '.wwebjs_auth');
    if (fs.existsSync(authDir)) {
        fs.rmSync(authDir, { recursive: true, force: true });
        console.log('Directorio de autenticación local limpiado');
    }

    const client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: { 
            headless: true, 
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        },
        takeoverOnConflict: false
    });

    client.on('qr', (qr) => {
        console.log("Escanea este QR para iniciar sesión:");
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.log("Cliente WhatsApp listo");
        // monitorVariablesAndTakeSnapshot(client, db);
        // setInterval(() => actualizarEstadoAlarmaPorHorario(client), 60 * 1000);

        // const variablesRef = db.ref('variables');
        // variablesRef.on('value', async (snapshot) => {
        //     const variables = snapshot.val();
        //     if (!variables) return;
        //     for (const [key, variable] of Object.entries(variables)) {
        //         if (variable.state === true) {
        //             console.log(`Estado de ${variable.name} -ACTIVADA-`);
        //             await notifyContacts(client, `${variable.name} -ACTIVADO-`);
        //         }
        //     }
        // });
    });

    client.on('message', handleMessage); // Verifica que handleMessage esté definido

    client.on('error', (error) => {
        console.error('Error en el cliente de WhatsApp:', error);
    });

    client.on('auth_failure', (msg) => {
        console.error('Fallo de autenticación:', msg);
    });

    client.on('disconnected', (reason) => {
        console.error('Cliente desconectado. Razón:', reason);
    });

    client.initialize().catch((error) => {
        console.error('Error al inicializar el cliente:', error);
    });

    return client;
};

module.exports = initWhatsAppClient;