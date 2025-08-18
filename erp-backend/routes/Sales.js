const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const { adjustStockBulk } = require('../utils/stock');
const auth = require('../middleware/auth');

// CREATE sale
router.post('/', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { customer, items, total, date } = req.body;

    // validate items productId belongs to same org (optional but safer)
    const sale = await Sale.create([{
      orgId: req.user.orgId,
      customer,
      items,
      total,
      date: date || new Date(),
      createdBy: req.user._id
    }], { session });
    
    // decrement stock
    const ops = items.map(i => ({ productId: i.productId, diff: -Math.abs(i.quantity) }));
    await adjustStockBulk(req.user.orgId, ops, session);

    await session.commitTransaction();
    res.status(201).json(sale[0]);
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ error: err.message });
  } finally {
    session.endSession();
  }
});

// UPDATE sale (recalculate stock delta)
router.put('/:id', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const existing = await Sale.findOne({ _id: req.params.id, orgId: req.user.orgId }).session(session);
    if (!existing) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Sale not found' });
    }

    const { customer, items, total, date } = req.body;

    // revert previous stock
    const revertOps = existing.items.map(i => ({ productId: i.productId, diff: +Math.abs(i.quantity) }));
    await adjustStockBulk(req.user.orgId, revertOps, session);

    // apply new stock
    const applyOps = items.map(i => ({ productId: i.productId, diff: -Math.abs(i.quantity) }));
    await adjustStockBulk(req.user.orgId, applyOps, session);

    existing.customer = customer ?? existing.customer;
    existing.items = items ?? existing.items;
    existing.total = total ?? existing.total;
    existing.date = date ?? existing.date;
    const saved = await existing.save({ session });

    await session.commitTransaction();
    res.json(saved);
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ error: err.message });
  } finally {
    session.endSession();
  }
});

// DELETE sale (restore stock)
router.delete('/:id', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const sale = await Sale.findOne({ _id: req.params.id, orgId: req.user.orgId }).session(session);
    if (!sale) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Sale not found' });
    }

    const restoreOps = sale.items.map(i => ({ productId: i.productId, diff: +Math.abs(i.quantity) }));
    await adjustStockBulk(req.user.orgId, restoreOps, session);

    await Sale.deleteOne({ _id: sale._id }, { session });
    await session.commitTransaction();
    res.json({ message: 'Sale deleted' });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ error: err.message });
  } finally {
    session.endSession();
  }
});

module.exports = router;
