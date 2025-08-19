const mongoose = require('mongoose');

const crmContactSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  company: { type: String, trim: true },
  role: { type: String, trim: true }, // job title
  address: { type: String, trim: true },
  notes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

crmContactSchema.index({ orgId: 1, email: 1 });

module.exports = mongoose.model('CrmContact', crmContactSchema);
