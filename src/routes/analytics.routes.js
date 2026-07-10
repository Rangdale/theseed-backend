const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const analyticsController = require('../controllers/analytics.controller');

const router = express.Router();
router.use(verifyToken);
router.get('/', analyticsController.getAnalytics);

module.exports = router;