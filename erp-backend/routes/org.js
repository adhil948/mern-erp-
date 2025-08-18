const express = require('express');
const router = express.Router();
const Organization = require('../models/Organization');
const User = require('../models/User');
const authenticateFirebaseToken = require('../middleware/auth');

// Middleware to check if user is admin for the active org
async function adminCheck(req, res, next) {
  const userEmail = req.user.email;
  const orgId = req.params.orgId || req.body.orgId;

  const user = await User.findOne({ email: userEmail });
  if (!user) return res.status(403).json({ message: 'User not found' });

  const membership = user.orgMemberships.find(m => m.orgId.toString() === orgId);
  if (!membership || membership.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
}

// GET /api/org/:orgId/modules - Get enabled modules for org
router.get('/:orgId/modules', authenticateFirebaseToken, async (req, res) => {
  try {
    const org = await Organization.findById(req.params.orgId);
    if (!org) return res.status(404).json({ message: 'Organization not found' });
    res.json({ enabledModules: org.enabledModules });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/org/:orgId/modules - Update enabled modules for org (Admin only)
router.post('/:orgId/modules', authenticateFirebaseToken, adminCheck, async (req, res) => {
  try {
    const { enabledModules } = req.body;
    const org = await Organization.findByIdAndUpdate(req.params.orgId, { enabledModules }, { new: true });
    res.json({ message: 'Modules updated', enabledModules: org.enabledModules });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/org/:orgId/users - List users in the org with roles
router.get('/:orgId/users', authenticateFirebaseToken, adminCheck, async (req, res) => {
  try {
    const users = await User.find({ 'orgMemberships.orgId': req.params.orgId }, { email: 1, name:1, orgMemberships: 1 });
    const filtered = users.map(user => {
      const membership = user.orgMemberships.find(m => m.orgId.toString() === req.params.orgId);
      return { _id: user._id, email: user.email, name: user.name, role: membership.role, enabledModules: membership.enabledModules };
    });
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/org/:orgId - Get org details (join code, name, etc.)
router.get('/:orgId', authenticateFirebaseToken, async (req, res) => {
  try {
    const org = await Organization.findById(req.params.orgId);
    if (!org) return res.status(404).json({ message: 'Organization not found' });
    // Limit what you send to frontend for security
    res.json({ name: org.name, joinCode: org.joinCode });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});



// POST /api/org/:orgId/users/:userId - Update user's role and modules (Admin only)
router.post('/:orgId/users/:userId', authenticateFirebaseToken, adminCheck, async (req, res) => {
  try {
    const { role, enabledModules } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Find membership
    const membership = user.orgMemberships.find(m => m.orgId.toString() === req.params.orgId);
    if (!membership) return res.status(404).json({ message: 'User not member of organization' });

    membership.role = role || membership.role;
    membership.enabledModules = enabledModules || membership.enabledModules;
    await user.save();

    res.json({ message: 'User updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
