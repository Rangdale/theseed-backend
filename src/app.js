const express = require('express');
const cors = require('cors');

const healthRouter = require('./routes/health.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/health', healthRouter);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;