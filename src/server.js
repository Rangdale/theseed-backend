console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Firebase SA exists:', !!process.env.FIREBASE_SERVICE_ACCOUNT);
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});