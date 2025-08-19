const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const { adjustStockBulk } = require('../utils/stock');
const auth = require('../middleware/auth');

console.log('purchases router loaded');

// If you use module gating:
// const { requireModule } = require('../middleware/requireModule');

function validatePurchaseInput(body) {
  const errors = [];
  if (!body) errors.push('Missing body');

  const { supplierId, items, subTotal, total } = body || {};
  if (!supplierId) errors.push('supplierId is required');
  if (!Array.isArray(items) || items.length === 0) errors.push('items must be a non-empty array');
  if (typeof subTotal !== 'number' || Number.isNaN(subTotal) || subTotal < 0) errors.push('subTotal must be a non-negative number');
  if (typeof total !== 'number' || Number.isNaN(total) || total < 0) errors.push('total must be a non-negative number');

  if (items) {
    items.forEach((it, idx) => {
      if (!it.productId) errors.push(`items[${idx}].productId is required`);
      if (typeof it.quantity !== 'number' || it.quantity <= 0) errors.push(`items[${idx}].quantity must be > 0`);
      if (typeof it.costPrice !== 'number' || it.costPrice < 0) errors.push(`items[${idx}].costPrice must be >= 0`);
    });
  }
  return errors;
}

async function ensureProductsBelongToOrg(orgId, items, session) {
  const productIds = items.map(i => new mongoose.Types.ObjectId(i.productId));
  const count = await Product.countDocuments({ _id: { $in: productIds }, orgId }).session(session);
  if (count !== productIds.length) {
    throw new Error('One or more products do not belong to this organisation');
  }
}

async function ensureSupplierBelongsToOrg(orgId, supplierId, session) {
  if (!mongoose.Types.ObjectId.isValid(supplierId)) throw new Error('Invalid supplierId');
  const exists = await Supplier.countDocuments({ _id: supplierId, orgId }).session(session);
  if (!exists) throw new Error('Supplier does not belong to this organisation');
}

// CREATE
router.post('/', auth, /* requireModule('purchase'), */ async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const errors = validatePurchaseInput(req.body);
    if (errors.length) {
      await session.abortTransaction();
      return res.status(400).json({ error: errors.join(', ') });
    }

    const { supplierId, billNumber, date, items, subTotal, tax = 0, discount = 0, total, notes } = req.body;

    await ensureSupplierBelongsToOrg(req.user.orgId, supplierId, session);
    await ensureProductsBelongToOrg(req.user.orgId, items, session);

    // Create purchase
    const [purchase] = await Purchase.create([{
      orgId: req.user.orgId,
      supplierId,
      billNumber: billNumber?.trim() || undefined,
      date: date ? new Date(date) : new Date(),
      items,
      subTotal,
      tax,
      discount,
      total,
      notes: notes?.trim() || undefined,
      createdBy: req.user._id
    }], { session });

    // Increment stock
    const ops = items.map(i => ({ productId: i.productId, diff: +Math.abs(i.quantity) }));
    await adjustStockBulk(req.user.orgId, ops, session);

    await session.commitTransaction();
    res.status(201).json(purchase);
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ error: err.message || 'Failed to create purchase' });
  } finally {
    session.endSession();
  }
});

// UPDATE
router.put('/:id', auth, /* requireModule('purchase'), */ async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const purchaseId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(purchaseId)) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Invalid purchase id' });
    }

    const existing = await Purchase.findOne({ _id: purchaseId, orgId: req.user.orgId }).session(session);
    if (!existing) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Purchase not found' });
    }

    const { supplierId, billNumber, date, items, subTotal, tax, discount, total, notes } = req.body || {};

    // Validate and stock adjustments only if items provided
    if (Array.isArray(items)) {
      const inputErrors = validatePurchaseInput({
        supplierId: supplierId ?? existing.supplierId,
        items,
        subTotal: typeof subTotal === 'number' ? subTotal : existing.subTotal,
        total: typeof total === 'number' ? total : existing.total
      });
      if (inputErrors.length) {
        await session.abortTransaction();
        return res.status(400).json({ error: inputErrors.join(', ') });
      }

      await ensureProductsBelongToOrg(req.user.orgId, items, session);

      // Revert previous stock
      const revertOps = existing.items.map(i => ({ productId: i.productId, diff: -Math.abs(i.quantity) })); // previous was added; revert = subtract
      await adjustStockBulk(req.user.orgId, revertOps, session);

      // Apply new stock
      const applyOps = items.map(i => ({ productId: i.productId, diff: +Math.abs(i.quantity) }));
      await adjustStockBulk(req.user.orgId, applyOps, session);

      existing.items = items;
    }

    if (supplierId !== undefined) {
      await ensureSupplierBelongsToOrg(req.user.orgId, supplierId, session);
      existing.supplierId = supplierId;
    }

    if (typeof billNumber === 'string') existing.billNumber = billNumber?.trim() || undefined;
    if (date) existing.date = new Date(date);
    if (typeof subTotal === 'number') existing.subTotal = subTotal;
    if (typeof tax === 'number') existing.tax = tax;
    if (typeof discount === 'number') existing.discount = discount;
    if (typeof total === 'number') existing.total = total;
    if (typeof notes === 'string') existing.notes = notes?.trim() || undefined;

    const saved = await existing.save({ session });

    await session.commitTransaction();
    res.json(saved);
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ error: err.message || 'Failed to update purchase' });
  } finally {
    session.endSession();
  }
});

// DELETE
router.delete('/:id', auth, /* requireModule('purchase'), */ async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const purchaseId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(purchaseId)) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Invalid purchase id' });
    }

    const purchase = await Purchase.findOne({ _id: purchaseId, orgId: req.user.orgId }).session(session);
    if (!purchase) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Purchase not found' });
    }

    // Revert stock (decrement what was previously added)
    const revertOps = purchase.items.map(i => ({ productId: i.productId, diff: -Math.abs(i.quantity) }));
    await adjustStockBulk(req.user.orgId, revertOps, session);

    await Purchase.deleteOne({ _id: purchase._id }, { session });

    await session.commitTransaction();
    res.json({ message: 'Purchase deleted' });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ error: err.message || 'Failed to delete purchase' });
  } finally {
    session.endSession();
  }
});

// LIST
router.get('/', auth, /* requireModule('purchase'), */ async (req, res) => {
  try {
    const { q, from, to } = req.query;
    const filter = { orgId: req.user.orgId };

    if (q) {
      // search by billNumber
      filter.billNumber = { $regex: q, $options: 'i' };
    }
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const list = await Purchase.find(filter)
      .sort({ date: -1 })
      .populate('supplierId', 'name email phone company')
      .populate('items.productId', 'name sku price category');

    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to fetch purchases' });
  }
});

// GET ONE
router.get('/:id', auth, /* requireModule('purchase'), */ async (req, res) => {
  try {
    const purchaseId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(purchaseId)) {
      return res.status(400).json({ error: 'Invalid purchase id' });
    }
    const doc = await Purchase.findOne({ _id: purchaseId, orgId: req.user.orgId })
      .populate('supplierId', 'name email phone company')
      .populate('items.productId', 'name sku price category');

    if (!doc) return res.status(404).json({ error: 'Purchase not found' });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to fetch purchase' });
  }
});

module.exports = router;
