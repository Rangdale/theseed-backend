const admin = require('../config/firebase');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth header received:', authHeader ? 'present' : 'missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('Token first 20 chars:', token.substring(0, 20));
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('Token verified for uid:', decodedToken.uid);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email
    };

    next();
  } catch (error) {
    // THIS is what we need to see
    console.error('Token verification failed:', error.code, error.message);
    return res.status(401).json({ 
      error: 'Invalid or expired token',
      detail: error.message  // temporarily expose this for debugging
    });
  }
};

module.exports = { verifyToken };