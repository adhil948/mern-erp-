const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const CompanyProfile = require('../models/CompanyProfile');
const auth = require('../middleware/auth');

// Simple admin check: assumes auth sets req.user.role for active org
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

// GET /api/company-profile
router.get('/', auth, async (req, res) => {
  try {
    const profile = await CompanyProfile.findOne({ orgId: req.user.orgId }).lean();
    if (!profile) {
      return res.json({ exists: false, profile: null });
    }
    res.json({ exists: true, profile });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to fetch company profile' });
  }
});

// POST /api/company-profile (create or update)
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const {
      name, address, gstin, email, phone, website,
      logoUrl,
      bank = {},
      invoice = {}
    } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Company name is required' });
    }

    // Validate nextNumber if provided (must be >=1)
    if (invoice?.nextNumber != null && Number(invoice.nextNumber) < 1) {
      return res.status(400).json({ message: 'invoice.nextNumber must be >= 1' });
    }

    // Upsert by orgId
    const update = {
      name: name.trim(),
      address: address?.trim() || '',
      gstin: gstin?.trim() || '',
      email: email?.trim()?.toLowerCase() || '',
      phone: phone?.trim() || '',
      website: website?.trim() || '',
      logoUrl: logoUrl?.trim() || '',
      bank: {
        accountName: bank.accountName?.trim() || '',
        accountNo: bank.accountNo?.trim() || '',
        ifsc: bank.ifsc?.trim() || '',
        bankName: bank.bankName?.trim() || ''
      },
      invoice: {
        prefix: (invoice.prefix ?? 'INV-').toString().trim(),
        // nextNumber: if provided and higher than current, we’ll set it; otherwise keep as-is
        nextNumber: invoice.nextNumber ?? undefined,
        footerNote: invoice.footerNote?.trim() || '',
        terms: invoice.terms?.trim() || ''
      }
    };

    // Clean undefined to avoid overwriting
    Object.keys(update.invoice).forEach(k => update.invoice[k] === undefined && delete update.invoice[k]);

    const existing = await CompanyProfile.findOne({ orgId: req.user.orgId });
    let saved;

    if (!existing) {
      // Create new profile
      saved = await CompanyProfile.create({
        orgId: req.user.orgId,
        createdBy: req.user._id,
        ...update,
        // Ensure a valid initial sequence
        invoice: {
          prefix: update.invoice.prefix || 'INV-',
          nextNumber: update.invoice.nextNumber || 1,
          footerNote: update.invoice.footerNote || '',
          terms: update.invoice.terms || ''
        }
      });
    } else {
      // If request supplies a nextNumber lower than current, reject
      if (update.invoice?.nextNumber != null && update.invoice.nextNumber < existing.invoice.nextNumber) {
        return res.status(400).json({
          message: `invoice.nextNumber cannot be less than current (${existing.invoice.nextNumber})`
        });
      }

      // Merge invoice block
      const mergedInvoice = {
        prefix: update.invoice.prefix ?? existing.invoice.prefix,
        nextNumber: update.invoice.nextNumber ?? existing.invoice.nextNumber,
        footerNote: update.invoice.footerNote ?? existing.invoice.footerNote,
        terms: update.invoice.terms ?? existing.invoice.terms
      };

      existing.name = update.name;
      existing.address = update.address;
      existing.gstin = update.gstin;
      existing.email = update.email;
      existing.phone = update.phone;
      existing.website = update.website;
      existing.logoUrl = update.logoUrl;
      existing.bank = update.bank;
      existing.invoice = mergedInvoice;

      saved = await existing.save();
    }

    res.json({ ok: true, profile: saved });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to save company profile' });
  }
});

module.exports = router;
