const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const homeController = require('../controllers/home.controller');

const router = express.Router();
router.use(verifyToken);
router.get('/', homeController.getDashboard);

module.exports = router;