const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Public route — no token needed
router.get('/ping', (req, res) => {
  res.json({ message: 'Auth router is up' });
});

// Protected route — requires valid Firebase token
router.get('/me', verifyToken, (req, res) => {
  res.json({
    message: 'Token is valid',
    user: req.user
  });
});

module.exports = router;