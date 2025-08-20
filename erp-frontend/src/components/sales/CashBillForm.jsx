import React, { useEffect, useMemo, useState } from 'react';
import { useApi } from '../../api';

const MODES = ['cash','card','upi','bank','wallet','credit'];

export default function CashBillForm({ sale, onSaved, onCancel }) {
  const api = useApi();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [payments, setPayments] = useState([{ mode: 'cash', amount: 0, refNo: '', note: '' }]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const alreadyPaid = Number(sale?.paymentsTotal || 0);
  const total = Number(sale?.total || 0);

  const totalInput = useMemo(() => payments.reduce((a,b)=>a + Number(b.amount||0), 0), [payments]);
  const remaining = Math.max(0, total - alreadyPaid - totalInput);

  useEffect(() => {
    if (sale) {
      // default date to sale date or today
      try {
        const d = sale.date ? new Date(sale.date) : new Date();
        setDate(d.toISOString().slice(0,10));
      } catch (_) {}
    }
  }, [sale]);

  const setPayment = (idx, field, value) => {
    const next = [...payments];
    if (field === 'amount') {
      value = Number(value);
      if (Number.isNaN(value) || value < 0) value = 0;
    }
    next[idx][field] = value;
    setPayments(next);
  };

  const addRow = () => setPayments([...payments, { mode: 'cash', amount: 0, refNo: '', note: '' }]);
  const removeRow = (idx) => {
    const next = payments.filter((_, i) => i !== idx);
    setPayments(next.length ? next : [{ mode: 'cash', amount: 0, refNo: '', note: '' }]);
  };

  const validate = () => {
    if (!sale?._id) return 'Missing sale';
    if (!payments.length) return 'Add at least one payment';
    for (let i=0; i<payments.length; i++) {
      const p = payments[i];
      if (!p.mode) return `Row ${i+1}: select mode`;
      if (!p.amount || p.amount <= 0) return `Row ${i+1}: amount must be > 0`;
    }
    // Optional: prevent overpay
    if (totalInput > Math.max(0, total - alreadyPaid) + 0.0001) {
      return 'Payments exceed remaining due';
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
        saleId: sale._id,
        date,
        payments
      };
      const res = await api.post('/cash-bills', payload);
      onSaved?.(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to create cash bill');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
      <h3 style={{ margin: 0 }}>Add Payment (Cash Bill)</h3>
      <div style={{ color: '#555', marginBottom: 8 }}>
        Invoice: <strong>{sale?.invoiceNo || '(no#)'}</strong> | Total: ₹{total.toFixed(2)} | Already paid: ₹{alreadyPaid.toFixed(2)}
      </div>

      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <label>Date:</label>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
      </div>

      {payments.map((p, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
          <select value={p.mode} onChange={e=>setPayment(idx,'mode',e.target.value)}>
            {MODES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input type="number" min="0" step="0.01" value={p.amount} onChange={e=>setPayment(idx,'amount',e.target.value)} placeholder="Amount" style={{ width: 120 }} />
          <input value={p.refNo} onChange={e=>setPayment(idx,'refNo',e.target.value)} placeholder="Ref/Txn No. (optional)" />
          <input value={p.note} onChange={e=>setPayment(idx,'note',e.target.value)} placeholder="Note (optional)" style={{ minWidth: 200 }} />
          <button type="button" onClick={() => removeRow(idx)}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={addRow}>+ Add payment mode</button>

      <div style={{ marginTop: 10 }}>
        <strong>Paying now: ₹{totalInput.toFixed(2)}</strong> | Remaining after save: ₹{remaining.toFixed(2)}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Cash Bill'}</button>
        <button type="button" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </form>
  );
}
