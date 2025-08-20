const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  date: { type: Date, default: Date.now },

  // New: server-generated invoice number (per org)
  invoiceNo: { type: String, trim: true, index: true },

  // Customer linkage (as you added)
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'CrmCustomer' },
  customer: { type: String, trim: true }, // optional display/legacy

  items: { type: [saleItemSchema], required: true, validate: v => Array.isArray(v) && v.length > 0 },
  total: { type: Number, required: true, min: 0 },

  // New: payment summary (cash bills will update these)
  paymentsTotal: { type: Number, default: 0, min: 0 },
  paymentStatus: { type: String, enum: ['unpaid','partial','paid'], default: 'unpaid' },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Helpful indexes
saleSchema.index({ orgId: 1, date: -1 });
saleSchema.index({ orgId: 1, invoiceNo: 1 }, { unique: false }); // set true if you guarantee uniqueness per org

module.exports = mongoose.model('Sale', saleSchema);
