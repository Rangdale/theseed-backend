const admin = require('firebase-admin');
const { getApps, initializeApp, cert } = require('firebase-admin/app');

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  serviceAccount = require('./serviceAccountKey.json');
}

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

module.exports = admin;