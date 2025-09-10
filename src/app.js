
// require('dotenv').config();
// const express = require('express');
// const initWhatsAppClient = require('./services/whatsappService');
// const firebase = require('firebase-admin');

// const cors = require('cors');

// //! ---------------------------------------
// const bcrypt = require('bcrypt');          // Para comparar password
// const jwt = require('jsonwebtoken');       // Para generar el token JWT
// //! ---------------------------------------



// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware
// app.use(express.json()); // Parsear cuerpos JSON
// app.use(express.urlencoded({ extended: true })); // Parsear cuerpos URL-encoded


// //! -------------------------------
// // Habilita CORS para todas las rutas y métodos desde el frontend
// app.use(cors({
//     origin: 'http://localhost:3005',  // tu frontend
//     credentials: true                 // si usás cookies o auth headers
// }));
// //! -------------------------------




// // Middleware de depuración
// app.use((req, res, next) => {
//     console.log(`Solicitud recibida: ${req.method} ${req.url}`);
//     console.log('Encabezados:', req.headers);
//     console.log('Cuerpo de la solicitud:', req.body);
//     next();
// });

// // Conectar a Firebase (ya inicializado en whatsappService.js)
// const db = firebase.database();

// // Inicializar el cliente de WhatsApp una sola vez
// const whatsappClient = initWhatsAppClient();








// // Obtener todos los clientes
// app.get('/api/clientes', async (req, res) => {
//   try {
//     const clientesSnap = await db.ref('clientes').once('value');
//     const clientes = clientesSnap.val();

//     if (!clientes) {
//       return res.status(404).json({ error: 'No hay clientes registrados' });
//     }

//     const listaClientes = Object.entries(clientes).map(([id, datos]) => ({
//       id,
//       ...datos
//     }));

//     res.status(200).json(listaClientes);
//   } catch (error) {
//     console.error('Error al obtener clientes:', error);
//     res.status(500).json({ error: 'Error en el servidor al obtener clientes' });
//   }
// });

// // Actualizar configuración de cliente
// app.put('/api/clientes/:id/configuracion', async (req, res) => {
//   const clienteId = req.params.id;
//   const nuevaConfiguracion = req.body.configuracion;

//   try {
//     await db.ref(`clientes/${clienteId}/configuracion`).set(nuevaConfiguracion);
//     res.status(200).json({ message: 'Configuración actualizada correctamente' });
//   } catch (error) {
//     console.error('Error al actualizar configuración:', error);
//     res.status(500).json({ error: 'Error al guardar configuración' });
//   }
// });

// // Ruta para crear clientes en Firebase
// app.post('/api/clientes', async (req, res) => {
//     try {
//         console.log("Leído:", req.body);

//         const clienteData = req.body.cliente;
//         const clienteId = clienteData?.id;

//         // Validar que venga un ID
//         if (!clienteId) {
//             return res.status(400).json({ error: 'El ID del cliente es obligatorio' });
//         }

//         // Validar que tenga datos personales
//         if (!clienteData.datos_personales) {
//             return res.status(400).json({ error: 'Faltan datos_personales en el cliente' });
//         }

//         // Si no viene configuración, la agregamos vacía (opcional)
//         if (!clienteData.configuracion) {
//             clienteData.configuracion = {}; // Para que ya esté en estructura si luego la usás
//         }

//         // ✅ Validar si el cliente ya existe
//         const clienteExistenteSnap = await db.ref(`clientes/${clienteId}`).once('value');
//         if (clienteExistenteSnap.exists()) {
//             return res.status(409).json({ error: 'El cliente ya existe' }); // 409 = Conflict
//         }

//         // Guardar en Firebase
//         await db.ref(`clientes/${clienteId}`).set(clienteData);

//         res.status(201).json({ message: 'Cliente creado exitosamente', id: clienteId });
//     } catch (error) {
//         console.error('Error al crear cliente:', error);
//         res.status(500).json({ error: 'Error en el servidor al crear el cliente' });
//     }
// });


// // Obtener clientes por vendedorId
// app.get('/api/clientes/por-vendedor', async (req, res) => {
//   const { vendedorId } = req.query;

//   console.log("Vendedor: ", vendedorId);

//   if (!vendedorId) {
//     return res.status(400).json({ error: 'Falta el vendedorId en la consulta' });
//   }

