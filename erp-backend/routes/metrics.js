// routes/metrics.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const auth = require('../middleware/auth');
const Sale = require('../models/Sale');
const Purchase = require ('../models/Purchase')
// TODO: add your models
// const Purchase = require('../models/Purchase'); // or Bill
// const StockMove = require('../models/StockMove');
// const Lead = require('../models/Lead'); // or CrmCustomer if counting new customers

// ---------- Date helpers (UTC) ----------
function startOfDayUTC(d) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); }
function addDaysUTC(d, n) { return new Date(d.getTime() + n * 24 * 60 * 60 * 1000); }
function startOfMonthUTC(d) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)); }
function startOfQuarterUTC(d) { return new Date(Date.UTC(d.getUTCFullYear(), Math.floor(d.getUTCMonth() / 3) * 3, 1)); }
function startOfYearUTC(d) { return new Date(Date.UTC(d.getUTCFullYear(), 0, 1)); }
function endOfDayUTC(d) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999)); }

function getRangeParams(range) {
  const now = new Date(); // assume stored in UTC
  let unit = 'day';
  let curFrom, curTo, prevFrom, prevTo;

  if (range === 'Today') {
    unit = 'hour';
    curFrom = startOfDayUTC(now);
    curTo = now;
    const y = addDaysUTC(curFrom, -1);
    prevFrom = startOfDayUTC(y);
    prevTo = endOfDayUTC(y);
  } else if (range === '7D') {
    unit = 'day';
    curTo = now;
    curFrom = addDaysUTC(startOfDayUTC(now), -6);
    prevTo = endOfDayUTC(addDaysUTC(curFrom, -1));
    prevFrom = addDaysUTC(startOfDayUTC(prevTo), -6);
  } else if (range === 'MTD') {
    unit = 'day';
    curFrom = startOfMonthUTC(now);
    curTo = now;
    const prevMonthEnd = addDaysUTC(curFrom, -1);
    prevFrom = startOfMonthUTC(prevMonthEnd);
    prevTo = endOfDayUTC(prevMonthEnd);
  } else if (range === 'QTD') {
    unit = 'week';
    curFrom = startOfQuarterUTC(now);
    curTo = now;
    const prevQuarterEnd = addDaysUTC(curFrom, -1);
    prevFrom = startOfQuarterUTC(prevQuarterEnd);
    prevTo = endOfDayUTC(prevQuarterEnd);
  } else { // YTD
    unit = 'month';
    curFrom = startOfYearUTC(now);
    curTo = now;
    const prevYearEnd = new Date(Date.UTC(now.getUTCFullYear() - 1, 11, 31, 23, 59, 59, 999));
    prevFrom = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1));
    prevTo = prevYearEnd;
  }

  return { unit, curFrom, curTo, prevFrom, prevTo };
}

function dateTruncExpr(unit) {
  return { $dateTrunc: { date: '$date', unit, timezone: 'UTC' } };
}

async function sumKpi(Model, orgId, params, sumField = 'total', dateField = 'date') {
  const { unit, curFrom, curTo, prevFrom, prevTo } = params;
  const orgObjId = new mongoose.Types.ObjectId(orgId);

  const [curAgg] = await Model.aggregate([
    { $match: { orgId: orgObjId, [dateField]: { $gte: curFrom, $lte: curTo } } },
    { $group: { _id: null, total: { $sum: `$${sumField}` } } }
  ]);

  const [prevAgg] = await Model.aggregate([
    { $match: { orgId: orgObjId, [dateField]: { $gte: prevFrom, $lte: prevTo } } },
    { $group: { _id: null, total: { $sum: `$${sumField}` } } }
  ]);

  const trendAgg = await Model.aggregate([
    { $match: { orgId: orgObjId, [dateField]: { $gte: curFrom, $lte: curTo } } },
    { $group: { _id: dateTruncExpr(unit), total: { $sum: `$${sumField}` } } },
    { $sort: { _id: 1 } }
  ]);

  // Build dense buckets from curFrom..curTo
  const map = new Map(trendAgg.map(r => [new Date(r._id).getTime(), r.total]));

  const trend = [];
  if (unit === 'month') {
    let d = new Date(Date.UTC(curFrom.getUTCFullYear(), curFrom.getUTCMonth(), 1));
    const end = new Date(Date.UTC(curTo.getUTCFullYear(), curTo.getUTCMonth(), 1));
    while (d <= end) {
      trend.push(map.get(d.getTime()) || 0);
      d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
    }
  } else {
    const stepMs = unit === 'hour' ? 3600000 : unit === 'day' ? 86400000 : unit === 'week' ? 604800000 : 86400000;
    let d = unit === 'hour' ? new Date(Date.UTC(curFrom.getUTCFullYear(), curFrom.getUTCMonth(), curFrom.getUTCDate(), curFrom.getUTCHours())) : new Date(curFrom);
    while (d <= curTo) {
      // Align to unit boundary via dateTrunc on JS side
      const key = unit === 'hour'
        ? Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours())
        : unit === 'day'
        ? Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
        : unit === 'week'
        ? Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) // visualization granularity
        : Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      trend.push(map.get(key) || 0);
      d = new Date(d.getTime() + stepMs);
    }
  }

  const currentTotal = curAgg?.total || 0;
  const previousTotal = prevAgg?.total || 0;
  const delta = previousTotal === 0 ? (currentTotal > 0 ? 100 : 0) : ((currentTotal - previousTotal) / previousTotal) * 100;

  return {
    total: Math.round(currentTotal),
    delta: Math.round(delta * 10) / 10,
    trend
  };
}

