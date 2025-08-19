const admin = require('firebase-admin');
const mongoose = require('mongoose');
const User = require('../models/User');

function isValidObjectId(id) {
  return typeof id === 'string' && mongoose.Types.ObjectId.isValid(id);
}

async function authenticateFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    // 1) Verify Firebase ID token (must be Firebase ID token, not Google accessToken)
    const decodedToken = await admin.auth().verifyIdToken(token);
    // decodedToken: { uid, email, name, ... }
    req.user = { uid: decodedToken.uid, email: decodedToken.email, ...decodedToken };

    // 2) Load your app user by email or uid
    const email = decodedToken.email?.toLowerCase();
    let appUser = null;

    if (email) {
      appUser = await User.findOne({ email });
    }
    if (!appUser && decodedToken.uid) {
      appUser = await User.findOne({ firebaseUid: decodedToken.uid });
    }
    if (!appUser) {
      return res.status(403).json({ message: 'User not found in app' });
    }

    // 3) Resolve active orgId: header -> stored activeOrgId -> single membership
    let activeOrgId = req.header('X-Org-Id');

    if (!activeOrgId && appUser.activeOrgId) {
      activeOrgId = appUser.activeOrgId.toString();
    }

    if (
      !activeOrgId &&
      Array.isArray(appUser.orgMemberships) &&
      appUser.orgMemberships.length === 1
    ) {
      // FIX: use [0], not .orgMemberships.orgId
      activeOrgId = appUser.orgMemberships.orgId.toString();
    }

    if (!activeOrgId) {
      return res.status(400).json({
        message: 'Active organisation not set. Provide X-Org-Id header or set activeOrgId.',
      });
    }

    if (!isValidObjectId(activeOrgId)) {
      return res.status(400).json({ message: 'Invalid organisation id format' });
    }

    // 4) Validate membership in that org
    const membership = (appUser.orgMemberships || []).find(
      (m) => m.orgId.toString() === activeOrgId
    );
    if (!membership) {
      return res.status(403).json({
        message: 'Access denied: not a member of the specified organisation',
      });
    }

    // 5) Attach app user and org info for downstream routes
    req.appUser = appUser;
    req.user._id = appUser._id; // keep backward compatibility in routes
    req.user.orgId = new mongoose.Types.ObjectId(activeOrgId);
    req.user.role = membership.role;

    return next();
  } catch (error) {
    // This catch also includes verifyIdToken failures
    console.error('Auth error:', error);
    return res.status(401).json({
      message: 'Unauthorized: Invalid token',
      // Optional: in dev, you could add error details, but avoid in prod
      // details: error?.message,
    });
  }
}

module.exports = authenticateFirebaseToken;
