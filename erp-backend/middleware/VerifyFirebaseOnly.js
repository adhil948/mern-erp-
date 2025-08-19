const admin = require('firebase-admin');

async function verifyFirebaseOnly(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) return res.status(401).json({ message: 'Missing id token' });

    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = {
      uid: decoded.uid,
      email: decoded.email?.toLowerCase() || null,
      name: decoded.name || ''
    };
    return next();
  } catch (e) {
    console.error('verifyFirebaseOnly error:', e);
    return res.status(403).json({ message: 'Forbidden: invalid token' });
  }
}

module.exports = verifyFirebaseOnly;
