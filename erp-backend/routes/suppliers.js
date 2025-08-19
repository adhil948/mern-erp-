const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Supplier = require('../models/Supplier');
const auth = require('../middleware/auth');
// const { requireModule } = require('../middleware/requireModule');

// LIST
router.get('/', auth, /* requireModule('purchase'), */ async (req, res) => {
  try {
    const { q, status } = req.query;
    const filter = { orgId: req.user.orgId };
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } }
      ];
    }
    if (status) filter.status = status;

    const list = await Supplier.find(filter).sort({ name: 1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to list suppliers' });
  }
});

// CREATE
router.post('/', auth, /* requireModule('purchase'), */ async (req, res) => {
  try {
    const { name, email, phone, company, address, notes, status } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const doc = await Supplier.create({
      orgId: req.user.orgId, name, email, phone, company, address, notes, status,
      createdBy: req.user._id
    });
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message || 'Failed to create supplier' });
  }
});

// UPDATE
router.put('/:id', auth, /* requireModule('purchase'), */ async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });

    const doc = await Supplier.findOneAndUpdate(
      { _id: id, orgId: req.user.orgId },
      { $set: { ...req.body } },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message || 'Failed to update supplier' });
  }
});

// DELETE
router.delete('/:id', auth, /* requireModule('purchase'), */ async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });

    const del = await Supplier.findOneAndDelete({ _id: id, orgId: req.user.orgId });
    if (!del) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to delete supplier' });
  }
});

module.exports = router;
