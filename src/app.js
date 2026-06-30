const express = require('express');
const cors = require('cors');
const healthRouter = require('./routes/health.routes');
const authRouter = require('./routes/auth.routes');
const habitRouter = require('./routes/habit.routes');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/habits', habitRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler must be registered LAST
app.use(errorHandler);

module.exports = app;