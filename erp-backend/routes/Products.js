const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// Create product
router.post('/', auth, async (req, res) => {
  try {
    const { name, sku, price, category, stock } = req.body;
    const product = await Product.create({
      orgId: req.user.orgId,
      name, sku, price, category,
      stock: stock ?? 0
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// List products (for dropdown, optional query: search, active)
router.get('/', auth, async (req, res) => {
  try {
    const { q, active } = req.query;
    const filter = { orgId: req.user.orgId };
    if (active !== undefined) filter.isActive = active === 'true';
    if (q) filter.name = { $regex: q, $options: 'i' };
    const products = await Product.find(filter).sort({ name: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get one product
router.get('/:id', auth, async (req, res) => {
  try {
    const p = await Product.findOne({ _id: req.params.id, orgId: req.user.orgId });
    if (!p) return res.status(404).json({ error: 'Product not found' });
    res.json(p);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update product (name/price/category/isActive); avoid directly setting stock here
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, sku, price, category, isActive } = req.body;
    const p = await Product.findOneAndUpdate(
      { _id: req.params.id, orgId: req.user.orgId },
      { $set: { name, sku, price, category, isActive } },
      { new: true, runValidators: true }
    );
    if (!p) return res.status(404).json({ error: 'Product not found' });
    res.json(p);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete product
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Product.findOneAndDelete({ _id: req.params.id, orgId: req.user.orgId });
    if (!deleted) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
