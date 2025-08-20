const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  mode: { type: String, required: true, enum: ['cash','card','upi','bank','wallet','credit'] },
  amount: { type: Number, required: true, min: 0 },
  refNo: { type: String, trim: true },
  note: { type: String, trim: true }
}, { _id: false });

const cashBillSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  saleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true, index: true },
  billNo: { type: String, trim: true, index: true }, // CB-0001 etc.
  date: { type: Date, default: Date.now },
  payments: { type: [paymentSchema], default: [] },
  totalPaid: { type: Number, default: 0, min: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

cashBillSchema.index({ orgId: 1, saleId: 1 });

module.exports = mongoose.model('CashBill', cashBillSchema);
