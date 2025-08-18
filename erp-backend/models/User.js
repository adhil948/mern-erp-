const mongoose = require('mongoose');


const OrgMembershipSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  role: { type: String, enum: ['admin', 'sales_user', 'purchase_user', 'inventory_user'], default: 'sales_user' },
  enabledModules: [{ type: String }],
  joinedAt: { type: Date, default: Date.now }  // NEW
});

const UserSchema = new mongoose.Schema({
  firebaseUid: { type: String, unique: true }, // NEW (optional but useful)
  email: { type: String, required: true, unique: true },
  name: { type: String },
  activeOrgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }, // NEW
  orgMemberships: [OrgMembershipSchema],
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
