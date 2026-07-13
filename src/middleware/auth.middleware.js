const { getAuth } = require('../config/firebase');
const userRepository = require('../repositories/user.repository');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);

    await userRepository.findOrCreateUser({
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name || null,        
      photoUrl: decodedToken.picture || null        
    });

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email
    };

    next();
  } catch (error) {
    console.error('Token verification failed:', error.code, error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { verifyToken };