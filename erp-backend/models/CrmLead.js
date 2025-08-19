const mongoose = require('mongoose');

const crmLeadSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  source: { type: String, trim: true }, // e.g., website, referral
  stage: { type: String, enum: ['new', 'contacted', 'qualified', 'lost', 'converted'], default: 'new' },
  company: { type: String, trim: true },
  notes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

crmLeadSchema.index({ orgId: 1, name: 1 });

module.exports = mongoose.model('CrmLead', crmLeadSchema);
