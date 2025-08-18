const Product = require('../models/Product');
const mongoose = require('mongoose');

async function adjustStockBulk(orgId, ops, session) {
  // ops: [{ productId, diff }] diff can be +ve (purchase) or -ve (sale)
  const bulk = ops.map(({ productId, diff }) => ({
    updateOne: {
      filter: { _id: new mongoose.Types.ObjectId(productId), orgId },
      update: { $inc: { stock: diff } }
    }
  }));
  if (!bulk.length) return;
  const res = await Product.bulkWrite(bulk, { session });
  return res;
}

module.exports = { adjustStockBulk };
