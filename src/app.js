const express = require('express');
const cors = require('cors');
const healthRouter = require('./routes/health.routes');
const authRouter = require('./routes/auth.routes');
const habitRouter = require('./routes/habit.routes');
const completionRouter = require('./routes/completion.routes');
const { errorHandler } = require('./middleware/error.middleware');
const disciplineRouter = require('./routes/discipline.routes');
const homeRouter = require('./routes/home.routes');
const analyticsRouter = require('./routes/analytics.routes');

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
app.use('/discipline', disciplineRouter);
app.use('/home', homeRouter);
app.use('/analytics', analyticsRouter);

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;