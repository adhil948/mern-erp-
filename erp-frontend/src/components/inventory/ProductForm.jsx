import React, { useState, useEffect } from 'react';
import {useApi} from '../../api';

export default function ProductForm({ initial, onCancel, onSaved }) {
  const [name, setName] = useState(initial?.name || '');
  const [sku, setSku] = useState(initial?.sku || '');
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [category, setCategory] = useState(initial?.category || '');
  const [stock, setStock] = useState(initial?.stock ?? 0);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(initial?._id);
  const api = useApi();

  useEffect(() => {
    // Keep price and stock numeric
    setPrice(Number(price) || 0);
    setStock(Number(stock) || 0);
  }, []); // eslint-disable-line

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { name, sku, price: Number(price), category, isActive };
      // Allow opening stock only on create
      if (!isEdit) payload.stock = Number(stock);

      let res;
      if (isEdit) {
        res = await api.put(`/products/${initial._id}`, payload);
      } else {
        res = await api.post('/products', payload);
      }
      onSaved(res.data);
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} style={{ border: '1px solid #ddd', padding: 16, borderRadius: 8, marginTop: 12 }}>
      <h3 style={{ marginTop: 0 }}>{isEdit ? 'Edit Product' : 'Add Product'}</h3>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 220 }}>
          <label>Name</label>
          <input
            type="text"
            value={name}
            required
            onChange={(e) => setName(e.target.value)}
            placeholder="Product name"
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ minWidth: 180 }}>
          <label>SKU</label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="Optional code"
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ minWidth: 140 }}>
          <label>Price</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            placeholder="0.00"
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ minWidth: 180 }}>
          <label>Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            style={{ width: '100%' }}
          />
        </div>

        {!isEdit && (
          <div style={{ minWidth: 140 }}>
            <label>Opening Stock</label>
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="0"
              style={{ width: '100%' }}
            />
          </div>
        )}

        <div style={{ minWidth: 140 }}>
          <label>Status</label>
          <select value={isActive ? '1' : '0'} onChange={(e) => setIsActive(e.target.value === '1')} style={{ width: '100%' }}>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>
      </div>

      <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
        <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} disabled={loading}>Cancel</button>
      </div>
    </form>
  );
}
