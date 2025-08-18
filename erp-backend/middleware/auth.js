const admin = require('firebase-admin');

async function authenticateFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // contains uid, email, name, etc.
    next();
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }

  const checkRole = (requiredRoles) => {
  return (req, res, next) => {
    const userEmail = req.user.email;
    const orgId = req.params.orgId || req.body.orgId;

    User.findOne({ email: userEmail }).then(user => {
      if (!user) return res.status(403).json({ message: 'User not found' });
      const membership = user.orgMemberships.find(m => m.orgId.toString() === orgId);

      if (!membership || !requiredRoles.includes(membership.role)) {
        return res.status(403).json({ message: 'Access denied: insufficient permissions' });
      }
      next();
    }).catch(err => res.status(500).json({ message: 'Server error' }));
  };
};

}

module.exports = authenticateFirebaseToken;
