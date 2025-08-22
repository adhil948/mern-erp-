import React, { useEffect, useState } from 'react';
import { useApi } from '../../api';
import SupplierSelect from './SupplierSelect';
import ProductSelect from '../common/ProductSelect';

export default function PurchaseForm({ onSaved, initial = null }) {
  const api = useApi();

  // Form state
  const [supplierId, setSupplierId] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  // Keep both product object and productId for ProductSelect control
  const [items, setItems] = useState([{ product: null, productId: '', quantity: 1, costPrice: 0 }]);
  const [subTotal, setSubTotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [total, setTotal] = useState(0);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Prefill when editing
  useEffect(() => {
    if (!initial) {
      // Reset for create
      setSupplierId('');
      setBillNumber('');
      setDate(new Date().toISOString().slice(0,10));
      setItems([{ product: null, productId: '', quantity: 1, costPrice: 0 }]);
      setTax(0);
      setDiscount(0);
      setNotes('');
      return;
    }

    // initial present: prefill
    setSupplierId(
      // SupplierSelect usually expects an id string; adapt if it expects object
      typeof initial.supplierId === 'object' ? initial.supplierId._id : (initial.supplierId || '')
    );
    setBillNumber(initial.billNumber || '');
    // Use provided date or fallback to createdAt; ensure YYYY-MM-DD
    const isoDate = initial.date
      ? new Date(initial.date)
      : initial.createdAt
      ? new Date(initial.createdAt)
      : new Date();
    setDate(isoDate.toISOString().slice(0,10));

    // Map items: make sure we keep product object if present for the select
    const mapped = (initial.items || []).map(it => {
      const productObj =
        (typeof it.productId === 'object' && it.productId) ||
        it.product || // in case API returns product populated separately
        null;
      const pid =
        (typeof it.productId === 'string' && it.productId) ||
        (typeof it.productId === 'object' && it.productId?._id) ||
        productObj?._id ||
        '';

      return {
        product: productObj,
        productId: pid,
        quantity: Number(it.quantity || 0),
        costPrice: Number(it.costPrice || it.price || 0) // accept price fallback if API used "price"
      };
    });

    setItems(mapped.length ? mapped : [{ product: null, productId: '', quantity: 1, costPrice: 0 }]);
    setTax(Number(initial.tax || 0));
    setDiscount(Number(initial.discount || 0));
    setNotes(initial.notes || '');
  }, [initial]);

  // Totals
  useEffect(() => {
    const st = items.reduce((acc, it) => acc + (Number(it.costPrice)||0) * (Number(it.quantity)||0), 0);
    setSubTotal(st);
    const t = Number(tax) || 0;
    const d = Number(discount) || 0;
    setTotal(Math.max(0, st + t - d));
  }, [items, tax, discount]);

  // Helpers
  const setItemPatch = (idx, patch) => {
    setItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const handleItemChange = (idx, field, value) => {
    if (field === 'quantity' || field === 'costPrice') {
      value = Number(value);
      if (Number.isNaN(value) || value < 0) value = 0;
    }
    setItemPatch(idx, { [field]: value });
  };

  // Auto-fill cost from selected product
  const handleProductChange = (idx, selectedProduct) => {
    if (!selectedProduct) {
      setItemPatch(idx, { product: null, productId: '', costPrice: 0 });
      return;
    }
    const rawCost =
      selectedProduct?.costPrice ??
      selectedProduct?.purchasePrice ??
      selectedProduct?.price ??
      0;
    const autoCost = Number(rawCost);
    setItemPatch(idx, {
      product: selectedProduct,
      productId: selectedProduct._id,
      costPrice: Number.isFinite(autoCost) ? autoCost : 0
    });
  };

  const addItem = () => setItems(prev => [...prev, { product: null, productId: '', quantity: 1, costPrice: 0 }]);
  const removeItem = (idx) => {
    setItems(prev => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length ? next : [{ product: null, productId: '', quantity: 1, costPrice: 0 }];
    });
  };

  // Validate
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

  // Save (create or update)
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
        items: items.map(it => ({
          productId: it.productId,
          quantity: it.quantity,
          costPrice: it.costPrice
        })),
        subTotal,
        tax,
        discount,
        total,
        notes: notes || undefined
      };

      let res;
      if (initial?._id) {
        // Update
        res = await api.put(`/purchases/${initial._id}`, payload);
      } else {
        // Create
        res = await api.post('/purchases', payload);
      }

      onSaved?.(res.data);

      // After save, reset only if it was create; for edit, let parent close the form
      if (!initial?._id) {
        setSupplierId('');
        setBillNumber('');
        setDate(new Date().toISOString().slice(0,10));
        setItems([{ product: null, productId: '', quantity: 1, costPrice: 0 }]);
        setTax(0);
        setDiscount(0);
        setNotes('');
      }
    } catch (e2) {
      setError(e2?.response?.data?.error || (initial?._id ? 'Failed to update purchase' : 'Failed to create purchase'));
    } finally {
      setSaving(false);
    }
  };

  const isEditing = Boolean(initial?._id);

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

      <h4>{isEditing ? 'Edit Items' : 'Items'}</h4>
      {items.map((it, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
          {/* IMPORTANT: pass the product object */}
          <ProductSelect value={it.product} onChange={(prod)=>handleProductChange(idx, prod)} />
          <input
            type="number"
            min="1"
            value={it.quantity}
            onChange={e=>handleItemChange(idx,'quantity',e.target.value)}
            placeholder="Qty"
            style={{ width: 100 }}
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={it.costPrice}
            onChange={e=>handleItemChange(idx,'costPrice',e.target.value)}
            placeholder="Cost Price"
            style={{ width: 140 }}
          />
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
        {saving ? (isEditing ? 'Updating...' : 'Saving...') : (isEditing ? 'Update Purchase' : 'Save Purchase')}
      </button>
    </form>
  );
}
