const db = require('../database');

const obtenerClientes = async (req, res) => {
  try {
    const snapshot = await db.ref('clientes').once('value');
    const clientes = snapshot.val();



console.log("Clientes:: ", clientes)



    if (!clientes) return res.status(404).json({ error: 'No hay clientes registrados' });

    const listaClientes = Object.entries(clientes)
      .filter(([_, datos]) => datos.estado === 'activo')  // Solo activos
      .map(([id, datos]) => ({ id, ...datos }));

    res.status(200).json(listaClientes);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

const obtenerClientesPorVendedor = async (req, res) => {
  const { vendedorId } = req.query;

  if (!vendedorId) return res.status(400).json({ error: 'Falta el vendedorId' });

  try {
    const snapshot = await db.ref('clientes').once('value');
    const clientes = snapshot.val();

    if (!clientes) return res.status(404).json({ error: 'No hay clientes registrados' });

    const filtrados = Object.entries(clientes)
      .filter(([_, datos]) => datos.estado === 'activo' && datos.datos_personales?.vendedor === vendedorId)
      .map(([id, datos]) => ({ id, ...datos }));

    res.status(200).json(filtrados);
  } catch (error) {
    console.error('Error al obtener clientes por vendedor:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// const crearCliente = async (req, res) => {
//   const clienteData = req.body.cliente;
//   const clienteId = clienteData?.id;

//     console.log("Datos recibidos: ", req.body)

//   if (!clienteId || !clienteData.datos_personales) {
//     return res.status(400).json({ error: 'Faltan datos obligatorios' });
//   }

//     try {
//         const snapshot = await db.ref('clientes').once('value');
//         const clientes = snapshot.val();

//         console.log("Valor de clientes: ", clientes);

//         const dniIngresado = clienteData.datos_personales?.dni;
//         const celularIngresado = clienteData.datos_personales?.celular;
//         const emailIngresado = clienteData.datos_personales?.email;
//         const dispositivoIngresado = clienteData.configuracion?.dispositivo_id;
        
//         let errorDuplicado = null;

//         Object.values(clientes || {}).forEach(cliente => {
//             const datos = cliente.datos_personales || {};
//             const config = cliente.configuracion || {};

//             if (dniIngresado && datos.dni === dniIngresado) errorDuplicado = 'dni';
//             else if (celularIngresado && datos.celular === celularIngresado) errorDuplicado = 'celular';
//             else if (emailIngresado && datos.email === emailIngresado) errorDuplicado = 'email';
//             else if (config.dispositivo_id === dispositivoIngresado) errorDuplicado = 'dispositivo_id';
//         });

//         if (errorDuplicado) {
//             return res.status(409).json({ error: `El campo "${errorDuplicado}" ya está en uso.` });
//         }

//         // Generar nodos de cámaras
//         const camaras = {};
//         for (let i = 1; i <= 6; i++) {
//           camaras[`camara${i}`] = {
//             nombre: `Cámara ${i}`,
//             usuario: `user${i}`,
//             contraseña: `pass${i}_${Math.floor(Math.random() * 1000)}`, // Contraseña aleatoria
//             ipLocal: `192.168.1.${100 + i}`, // IP de ejemplo
//             puertoGlobal: 5000 + i, // Puerto de ejemplo
//           };
//         }



//     // Configuración por defecto con cámaras
//     const configuracionPorDefecto = {
//       contactos: {
//         "5491122334455": { name: "Juan Perez", state: false }
//       },
//       datos: {
//         estadoAlarma: false,
//         estadoSirena: false,
//         modoSilencioso: false
//       },
//       horarios_alarma: {
//         inicio: "00:00",
//         fin: "23:59",
//         state: false
//       },
//       variables: {
//         variable1: { name: "Sensor_1", silence: false, state: false },
//         variable2: { name: "Sensor_2", silence: false, state: false },
//         variable3: { name: "Sensor_3", silence: false, state: false },
//         variable4: { name: "Sensor_4", silence: false, state: false },
//         variable5: { name: "Sensor_5", silence: false, state: false },
//         variable6: { name: "Sensor_6", silence: false, state: false }
//       },
//       camaras, // Añadimos las cámaras aquí
//     };



//         const clienteFinal = {
//             ...clienteData,
//             configuracion: {
//               ...configuracionPorDefecto,
//               dispositivo_id: dispositivoIngresado,
//             },
//             estado: 'activo',
//             fecha_alta: [new Date().toISOString()],
//             fecha_baja: [],
//         };

        
        
//     const ref = db.ref(`clientes/${clienteId}`);
   

//         await ref.set(clienteFinal);
//         res.status(201).json({ message: 'Cliente creado', id: clienteId });

//     } catch (error) {
//         console.error('Error al crear cliente:', error);
//         res.status(500).json({ error: 'Error en el servidor' });
//     }

// };

const crearCliente = async (req, res) => {
  const clienteData = req.body.cliente;
  const clienteId = clienteData?.id;

  console.log("Datos recibidos: ", req.body);

  if (!clienteId || !clienteData.datos_personales) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    const snapshot = await db.ref('clientes').once('value');
    const clientes = snapshot.val();

    console.log("Valor de clientes: ", clientes);

    const dniIngresado = clienteData.datos_personales?.dni;
    const celularIngresado = clienteData.datos_personales?.celular;
    const emailIngresado = clienteData.datos_personales?.email;
    const dispositivoIngresado = clienteData.configuracion?.dispositivo_id;

    let errorDuplicado = null;

    Object.values(clientes || {}).forEach(cliente => {
      const datos = cliente.datos_personales || {};
      const config = cliente.configuracion || {};

      if (dniIngresado && datos.dni === dniIngresado) errorDuplicado = 'dni';
      else if (celularIngresado && datos.celular === celularIngresado) errorDuplicado = 'celular';
      else if (emailIngresado && datos.email === emailIngresado) errorDuplicado = 'email';
      else if (dispositivoIngresado && config.dispositivo_id === dispositivoIngresado) errorDuplicado = 'dispositivo_id';
    });

    if (errorDuplicado) {
      return res.status(409).json({ error: `El campo "${errorDuplicado}" ya está en uso.` });
    }

    // Generar nodos de cámaras
    const camaras = {};
    const camaraIds = [];
    for (let i = 1; i <= 6; i++) {
      const camaraId = `camara${i}_${clienteId.slice(-4)}`; // ID único por cliente
      camaras[camaraId] = {
        nombre: `Cámara ${i}`,
        usuario: `user${i}`,
        contraseña: `pass${i}_${Math.floor(Math.random() * 1000)}`,
        ipLocal: `192.168.1.${100 + i}`,
        puertoGlobal: 5000 + i,
      };
      camaraIds.push(camaraId); // Almacenar IDs para asignar a variables
    }

    // Configuración por defecto con cámaras y previousState en todas las variables
    const configuracionPorDefecto = {
      contactos: {
        "5491122334455": { name: "Juan Perez", state: false }
      },
      datos: {
        estadoAlarma: false,
        estadoSirena: false,
        modoSilencioso: false
      },
      horarios_alarma: {
        inicio: "00:00",
        fin: "23:59",
        state: false
      },
      variables: {
        variable1: { name: "Sensor_1", silence: false, state: false, camaras: [], previousState: false },
        variable2: { name: "Sensor_2", silence: false, state: false, camaras: [], previousState: false },
        variable3: { name: "Sensor_3", silence: false, state: false, camaras: [], previousState: false },
        variable4: { name: "Sensor_4", silence: false, state: false, camaras: [], previousState: false },
        variable5: { name: "Sensor_5", silence: false, state: false, camaras: [], previousState: false },
        variable6: { name: "Sensor_6", silence: false, state: false, camaras: [], previousState: false },
        variable7: { name: "SensorRF_7", silence: false, state: false, camaras: [], previousState: false },
        variable8: { name: "SensorRF_8", silence: false, state: false, camaras: [], previousState: false },
        variable9: { name: "SensorRF_9", silence: false, state: false, camaras: [], previousState: false },
        variable10: { name: "SensorRF_10", silence: false, state: false, camaras: [], previousState: false }
      },
      camaras, // Nodo de cámaras
    };

    const clienteFinal = {
      ...clienteData,
      configuracion: {
        ...configuracionPorDefecto,
        dispositivo_id: dispositivoIngresado,
      },
      estado: 'activo',
      fecha_alta: [new Date().toISOString()],
      fecha_baja: [],
    };

    const ref = db.ref(`clientes/${clienteId}`);
    await ref.set(clienteFinal);

    res.status(201).json({ message: 'Cliente creado', id: clienteId });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};



const actualizarConfiguracion = async (req, res) => {
  const { id } = req.params;
  const nuevaConfig = req.body.configuracion;

  try {
    await db.ref(`clientes/${id}/configuracion`).set(nuevaConfig);
    res.status(200).json({ message: 'Configuración actualizada' });
  } catch (error) {
    console.error('Error al actualizar config:', error);
    res.status(500).json({ error: 'Error al guardar configuración' });
  }
};

const actualizarDatosPersonales = async (req, res) => {
  const { id } = req.params;
  const nuevosDatos = req.body;

  try {
    await db.ref(`clientes/${id}/datos_personales`).set(nuevosDatos);
    res.status(200).json({ message: 'Datos personales actualizados' });
  } catch (error) {
    console.error('Error al actualizar datos personales:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

const bajaCliente = async (req, res) => {
    console.log("Dentro de BAJA!!")
  const { id } = req.params;

    console.log("Id para dar de baja: ", req)


  try {
    const ref = db.ref(`clientes/${id}`);
    const snapshot = await ref.once('value');

    if (!snapshot.exists()) return res.status(404).json({ error: 'Cliente no encontrado' });

    const cliente = snapshot.val();
    const hoy = new Date().toISOString();

    const fecha_baja = cliente.fecha_baja || [];
    fecha_baja.push(hoy);

    await ref.update({
      estado: 'inactivo',
      fecha_baja,
    });

    res.status(200).json({ message: 'Cliente dado de baja' });
  } catch (error) {
    console.error('Error al dar de baja:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};


const obtenerUltimosClientes = async (req, res) => {
  try {
    const snapshot = await db.ref('clientes').once('value');
    const data = snapshot.val();

    if (!data) return res.status(404).json({ error: 'No hay clientes' });

    const clientes = Object.entries(data)
      .map(([id, datos]) => ({
        id,
        nombre: datos.datos_personales?.nombre || '',
        apellido: datos.datos_personales?.apellido || '',
        fecha: datos.fecha_alta?.[0] || '',
        estado: datos.estado || '',
        // dispositivo: datos.datos_personales?.dispositivoID || ''
        dispositivo: datos.configuracion?.dispositivo_id || ''

      }))
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha)) // ordenar por fecha desc
      .slice(0, 5); // los 5 últimos

    res.status(200).json(clientes);
  } catch (error) {
    console.error('Error al obtener últimos clientes:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const ultimosClientesPorVendedor = async (req, res) => {
  const { vendedorId } = req.params;

  try {
    const snapshot = await db.ref('clientes').once('value');
    const todos = snapshot.val();

    if (!todos) return res.status(404).json({ error: 'No hay clientes' });

    const clientes = Object.entries(todos)
      .filter(([_, datos]) => datos.datos_personales?.vendedor === vendedorId)
      .map(([id, datos]) => {
        const fechaAlta = datos.fecha_alta?.slice(-1)[0]; // Última fecha alta
        const fechaBaja = datos.fecha_baja?.slice(-1)[0]; // Última fecha baja
        return {
          id,
          nombre: `${datos.datos_personales?.nombre} ${datos.datos_personales?.apellido}`,
          ciudad: `${datos.datos_personales?.ciudad}`,
          estado: datos.estado,
          fecha: datos.estado === 'activo' ? fechaAlta : fechaBaja
        };
      })
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha)) // Más recientes primero
      .slice(0, 10); // Solo los últimos 10

    res.status(200).json(clientes);
  } catch (error) {
    console.error('Error al traer últimos clientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};


const crearClienteEjemplo = async (req, res) => {
  try {
    const clienteId = 'CLI-12345678-3241'; // podés usar un generador UUID si querés que sea dinámico
    const hoy = new Date().toISOString();

    const clienteEjemplo = {
      id: clienteId,
      datos_personales: {
        nombre: 'Ejemplo',
        apellido: 'Test',
        dni: '12345678',
        email: 'ejemplo@test.com',
        direccion: 'Calle Falsa 123',
        cp: '1000',
        ciudad: 'Buenos Aires',
        provincia: 'Buenos Aires',
        celular: '1133445566',
        vendedor: 'VEN-TEST'
      },
      configuracion: {
        dispositivo_id: 'DISP-EJEMPLO',
        contactos: {
          '5491122334455': {
            name: 'Contacto Falso',
            state: false
          }
        },
        datos: {
          estadoAlarma: false,
          estadoSirena: false,
          modoSilencioso: false
        },
        horarios_alarma: {
          inicio: '00:00',
          fin: '23:59',
          state: false
        },
        variables: {
          variable1: { name: 'Sensor_1', silence: false, state: false },
          variable2: { name: 'Sensor_2', silence: false, state: false },
          variable3: { name: 'Sensor_3', silence: false, state: false },
          variable4: { name: 'Sensor_4', silence: false, state: false },
          variable5: { name: 'Sensor_5', silence: false, state: false },
          variable6: { name: 'Sensor_6', silence: false, state: false }
        }
      },
      estado: 'activo',
      fecha_alta: [hoy],
      fecha_baja: []
    };

    await db.ref(`clientes/${clienteId}`).set(clienteEjemplo);

    res.status(201).json({ message: 'Cliente de ejemplo creado', id: clienteId });
  } catch (error) {
    console.error('Error al crear cliente de ejemplo:', error);
    res.status(500).json({ error: 'Error del servidor al crear cliente de prueba' });
  }
};









module.exports = {
  obtenerClientes,
  obtenerClientesPorVendedor,
  crearCliente,
  actualizarConfiguracion,
  actualizarDatosPersonales,
  bajaCliente,
  obtenerUltimosClientes,
  ultimosClientesPorVendedor,
  crearClienteEjemplo
};