//   try {
//     const snapshot = await db.ref('clientes').once('value');
//     const clientes = snapshot.val();

//     if (!clientes) {
//       return res.status(404).json({ error: 'No hay clientes registrados' });
//     }

//     // Filtrar los clientes que tengan el vendedorId coincidente
//     const clientesFiltrados = Object.entries(clientes)
//       .filter(([id, datos]) => datos?.datos_personales?.vendedor === vendedorId)
//       .map(([id, datos]) => ({
//         id,
//         ...datos
//       }));

//     res.status(200).json(clientesFiltrados);
//   } catch (error) {
//     console.error('Error al obtener clientes por vendedor:', error);
//     res.status(500).json({ error: 'Error en el servidor al obtener clientes' });
//   }
// });


// app.post('/api/vendedores/register', async (req, res) => {
//     console.log("Datos Register: ", req)
//     try {
//         const {
//             nombre,
//             apellido,
//             dni,
//             nacimiento,
//             celular,
//             email,
//             password,
//             registerPass
//         } = req.body;

//         // Validación de campos vacíos
//         if (!nombre || !apellido || !dni || !nacimiento || !celular || !email || !password || !registerPass) {
//             return res.status(400).json({ error: 'Faltan campos obligatorios' });
//         }

//         // 🔐 1. Leer la clave de registro válida desde Firebase
//         const dbRef = db.ref('data/reg/pass');
//         const snapshot = await dbRef.once('value');
//         const validPass = snapshot.val();

//         // ❌ Comparar la clave de registro
//         if (registerPass !== validPass) {
//             return res.status(403).json({ error: 'Clave de registro incorrecta' });
//         }

//         // 🆔 Crear un ID único para el vendedor
//         const vendedorId = `VEN-${dni}-${Math.floor(Math.random() * 1000)}`;

//         // 🔒 Hashear la contraseña
//         const hashedPassword = await bcrypt.hash(password, 10);

//         const vendedorData = {
//             datos: {
//                 nombre,
//                 apellido,
//                 dni,
//                 nacimiento,
//                 celular,
//                 email,
//                 password: hashedPassword,
//                 id: vendedorId
//             }
//         };

//         // 📤 Guardar en Firebase
//         await db.ref(`vendedores/${vendedorId}`).set(vendedorData);

//         res.status(201).json({
//             message: 'Vendedor registrado exitosamente',
//             id: vendedorId
//         });

//     } catch (error) {
//         console.error('Error al registrar vendedor:', error);
//         res.status(500).json({ error: 'Error en el servidor al registrar vendedor' });
//     }
// });




// // Actualizar datos personales del cliente
// app.put('/api/clientes/:id/datos_personales', async (req, res) => {
//   const clienteId = req.params.id;
//   const nuevosDatos = req.body;

//   console.log("Recibidos para actualizar datos personales:", nuevosDatos);  // 👈 Agregalo

//   if (!nuevosDatos || Object.keys(nuevosDatos).length === 0) {
//     return res.status(400).json({ error: 'Datos personales requeridos' });
//   }

//   try {
//     await db.ref(`clientes/${clienteId}/datos_personales`).set(nuevosDatos);
//     res.status(200).json({ message: 'Datos personales actualizados correctamente' });
//   } catch (error) {
//     console.error('Error al actualizar datos personales:', error);
//     res.status(500).json({ error: 'Error en el servidor al actualizar datos personales' });
//   }
// });



// //! --------------------------------------------
// // Ruta para login de vendedores
// app.post('/api/vendedores/login', async (req, res) => {
//     try {
//         const { email, password } = req.body;
//         console.log("datos recibidos: ", req.body);

//         // Validaciones mínimas
//         if (!email || !password) {
//             return res.status(400).json({ error: 'Email y password son obligatorios' });
//         }

//         // Buscar todos los vendedores
//         const vendedoresSnap = await db.ref('vendedores').once('value');
//         const vendedores = vendedoresSnap.val();

//         if (!vendedores) {
//             return res.status(404).json({ error: 'No hay vendedores registrados' });
//         }

//         // Buscar al vendedor que tenga ese email
//         let vendedorEncontrado = null;
//         let vendedorId = null;

