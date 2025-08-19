const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const admin = require('firebase-admin');

const User = require('../models/User');
const Organization = require('../models/Organization');

/**
 * Lightweight middleware for /signin:
 * - Verifies Firebase ID token only.
 * - Attaches req.user = { uid, email, name }.
 * - Does NOT require or resolve org here.
 */
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

/**
 * Helper: compute enabledModules for a user’s active org.
 * Falls back to org.enabledModules if membership doesn’t store it.
 */
async function getEnabledModulesForActiveOrg(user) {
  if (!user.activeOrgId) return [];
  const activeOrgId = user.activeOrgId.toString();
  const membership = (user.orgMemberships || []).find(m => m.orgId.toString() === activeOrgId);
  if (membership?.enabledModules?.length) return membership.enabledModules;

  const org = await Organization.findById(activeOrgId).select('enabledModules').lean();
  return org?.enabledModules || [];
}

/**
 * POST /api/auth/signin
 * - Public except for Firebase verification.
 * - Verifies Firebase token, upserts user if first time,
 * - Returns membership status, activeOrgId, enabledModules.
 */
router.post('/signin', verifyFirebaseOnly, async (req, res) => {
  try {
    const { email, name, uid } = req.user;
    if (!email) return res.status(400).json({ message: 'Email missing in token' });

    let user = await User.findOne({ email });

    // First time user: create minimal record
    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        email,
        name,
        orgMemberships: [],
        activeOrgId: null,
        enabledModules: []
      });

      return res.status(200).json({
        message: 'New user: please create or join an organisation',
        user,
        needsOrgSelection: true,
        activeOrgId: null,
        enabledModules: []
      });
    }

    // Existing user: keep basic data updated
    let changed = false;
    if (!user.firebaseUid) { user.firebaseUid = uid; changed = true; }
    if (name && user.name !== name) { user.name = name; changed = true; }

    const hasMemberships = Array.isArray(user.orgMemberships) && user.orgMemberships.length > 0;

    // If activeOrgId not set but exactly one membership, auto-select it
    if (!user.activeOrgId && hasMemberships && user.orgMemberships.length === 1) {
      user.activeOrgId = user.orgMemberships[0].orgId;
      changed = true;
    }

    // If activeOrgId is set but not a member anymore, clear it
    if (user.activeOrgId) {
      const stillMember = user.orgMemberships.some(m => m.orgId.toString() === user.activeOrgId.toString());
      if (!stillMember) {
        user.activeOrgId = null;
        changed = true;
      }
    }

    if (changed) await user.save();

    const enabledModules = await getEnabledModulesForActiveOrg(user);

    return res.status(200).json({
      message: hasMemberships ? 'User signed in' : 'User exists but has no organisation',
      user,
      needsOrgSelection: !user.activeOrgId,
      activeOrgId: user.activeOrgId ? user.activeOrgId.toString() : null,
      enabledModules
    });
  } catch (err) {
    console.error('Error in /signin:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * Protected routes below:
 * Use the full org-aware middleware that sets req.user._id, req.user.orgId, req.user.role.
 * We’ll import it here and apply per-route to avoid blocking /signin.
 */
const authenticateFirebaseToken = require('../middleware/auth');

/**
 * Admin-check middleware for org-scoped updates.
 * Requires authenticateFirebaseToken to have set req.user.email and req.user.orgId.
 * orgId taken from params; verifies the caller is admin of that org.
 */
async function adminCheck(req, res, next) {
  try {
    const orgId = req.params.orgId;
    const userEmail = req.user.email;
    if (!mongoose.Types.ObjectId.isValid(orgId)) {
      return res.status(400).json({ message: 'Invalid organisation id' });
    }

    const user = await User.findOne({ email: userEmail });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const membership = (user.orgMemberships || []).find(m => m.orgId.toString() === orgId);
    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    next();
  } catch (err) {
    console.error('Admin check error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

/**
 * POST /api/auth/createOrg
 * - User must be authenticated.
 * - Creates an org and sets the user as admin; sets activeOrgId.
 */
router.post('/createOrg', verifyFirebaseOnly, async (req, res) => {
  try {
    const { orgName } = req.body;
    const { email } = req.user;

    if (!orgName || !orgName.trim()) {
      return res.status(400).json({ message: 'Organization name is required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const joinCode = Math.random().toString(36).substring(2, 8);

    const org = new Organization({
      name: orgName.trim(),
      enabledModules: ['sales', 'inventory', 'purchase','crm'],
      joinCode,
      createdBy: user._id
    });
    await org.save();

    user.orgMemberships.push({
      orgId: org._id,
      role: 'admin',
      enabledModules: org.enabledModules
    });
    user.activeOrgId = org._id;
    await user.save();

    return res.status(201).json({ message: 'Organization created', org, user });
  } catch (err) {
    console.error('Error creating organisation:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * POST /api/auth/joinOrg
 * - User must be authenticated.
 * - Adds membership by joinCode. Sets activeOrgId if none.
 */
router.post('/joinOrg', verifyFirebaseOnly, async (req, res) => {
  try {
    const { joinCode } = req.body;
    const { email } = req.user;

    if (!joinCode) {
      return res.status(400).json({ message: 'Join code is required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const org = await Organization.findOne({ joinCode });
    if (!org) return res.status(404).json({ message: 'Invalid join code' });

    if (user.orgMemberships.some(m => m.orgId.toString() === org._id.toString())) {
      return res.status(400).json({ message: 'Already a member of this organisation' });
    }

    user.orgMemberships.push({
      orgId: org._id,
      role: 'sales_user',
      enabledModules: org.enabledModules
    });
    if (!user.activeOrgId) user.activeOrgId = org._id;

    await user.save();
    return res.status(200).json({ message: 'Joined organization', org, user });
  } catch (err) {
    console.error('Error joining organisation:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * POST /api/auth/:orgId/users/:userId
 * - Admin-only: update a user’s role and/or enabledModules within an org.
 */
router.post('/:orgId/users/:userId', authenticateFirebaseToken, adminCheck, async (req, res) => {
  try {
    const { role, enabledModules } = req.body;
    const { orgId, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orgId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid id(s)' });
    }

    const target = await User.findById(userId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const membership = (target.orgMemberships || []).find(m => m.orgId.toString() === orgId);
    if (!membership) return res.status(404).json({ message: 'User not member of organization' });

    if (role) membership.role = role;
    if (enabledModules) membership.enabledModules = enabledModules;

    await target.save();
    return res.json({ message: 'User updated', user: target });
  } catch (err) {
    console.error('Error updating user role/modules:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Optional: set active org explicitly
 * POST /api/auth/me/active-org
 * Body: { orgId }
 */
router.post('/me/active-org', authenticateFirebaseToken, async (req, res) => {
  try {
    const { orgId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(orgId)) {
      return res.status(400).json({ message: 'Invalid organisation id' });
    }

    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const membership = (user.orgMemberships || []).find(m => m.orgId.toString() === orgId);
    if (!membership) return res.status(403).json({ message: 'Not a member of this organisation' });

    user.activeOrgId = orgId;
    await user.save();

    const enabledModules = await getEnabledModulesForActiveOrg(user);

    return res.json({
      ok: true,
      activeOrgId: user.activeOrgId.toString(),
      enabledModules
    });
  } catch (e) {
    console.error('Error setting active org:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
