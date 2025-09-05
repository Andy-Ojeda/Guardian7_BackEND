const db = require('../database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 🔐 Registro de Vendedor
const registrarVendedor = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      dni,
      nacimiento,
      celular,
      email,
      password,
      registerPass
    } = req.body;

    if (!nombre || !apellido || !dni || !nacimiento || !celular || !email || !password || !registerPass) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const passSnapshot = await db.ref('data/reg/pass').once('value');
    const validPass = passSnapshot.val();

    if (registerPass !== validPass) {
      return res.status(403).json({ error: 'Clave de registro incorrecta' });
    }

    const vendedorId = `VEN-${dni}-${Math.floor(Math.random() * 1000)}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    const vendedorData = {
      datos: {
        nombre,
        apellido,
        dni,
        nacimiento,
        celular,
        email,
        password: hashedPassword,
        id: vendedorId,
        estado: 'activo',
        fecha_alta: [new Date().toISOString()],
        fecha_baja: []
      }
    };

    await db.ref(`vendedores/${vendedorId}`).set(vendedorData);

    res.status(201).json({ message: 'Vendedor registrado exitosamente', id: vendedorId });
  } catch (error) {
    console.error('Error al registrar vendedor:', error);
    res.status(500).json({ error: 'Error en el servidor al registrar vendedor' });
  }
};

// 🔑 Login de Vendedor
const loginVendedor = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password obligatorios' });
    }

    const snapshot = await db.ref('vendedores').once('value');
    const vendedores = snapshot.val();

    if (!vendedores) return res.status(404).json({ error: 'No hay vendedores registrados' });

    let vendedor = null;
    let vendedorId = null;

    for (const id in vendedores) {
      if (vendedores[id].datos.email === email) {
        vendedor = vendedores[id].datos;
        vendedorId = id;
        break;
      }
    }

    if (!vendedor) return res.status(401).json({ error: 'Correo no registrado' });

    const match = await bcrypt.compare(password, vendedor.password);
    if (!match) return res.status(401).json({ error: 'Password incorrecta' });

    const token = jwt.sign(
      {
        id: vendedorId,
        nombre: vendedor.nombre,
        email: vendedor.email
      },
      process.env.JWT_SECRET || 'clave-secreta',
      { expiresIn: '2h' }
    );

    res.status(200).json({
      message: 'Inicio de sesión exitoso',
      token,
      vendedor: {
        id: vendedorId,
        nombre: vendedor.nombre,
        email: vendedor.email
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// 📉 Borrado lógico de vendedor
const bajaLogicaVendedor = async (req, res) => {
  const { id } = req.params;
  try {
    const ref = db.ref(`vendedores/${id}/datos`);
    await ref.update({
      estado: 'baja',
      fecha_baja: db.ServerValue.TIMESTAMP
    });
    res.status(200).json({ message: 'Vendedor dado de baja' });
  } catch (error) {
    res.status(500).json({ error: 'Error en baja lógica' });
  }
};

module.exports = {
  registrarVendedor,
  loginVendedor,
  bajaLogicaVendedor
};
