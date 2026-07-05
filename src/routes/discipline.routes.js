const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const disciplineController = require('../controllers/discipline.controller');

const router = express.Router();

router.use(verifyToken);

router.post('/calculate', disciplineController.calculate);
router.get('/current', disciplineController.getCurrent);
router.get('/history', disciplineController.getHistory);

module.exports = router;