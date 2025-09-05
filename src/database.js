const admin = require("firebase-admin");
const serviceAccount = require("../firebaseConfig.json");

// Inicializar Firebase
if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://bot-andy-copia-default-rtdb.firebaseio.com/",
    });
}

// Exportar Referencia a la base de datos
const db = admin.database();
module.exports = db;

