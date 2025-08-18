const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Organization = require('../models/Organization');
const authenticateFirebaseToken = require('../middleware/auth');

// Middleware: Check if current user is admin in given org
async function adminCheck(req, res, next) {
  try {
    const orgId = req.params.orgId;
    const userEmail = req.user.email;

    const user = await User.findOne({ email: userEmail });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const membership = user.orgMemberships.find(m => m.orgId.toString() === orgId);
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
 * Update a user's role or modules in given org (admin only)
 */
router.post('/:orgId/users/:userId', authenticateFirebaseToken, adminCheck, async (req, res) => {
  try {
    const { role, enabledModules } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const membership = user.orgMemberships.find(m => m.orgId.toString() === req.params.orgId);
    if (!membership) return res.status(404).json({ message: 'User not member of organization' });

    if (role) membership.role = role;
    if (enabledModules) membership.enabledModules = enabledModules;

    await user.save();
    return res.json({ message: 'User updated', user });
  } catch (err) {
    console.error('Error updating user role/modules:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Create new organization and set current user as admin
 */
router.post('/createOrg', authenticateFirebaseToken, async (req, res) => {
  try {
    const { orgName } = req.body;
    const { email } = req.user;

    if (!orgName || !orgName.trim()) {
      return res.status(400).json({ message: 'Organization name is required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate a join code
    const joinCode = Math.random().toString(36).substring(2, 8);

    // Create org
    const org = new Organization({
      name: orgName.trim(),
      enabledModules: ['sales'],
      joinCode,
      createdBy: user._id
    });
    await org.save();

    // Add admin membership
    user.orgMemberships.push({
      orgId: org._id,
      role: 'admin',
      enabledModules: ['sales']
    });
    // Set active org automatically for this user
    user.activeOrgId = org._id;
    await user.save();

    return res.status(201).json({ message: 'Organization created', org, user });
  } catch (err) {
    console.error('Error creating organisation:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * Join an existing organization by joinCode
 */
router.post('/joinOrg', authenticateFirebaseToken, async (req, res) => {
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

    // Check already a member
    if (user.orgMemberships.some(m => m.orgId.toString() === org._id.toString())) {
      return res.status(400).json({ message: 'Already a member of this organisation' });
    }

    // Add membership with default role
    user.orgMemberships.push({
      orgId: org._id,
      role: 'sales_user',
      enabledModules: org.enabledModules
    });
    // Optionally set activeOrgId to this org if none
    if (!user.activeOrgId) {
      user.activeOrgId = org._id;
    }

    await user.save();
    return res.status(200).json({ message: 'Joined organization', org, user });
  } catch (err) {
    console.error('Error joining organisation:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * Sign in endpoint (Google OAuth via Firebase token)
 */
router.post('/signin', authenticateFirebaseToken, async (req, res) => {
  try {
    const { email, name, uid } = req.user;
    let user = await User.findOne({ email });

    if (!user) {
      // First time login — create basic user record (no org yet)
      user = new User({
        firebaseUid: uid,
        email,
        name,
        orgMemberships: [],
        activeOrgId: null
      });
      await user.save();

      console.log('user dont exists needorg true',user)
      return res.status(200).json({
        message: 'New user, needs to create or join an organisation',
        user,
        needsOrgSelection: true
      });
    }

    if (!user.orgMemberships || user.orgMemberships.length === 0) {
      console.log('user exists needorg true')
      return res.status(200).json({
        message: 'User exists but has no organisation memberships',
        user,
        needsOrgSelection: true
      });
    }

    
    console.log('user exists needorg false')
    return res.status(200).json({
      message: 'User exists',
      user,
      needsOrgSelection: false
    });
  } catch (err) {
    console.error('Error in /signin:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
