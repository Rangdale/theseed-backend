const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const profileController = require('../controllers/profile.controller');

const router = express.Router();
router.use(verifyToken);
router.get('/', profileController.getProfile);

module.exports = router;