// For count-type KPIs (e.g., leads created)
async function countKpi(Model, orgId, params, dateField = 'createdAt') {
  const { unit, curFrom, curTo, prevFrom, prevTo } = params;
  const orgObjId = new mongoose.Types.ObjectId(orgId);

  const [curAgg] = await Model.aggregate([
    { $match: { orgId: orgObjId, [dateField]: { $gte: curFrom, $lte: curTo } } },
    { $group: { _id: null, total: { $sum: 1 } } }
  ]);

  const [prevAgg] = await Model.aggregate([
    { $match: { orgId: orgObjId, [dateField]: { $gte: prevFrom, $lte: prevTo } } },
    { $group: { _id: null, total: { $sum: 1 } } }
  ]);

  const trendAgg = await Model.aggregate([
    { $match: { orgId: orgObjId, [dateField]: { $gte: curFrom, $lte: curTo } } },
    { $group: { _id: { $dateTrunc: { date: `$${dateField}`, unit: params.unit, timezone: 'UTC' } }, total: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  const map = new Map(trendAgg.map(r => [new Date(r._id).getTime(), r.total]));
  const trend = [];
  if (params.unit === 'month') {
    let d = new Date(Date.UTC(curFrom.getUTCFullYear(), curFrom.getUTCMonth(), 1));
    const end = new Date(Date.UTC(curTo.getUTCFullYear(), curTo.getUTCMonth(), 1));
    while (d <= end) {
      trend.push(map.get(d.getTime()) || 0);
      d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
    }
  } else {
    const stepMs = params.unit === 'hour' ? 3600000 : params.unit === 'day' ? 86400000 : params.unit === 'week' ? 604800000 : 86400000;
    let d = new Date(curFrom);
    while (d <= curTo) {
      const key = d.getTime();
      trend.push(map.get(key) || 0);
      d = new Date(d.getTime() + stepMs);
    }
  }

  const currentTotal = curAgg?.total || 0;
  const previousTotal = prevAgg?.total || 0;
  const delta = previousTotal === 0 ? (currentTotal > 0 ? 100 : 0) : ((currentTotal - previousTotal) / previousTotal) * 100;

  return {
    total: Math.round(currentTotal),
    delta: Math.round(delta * 10) / 10,
    trend
  };
}

router.get('/kpis', auth, async (req, res) => {
  try {
    const range = req.query.range || 'MTD';
    const orgId = req.user.orgId?.toString();
    if (!orgId) return res.status(400).json({ error: 'orgId missing' });

    const params = getRangeParams(range);

    const [salesKpi , purchaseKpi /*, inventoryKpi, crmKpi */] = await Promise.all([
      sumKpi(Sale, orgId, params, 'total', 'date'),
      sumKpi(Purchase, orgId, params, 'total', 'date'),
      // sumKpi(StockMove, orgId, params, 'qty', 'date') // or implement inventory valuation
      // countKpi(Lead, orgId, params, 'createdAt')
    ]);

    res.json({
      sales: salesKpi,
      purchase: purchaseKpi,   // plug in when ready
      inventory: { total: 0, delta: 0, trend: [] },  // plug in when ready
      crm: { total: 0, delta: 0, trend: [] }         // plug in when ready
    });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to compute KPIs' });
  }
});

module.exports = router;
