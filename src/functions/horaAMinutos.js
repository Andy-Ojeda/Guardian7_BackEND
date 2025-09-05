// Función para convertir una cadena de hora (HH:MM) a minutos desde medianoche
const horaAMinutos = (horaStr) => {
    const [horas, minutos] = horaStr.split(':').map(Number); // Divide la cadena de hora en horas y minutos y los convierte a números
    // Valida que las horas (0-23) y minutos (0-59) estén en rangos válidos
    if (horas < 0 || horas > 23 || minutos < 0 || minutos > 59) return null;
    return horas * 60 + minutos; // Convierte horas a minutos y suma los minutos para obtener el total desde medianoche
};

module.exports = { horaAMinutos };