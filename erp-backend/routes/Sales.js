const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Sale = require('../models/Sale');
const Product = require('../models/Product');
const CrmCustomer = require('../models/CrmCustomer'); // NEW: to validate customer ownership
const CompanyProfile = require('../models/CompanyProfile');
const { adjustStockBulk } = require('../utils/stock');
const auth = require('../middleware/auth');

// ========== Helpers ==========
function validateSaleInput(body, existing) {
  const errors = [];
  if (!body) errors.push('Missing body');

  const { customerId, customer, items, total } = body || {};

  // Require either a valid customerId or at least a non-empty customer string
  if (!customerId && (!customer || typeof customer !== 'string' || !customer.trim())) {
    errors.push('customerId or customer (name) is required');
  }

  if (!Array.isArray(items) || items.length === 0) errors.push('items must be a non-empty array');
  if (typeof total !== 'number' || Number.isNaN(total) || total < 0) errors.push('total must be a non-negative number');

  if (items) {
    items.forEach((it, idx) => {
      if (!it.productId) errors.push(`items[${idx}].productId is required`);
      if (typeof it.quantity !== 'number' || it.quantity <= 0) errors.push(`items[${idx}].quantity must be > 0`);
      if (typeof it.price !== 'number' || it.price < 0) errors.push(`items[${idx}].price must be >= 0`);
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

async function ensureCustomerBelongsToOrg(orgId, customerId, session) {
  if (!customerId) return; // optional if you keep `customer` string
  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    throw new Error('Invalid customerId');
  }
  const exists = await CrmCustomer.countDocuments({ _id: customerId, orgId }).session(session);
  if (!exists) throw new Error('Customer does not belong to this organisation');
}

// ========== CREATE ==========
router.post('/', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const errors = validateSaleInput(req.body);
    if (errors.length) {
      await session.abortTransaction();
      return res.status(400).json({ error: errors.join(', ') });
    }

    const { customerId, customer, items, total, date } = req.body;

    await ensureProductsBelongToOrg(req.user.orgId, items, session);
    await ensureCustomerBelongsToOrg(req.user.orgId, customerId, session);


    // Generate invoice number (requires company profile)
  const profile = await CompanyProfile.findOne({ orgId: req.user.orgId }).session(session).exec();
  if (!profile) {
    await session.abortTransaction();
    return res.status(400).json({ error: 'Company profile not set. Please complete Company Profile to generate invoice numbers.' });
  }

  const prefix = profile.invoice?.prefix || 'INV-';
  const nextNo = profile.invoice?.nextNumber || 1;
  // Optional zero-padding: 4 digits (0001)
  const invoiceNo = `${prefix}${String(nextNo).padStart(4, '0')}`;

  // Increment sequence
  profile.invoice.nextNumber = nextNo + 1;
  await profile.save({ session });

  const [sale] = await Sale.create([{
    orgId: req.user.orgId,
    date: date ? new Date(date) : new Date(),
    invoiceNo,
    customerId: customerId || undefined,
    customer: customer?.trim() || undefined,
    items,
    total,
    createdBy: req.user._id,
    paymentsTotal: 0,
    paymentStatus: 'unpaid'
  }], { session });

    // Decrement stock
    const ops = items.map(i => ({ productId: i.productId, diff: -Math.abs(i.quantity) }));
    await adjustStockBulk(req.user.orgId, ops, session);

    await session.commitTransaction();
    res.status(201).json(sale);
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ error: err.message || 'Failed to create sale' });
  } finally {
    session.endSession();
  }
});

// ========== UPDATE ==========
router.put('/:id', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const saleId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(saleId)) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Invalid sale id' });
    }

    const existing = await Sale.findOne({ _id: saleId, orgId: req.user.orgId }).session(session);
    if (!existing) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Sale not found' });
    }

    const { customerId, customer, items, total, date } = req.body || {};

    // If items provided, validate and adjust stock
    if (Array.isArray(items)) {
      const inputErrors = validateSaleInput({
        // if customer fields not provided in body, pass existing to avoid false validation errors
        customerId: customerId ?? existing.customerId,
        customer: customer ?? existing.customer,
        items,
        total: typeof total === 'number' ? total : existing.total
      });
      if (inputErrors.length) {
        await session.abortTransaction();
        return res.status(400).json({ error: inputErrors.join(', ') });
      }

      await ensureProductsBelongToOrg(req.user.orgId, items, session);

      // Revert previous stock
      const revertOps = existing.items.map(i => ({ productId: i.productId, diff: +Math.abs(i.quantity) }));
      await adjustStockBulk(req.user.orgId, revertOps, session);

      // Apply new stock
      const applyOps = items.map(i => ({ productId: i.productId, diff: -Math.abs(i.quantity) }));
      await adjustStockBulk(req.user.orgId, applyOps, session);

      existing.items = items;
    }

    // If customerId provided, validate and set
    if (customerId !== undefined) {
      await ensureCustomerBelongsToOrg(req.user.orgId, customerId, session);
      existing.customerId = customerId || undefined;
    }

    if (typeof customer === 'string') existing.customer = customer?.trim() || undefined;
    if (typeof total === 'number') existing.total = total;
    if (date) existing.date = new Date(date);

    const saved = await existing.save({ session });

    await session.commitTransaction();
    res.json(saved);
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ error: err.message || 'Failed to update sale' });
  } finally {
    session.endSession();
  }
});

// ========== DELETE ==========
router.delete('/:id', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const saleId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(saleId)) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Invalid sale id' });
    }

    const sale = await Sale.findOne({ _id: saleId, orgId: req.user.orgId }).session(session);
    if (!sale) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Sale not found' });
    }

    // Restore stock
    const restoreOps = sale.items.map(i => ({ productId: i.productId, diff: +Math.abs(i.quantity) }));
    await adjustStockBulk(req.user.orgId, restoreOps, session);

    await Sale.deleteOne({ _id: sale._id }, { session });

    await session.commitTransaction();
    res.json({ message: 'Sale deleted' });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ error: err.message || 'Failed to delete sale' });
  } finally {
    session.endSession();
  }
});

// ========== LIST ==========
router.get('/', auth, async (req, res) => {
  try {
    const { q, from, to } = req.query;
    const filter = { orgId: req.user.orgId };

    if (q) {
      // search by customer display name; for ID search, pass a different param
      filter.customer = { $regex: q, $options: 'i' };
    }
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const list = await Sale.find(filter)
      .sort({ date: -1 })
      .populate('customerId', 'name email phone company')     // OPTIONAL populate customer
      .populate('items.productId', 'name sku price category'); // OPTIONAL populate products

    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to fetch sales' });
  }
});

// ========== GET ONE ==========
router.get('/:id', auth, async (req, res) => {
  try {
    const saleId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(saleId)) {
      return res.status(400).json({ error: 'Invalid sale id' });
    }
    const sale = await Sale.findOne({ _id: saleId, orgId: req.user.orgId })
      .populate('customerId', 'name email phone company')
      .populate('items.productId', 'name sku price category');

    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    res.json(sale);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to fetch sale' });
  }
});

module.exports = router;
