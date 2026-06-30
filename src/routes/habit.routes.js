const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const habitController = require('../controllers/habit.controller');

const router = express.Router();

// All habit routes require authentication
router.use(verifyToken);

router.post('/', habitController.createHabit);
router.get('/', habitController.getHabits);
router.get('/:id', habitController.getHabit);
router.put('/:id', habitController.updateHabit);
router.delete('/:id', habitController.deleteHabit);

module.exports = router;