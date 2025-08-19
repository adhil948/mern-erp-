import React, { useEffect, useState } from 'react';
import { useApi } from '../../api';
import SupplierSelect from './SupplierSelect';
import ProductSelect from '../common/ProductSelect';

export default function PurchaseForm({ onSaved }) {
  const api = useApi();
  const [supplierId, setSupplierId] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [items, setItems] = useState([{ productId: '', quantity: 1, costPrice: 0 }]);
  const [subTotal, setSubTotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [total, setTotal] = useState(0);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const st = items.reduce((acc, it) => acc + (Number(it.costPrice)||0) * (Number(it.quantity)||0), 0);
    setSubTotal(st);
    const t = Number(tax) || 0;
    const d = Number(discount) || 0;
    setTotal(Math.max(0, st + t - d));
  }, [items, tax, discount]);

  const handleItemChange = (idx, field, value) => {
    const next = [...items];
    if (field === 'quantity' || field === 'costPrice') {
      value = Number(value);
      if (Number.isNaN(value) || value < 0) value = 0;
    }
    next[idx][field] = value;
    setItems(next);
  };

  const addItem = () => setItems([...items, { productId: '', quantity: 1, costPrice: 0 }]);
  const removeItem = (idx) => {
    const next = items.filter((_, i) => i !== idx);
    setItems(next.length ? next : [{ productId: '', quantity: 1, costPrice: 0 }]);
  };

  const validate = () => {
    if (!supplierId) return 'Select a supplier';
    if (!items.length) return 'Add at least one item';
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.productId) return `Row ${i+1}: Select product`;
      if (!it.quantity || it.quantity <= 0) return `Row ${i+1}: Quantity must be > 0`;
      if (it.costPrice == null || it.costPrice < 0) return `Row ${i+1}: Cost price must be >= 0`;
    }
    return '';
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    const msg = validate();
    if (msg) { setError(msg); return; }

    setSaving(true);
    try {
      const payload = {
        supplierId,
        billNumber: billNumber || undefined,
        date,
        items,
        subTotal,
        tax,
        discount,
        total,
        notes: notes || undefined
      };
      const res = await api.post('/purchases', payload);
      onSaved?.(res.data);
      // reset
      setSupplierId('');
      setBillNumber('');
      setDate(new Date().toISOString().slice(0,10));
      setItems([{ productId: '', quantity: 1, costPrice: 0 }]);
      setTax(0); setDiscount(0); setNotes('');
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to create purchase');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save}>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}

      <div style={{ marginBottom: 8 }}>
        <label>Supplier:</label>
        <SupplierSelect value={supplierId} onChange={setSupplierId} />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <input value={billNumber} onChange={e=>setBillNumber(e.target.value)} placeholder="Bill/Invoice No." />
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
      </div>

      <h4>Items</h4>
      {items.map((it, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
          <ProductSelect value={it.productId} onChange={(v)=>handleItemChange(idx,'productId',v)} />
          <input type="number" min="1" value={it.quantity} onChange={e=>handleItemChange(idx,'quantity',e.target.value)} placeholder="Qty" style={{ width: 100 }} />
          <input type="number" min="0" step="0.01" value={it.costPrice} onChange={e=>handleItemChange(idx,'costPrice',e.target.value)} placeholder="Cost Price" style={{ width: 140 }} />
          <button type="button" onClick={() => removeItem(idx)}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={addItem}>+ Add Item</button>

      <hr />

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>Subtotal: ₹{subTotal.toFixed(2)}</div>
        <div>
          Tax: <input type="number" min="0" step="0.01" value={tax} onChange={e=>setTax(e.target.value)} style={{ width: 120 }} />
        </div>
        <div>
          Discount: <input type="number" min="0" step="0.01" value={discount} onChange={e=>setDiscount(e.target.value)} style={{ width: 120 }} />
        </div>
        <strong>Total: ₹{total.toFixed(2)}</strong>
      </div>

      <div style={{ marginTop: 8 }}>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes" rows={3} style={{ width: '100%', maxWidth: 600 }} />
      </div>

      <button type="submit" disabled={saving} style={{ marginTop: 10 }}>
        {saving ? 'Saving...' : 'Save Purchase'}
      </button>
    </form>
  );
}
