const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const completionController = require('../controllers/completion.controller');

const router = express.Router();

router.use(verifyToken);

router.post('/:habitId/toggle', completionController.toggleCompletion);
router.get('/today', completionController.getTodayStatus);
router.get('/:habitId/streak', completionController.getHabitStreak);

module.exports = router;