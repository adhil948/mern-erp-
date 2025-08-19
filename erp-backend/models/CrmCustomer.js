const mongoose = require('mongoose');

const crmCustomerSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  company: { type: String, trim: true },
  address: { type: String, trim: true },
  notes: { type: String, trim: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

crmCustomerSchema.index({ orgId: 1, name: 1 }, { unique: false });

module.exports = mongoose.model('CrmCustomer', crmCustomerSchema);
