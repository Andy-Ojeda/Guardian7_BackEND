const { db } = require('../config/firebaseConfig');

const { hayVariablesActivas } = require("./hayVariablesActivas");


// Función para obtener la hora actual en minutos desde medianoche
const minutosDesdeMedianoche = () => {
    const ahora = new Date(); // Obtiene la fecha y hora actual
    return ahora.getHours() * 60 + ahora.getMinutes(); // Convierte las horas actuales a minutos y suma los minutos actuales
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

module.exports = { actualizarEstadoAlarmaPorHorario };