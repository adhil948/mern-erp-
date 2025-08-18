const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
  name: { type: String, required: true, trim: true },
  sku: { type: String, trim: true, index: true }, // optional unique code per org
  price: { type: Number, required: true, min: 0 },
  category: { type: String, trim: true },
  stock: { type: Number, required: true, min: 0, default: 0 }, // live stock
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

productSchema.index({ orgId: 1, name: 1 }, { unique: true }); // prevent duplicate product names in same org

module.exports = mongoose.model('Product', productSchema);
