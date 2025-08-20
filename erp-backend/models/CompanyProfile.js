const mongoose = require('mongoose');

const bankSchema = new mongoose.Schema({
  accountName: { type: String, trim: true },
  accountNo: { type: String, trim: true },
  ifsc: { type: String, trim: true },
  bankName: { type: String, trim: true }
}, { _id: false });

const numberSeqSchema = new mongoose.Schema({
  prefix: { type: String, trim: true, default: 'INV-' },   // for sales invoices
  nextNumber: { type: Number, default: 1, min: 1 },
  footerNote: { type: String, trim: true },
  terms: { type: String, trim: true }
}, { _id: false });

// Optional: a separate sequence for purchases (internal receipts), add later if needed
const purchaseSeqSchema = new mongoose.Schema({
  prefix: { type: String, trim: true, default: 'PR-' },
  nextNumber: { type: Number, default: 1, min: 1 }
}, { _id: false });

const companyProfileSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  address: { type: String, trim: true },
  gstin: { type: String, trim: true },       // or taxId for non-India
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  website: { type: String, trim: true },

  // For now, keep a URL or data URL. You can add a file upload endpoint later.
  logoUrl: { type: String, trim: true },

  bank: bankSchema,

  invoice: numberSeqSchema,
  // Optional: enable later if you want internal purchase numbering
  // purchase: purchaseSeqSchema,

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('CompanyProfile', companyProfileSchema);
