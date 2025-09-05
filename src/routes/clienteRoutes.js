const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

router.get('/', clienteController.obtenerClientes);
router.get('/por-vendedor', clienteController.obtenerClientesPorVendedor);
router.post('/', clienteController.crearCliente);
router.put('/:id/configuracion', clienteController.actualizarConfiguracion);
router.put('/:id/datos_personales', clienteController.actualizarDatosPersonales);
router.patch('/:id/baja', clienteController.bajaCliente); // 🟡 Borrado lógico
router.get('/ultimos', clienteController.obtenerUltimosClientes);
router.get('/ultimos-clientes/:vendedorId', clienteController.ultimosClientesPorVendedor);

router.post("/ejemplo", clienteController.crearClienteEjemplo);



module.exports = router;
