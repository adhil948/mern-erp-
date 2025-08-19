const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  date: { type: Date, default: Date.now },
  // New relational link to CRM customer
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'CrmCustomer' },
  // Optional legacy/display customer name
  customer: { type: String, trim: true },
  items: { type: [saleItemSchema], required: true, validate: v => Array.isArray(v) && v.length > 0 },
  total: { type: Number, required: true, min: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Helpful indexes
saleSchema.index({ orgId: 1, date: -1 });
saleSchema.index({ orgId: 1, customerId: 1 });

module.exports = mongoose.model('Sale', saleSchema);
