const express = require('express');
const cors = require('cors');
const healthRouter = require('./routes/health.routes');
const authRouter = require('./routes/auth.routes');
const habitRouter = require('./routes/habit.routes');
const { errorHandler } = require('./middleware/error.middleware');
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
const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`${req.method} ${req.originalUrl} → ${res.statusCode}`);
    });
    next();
});

app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/habits', habitRouter);
app.use('/completions', completionRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler must be registered LAST
app.use(errorHandler);

module.exports = app;