//         for (const id in vendedores) {
//             if (vendedores[id].datos.email === email) {
//                 vendedorEncontrado = vendedores[id].datos;
//                 vendedorId = id;
//                 break;
//             }
//         }

//         if (!vendedorEncontrado) {
//             return res.status(401).json({ error: 'Correo no registrado' });
//         }

//         // 🔐 Comparar password ingresada con la almacenada (hasheada)
//         const match = await bcrypt.compare(password, vendedorEncontrado.password);
//         if (!match) {
//             return res.status(401).json({ error: 'Password incorrecta' });
//         }

//         // Crear token JWT
//         const token = jwt.sign(
//             {
//                 id: vendedorId,
//                 nombre: vendedorEncontrado.nombre,
//                 email: vendedorEncontrado.email
//             },
//             process.env.JWT_SECRET || 'clave-supersecreta', // Ideal usar variable de entorno
//             { expiresIn: '2h' }
//         );

//         res.status(200).json({
//             message: 'Inicio de sesión exitoso',
//             token,
//             vendedor: {
//                 id: vendedorId,
//                 nombre: vendedorEncontrado.nombre,
//                 email: vendedorEncontrado.email
//             }
//         });

//     } catch (error) {
//         console.error('Error en login:', error);
//         res.status(500).json({ error: 'Error en el servidor' });
//     }
// });
// //! --------------------------------------------






// // Manejar cierre del servidor
// process.on('SIGINT', async () => {
//     console.log('Cerrando servidor y cliente de WhatsApp...');
//     await whatsappClient.destroy();
//     process.exit(0);
// });

// // Iniciar servidor
// app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));



// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const initWhatsAppClient = require('./services/whatsappService');
// const clienteRoutes = require('./routes/clienteRoutes');
// const vendedorRoutes = require('./routes/vendedorRoutes'); 




// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware
// app.use(cors({
//   origin: 'http://localhost:3005',
//   credentials: true
// }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Logging simple
// app.use((req, res, next) => {
//   console.log(`[${req.method}] ${req.url}`);
//   next();
// });

// // Rutas
// app.use('/api/clientes', clienteRoutes);
// app.use('/api/vendedores', vendedorRoutes); // ⚠️ Más adelante


// // WhatsApp
// const whatsappClient = initWhatsAppClient();

// // Cierre
// process.on('SIGINT', async () => {
//   console.log('Cerrando servidor...');
//   await whatsappClient.destroy();
//   process.exit(0);
// });

// app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));




// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const initWhatsAppClient = require('./services/whatsappService');
// const clienteRoutes = require('./routes/clienteRoutes');
// const vendedorRoutes = require('./routes/vendedorRoutes');

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware
// app.use(cors({
//     origin: 'http://localhost:3005',
//     credentials: true
// }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Logging simple
// app.use((req, res, next) => {
//     console.log(`[${req.method}] ${req.url}`);
//     next();
// });

// // Rutas
// app.use('/api/clientes', clienteRoutes);
// app.use('/api/vendedores', vendedorRoutes);

// // WhatsApp
// const whatsappClient = initWhatsAppClient();

// // Cierre
// process.on('SIGINT', async () => {
//     console.log('Cerrando servidor y cliente de WhatsApp...');
//     try {
//         await whatsappClient.destroy();
//         console.log('Cliente de WhatsApp destruido');
//     } catch (error) {
//         console.error('Error al destruir el cliente:', error);
//     }
//     process.exit(0);
// });

// app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));





require('dotenv').config();
const express = require('express');
const cors = require('cors');
const initWhatsAppClient = require('./services/whatsappService');
const clienteRoutes = require('./routes/clienteRoutes');
const vendedorRoutes = require('./routes/vendedorRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: 'http://localhost:3005',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging simple
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
});

// Rutas
app.use('/api/clientes', clienteRoutes);
app.use('/api/vendedores', vendedorRoutes);

// WhatsApp
const whatsappClient = initWhatsAppClient();

// Cierre
process.on('SIGINT', async () => {
    console.log('Cerrando servidor y cliente de WhatsApp...');
    try {
        await whatsappClient.destroy();
        console.log('Cliente de WhatsApp destruido');
    } catch (error) {
        console.error('Error al destruir el cliente:', error);
    }
    process.exit(0);
});

app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
