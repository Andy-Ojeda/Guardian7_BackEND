const firebase = require('firebase-admin');
const serviceAccount = require('../../firebaseConfig.json');

const firebaseApp = firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: "https://bot-andy-copia-default-rtdb.firebaseio.com",
    storageBucket: "bot-andy-copia.appspot.com"
});

console.log('Firebase inicializado correctamente');
const db = firebaseApp.database();

module.exports = { db };