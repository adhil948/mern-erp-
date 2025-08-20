const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const CashBill = require('../models/CashBill');
const Sale = require('../models/Sale');
const CompanyProfile = require('../models/CompanyProfile');
const auth = require('../middleware/auth');

// CREATE cash bill (multi-mode payments)
router.post('/', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { saleId, payments, date } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(saleId)) throw new Error('Invalid saleId');
    if (!Array.isArray(payments) || payments.length === 0) throw new Error('payments must be a non-empty array');

    for (let i=0; i<payments.length; i++) {
      const p = payments[i];
      if (!p.mode) throw new Error(`payments[${i}].mode is required`);
      if (typeof p.amount !== 'number' || p.amount <= 0) throw new Error(`payments[${i}].amount must be > 0`);
    }

    const sale = await Sale.findOne({ _id: saleId, orgId: req.user.orgId }).session(session);
    if (!sale) throw new Error('Sale not found');

    const totalPaid = payments.reduce((a,b)=>a + Number(b.amount||0), 0);

    // Optional: prevent overpayment
    const remaining = Number(sale.total || 0) - Number(sale.paymentsTotal || 0);
    if (totalPaid > remaining + 0.0001) { // small epsilon
      throw new Error('Total payment exceeds remaining due amount');
    }

    // Generate billNo using CompanyProfile.cash sequence (or fallback)
    const profile = await CompanyProfile.findOne({ orgId: req.user.orgId }).session(session);
    if (!profile) throw new Error('Company profile not set');

    if (!profile.cash) {
      profile.cash = { prefix: 'CB-', nextNumber: 1 };
    }
    const cbPrefix = profile.cash.prefix || 'CB-';
    const cbNextNo = profile.cash.nextNumber || 1;
    const billNo = `${cbPrefix}${String(cbNextNo).padStart(4, '0')}`;

    profile.cash.nextNumber = cbNextNo + 1;
    await profile.save({ session });

    const [cashBill] = await CashBill.create([{
      orgId: req.user.orgId,
      saleId: sale._id,
      billNo,
      date: date ? new Date(date) : new Date(),
      payments,
      totalPaid,
      createdBy: req.user._id
    }], { session });

    // Update sale payment summary
    const newTotalPaid = (sale.paymentsTotal || 0) + totalPaid;
    sale.paymentsTotal = newTotalPaid;
    if (newTotalPaid >= sale.total - 0.0001) sale.paymentStatus = 'paid';
    else if (newTotalPaid > 0) sale.paymentStatus = 'partial';
    else sale.paymentStatus = 'unpaid';

    await sale.save({ session });

    await session.commitTransaction();
    res.status(201).json(cashBill);
  } catch (e) {
    await session.abortTransaction();
    res.status(400).json({ error: e.message || 'Failed to create cash bill' });
  } finally {
    session.endSession();
  }
});

// LIST by sale
router.get('/', auth, async (req, res) => {
  try {
    const { saleId } = req.query;
    const filter = { orgId: req.user.orgId };
    if (saleId) {
      if (!mongoose.Types.ObjectId.isValid(saleId)) {
        return res.status(400).json({ error: 'Invalid saleId' });
      }
      filter.saleId = saleId;
    }
    const list = await CashBill.find(filter).sort({ date: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to fetch cash bills' });
  }
});

// GET one
router.get('/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const bill = await CashBill.findOne({ _id: id, orgId: req.user.orgId });
    if (!bill) return res.status(404).json({ error: 'Not found' });
    res.json(bill);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to fetch cash bill' });
  }
});

module.exports = router;
