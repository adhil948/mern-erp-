const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  costPrice: { type: Number, required: true, min: 0 }
}, { _id: false });

const purchaseSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  billNumber: { type: String, trim: true },
  date: { type: Date, default: Date.now },
  items: { type: [purchaseItemSchema], required: true, validate: v => Array.isArray(v) && v.length > 0 },
  subTotal: { type: Number, required: true, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  notes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

purchaseSchema.index({ orgId: 1, date: -1 });
purchaseSchema.index({ orgId: 1, supplierId: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
