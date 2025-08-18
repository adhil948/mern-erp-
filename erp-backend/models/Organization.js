const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String },
  gstNumber: { type: String },
  financialYearStart: { type: Date },
  enabledModules: [{ type: String }],  // e.g. 'sales', 'purchase', 'inventory'

  // NEW: unique join code for "join existing org" flow
  joinCode: { type: String, unique: true, required: true },

  // OPTIONAL: track who created the org
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Organization', OrganizationSchema);
