const { db } = require('../config/firebaseConfig');
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

module.exports = { verEstadoAlarma };