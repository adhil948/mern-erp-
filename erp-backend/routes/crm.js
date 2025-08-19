const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const auth = require('../middleware/auth'); // full org-aware middleware
const CrmCustomer = require('../models/CrmCustomer');
const CrmLead = require('../models/CrmLead');
const CrmContact = require('../models/CrmContact');

// Helpers
function buildListFilter(orgId, q, extra = {}) {
  const filter = { orgId, ...extra };
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
      { company: { $regex: q, $options: 'i' } },
      { firstName: { $regex: q, $options: 'i' } },
      { lastName: { $regex: q, $options: 'i' } }
    ];
  }
  return filter;
}

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// Customers CRUD
router.get('/customers', auth, async (req, res) => {
  try {
    const { q, status } = req.query;
    const extra = {};
    if (status) extra.status = status;
    const list = await CrmCustomer.find(buildListFilter(req.user.orgId, q, extra)).sort({ name: 1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to list customers' });
  }
});

router.post('/customers', auth, async (req, res) => {
  try {
    const { name, email, phone, company, address, notes, status } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const doc = await CrmCustomer.create({
      orgId: req.user.orgId, name, email, phone, company, address, notes, status,
      createdBy: req.user._id
    });
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message || 'Failed to create customer' });
  }
});

router.get('/customers/:id', auth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const doc = await CrmCustomer.findOne({ _id: req.params.id, orgId: req.user.orgId });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to get customer' });
  }
});

router.put('/customers/:id', auth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const update = { ...req.body };
    const doc = await CrmCustomer.findOneAndUpdate(
      { _id: req.params.id, orgId: req.user.orgId },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message || 'Failed to update customer' });
  }
});

router.delete('/customers/:id', auth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const del = await CrmCustomer.findOneAndDelete({ _id: req.params.id, orgId: req.user.orgId });
    if (!del) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to delete customer' });
  }
});

// Leads CRUD
router.get('/leads', auth, async (req, res) => {
  try {
    const { q, stage } = req.query;
    const extra = {};
    if (stage) extra.stage = stage;
    const list = await CrmLead.find(buildListFilter(req.user.orgId, q, extra)).sort({ updatedAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to list leads' });
  }
});

router.post('/leads', auth, async (req, res) => {
  try {
    const { name, email, phone, source, stage, company, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const doc = await CrmLead.create({
      orgId: req.user.orgId, name, email, phone, source, stage, company, notes,
      createdBy: req.user._id
    });
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message || 'Failed to create lead' });
  }
});

router.put('/leads/:id', auth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const update = { ...req.body };
    const doc = await CrmLead.findOneAndUpdate(
      { _id: req.params.id, orgId: req.user.orgId },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message || 'Failed to update lead' });
  }
});

router.delete('/leads/:id', auth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const del = await CrmLead.findOneAndDelete({ _id: req.params.id, orgId: req.user.orgId });
    if (!del) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to delete lead' });
  }
});

// Contacts CRUD
router.get('/contacts', auth, async (req, res) => {
  try {
    const { q } = req.query;
    const list = await CrmContact.find(buildListFilter(req.user.orgId, q)).sort({ firstName: 1, lastName: 1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to list contacts' });
  }
});

router.post('/contacts', auth, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, company, role, address, notes } = req.body;
    if (!firstName) return res.status(400).json({ error: 'firstName is required' });
    const doc = await CrmContact.create({
      orgId: req.user.orgId, firstName, lastName, email, phone, company, role, address, notes,
      createdBy: req.user._id
    });
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message || 'Failed to create contact' });
  }
});

router.put('/contacts/:id', auth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const update = { ...req.body };
    const doc = await CrmContact.findOneAndUpdate(
      { _id: req.params.id, orgId: req.user.orgId },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message || 'Failed to update contact' });
  }
});

router.delete('/contacts/:id', auth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const del = await CrmContact.findOneAndDelete({ _id: req.params.id, orgId: req.user.orgId });
    if (!del) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to delete contact' });
  }
});

module.exports = router;
