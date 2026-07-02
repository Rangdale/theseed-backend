const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const completionController = require('../controllers/completion.controller');

const router = express.Router();

router.use(verifyToken);

// Toggle completion for a specific habit (today)
router.post('/:habitId/toggle', completionController.toggleCompletion);

// Get all habit IDs completed today
router.get('/today', completionController.getTodayStatus);

// Get streak for a specific habit
router.get('/:habitId/streak', completionController.getHabitStreak);

module.exports = router;