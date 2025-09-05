const express = require('express');
const router = express.Router();
const vendedorCtrl = require('../controllers/vendedorController');

router.post('/register', vendedorCtrl.registrarVendedor);
router.post('/login', vendedorCtrl.loginVendedor);
router.put('/:id/baja-logica', vendedorCtrl.bajaLogicaVendedor); // 🧨 Nuevo

module.exports = router;
