import React, { useEffect, useState } from 'react';
import { useApi } from '../api';
import PurchaseForm from '../components/purchase/PurchaseForm';
import SupplierForm from '../components/purchase/SupplierForm';

export default function PurchasesPage() {
  const api = useApi();
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);

  // CRUD state
  const [editing, setEditing] = useState(null);        // purchase being edited
  const [expandedId, setExpandedId] = useState(null);  // for viewing items inline
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const load = async () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    try {
      setLoading(true);
      setErr('');
      const res = await api.get(`/purchases?${params.toString()}`);
      setList(res.data);
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // initial

  const onSaved = () => {
    setShowForm(false);
    setShowSupplierForm(false);
    setEditing(null);
    load();
  };

  const onEdit = (purchase) => {
    setEditing(purchase);
    setShowForm(true);
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this purchase? This will revert stock changes.')) return;
    try {
      await api.delete(`/purchases/${id}`);
      // if deleted one was expanded, collapse it
      if (expandedId === id) setExpandedId(null);
      load();
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to delete purchase');
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

return (
    <div style={{ padding: 16 }}>
        <h2>Purchases</h2>

        {/* Filters and actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
            <input placeholder="Search by bill no." value={q} onChange={(e)=>setQ(e.target.value)} />
            <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} />
            <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} />
            <button onClick={load}>Search</button>
            <button onClick={() => { setEditing(null); setShowForm(true); }}>Add Purchase</button>
            <button onClick={() => setShowSupplierForm(true)}>Add Supplier</button>
        </div>

        {err && <div style={{ color: 'red', marginBottom: 8 }}>{err}</div>}

        {/* Forms */}
        {showForm && (
            <PurchaseForm
                onSaved={onSaved}
                // optionally pass initial for editing (requires your form to accept and prefill)
                initial={editing || null}
            />
        )}
        {showSupplierForm && <SupplierForm onSaved={onSaved} />}

        {/* List */}
        <div style={{ overflowX: 'auto', opacity: loading ? 0.6 : 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={th}></th>
                        <th style={th}>Date & Time</th>
                        <th style={th}>Bill No.</th>
                        <th style={th}>Supplier</th>
                        <th style={th}>Total</th>
                        <th style={th}>Items</th>
                        <th style={th}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {list.map(p => (
                        <React.Fragment key={p._id}>
                            <tr>
                                <td style={td}>
                                    <button onClick={() => toggleExpand(p._id)}>
                                        {expandedId === p._id ? '▾' : '▸'}
                                    </button>
                                </td>
                                <td style={td}>
                                    {p.createdAt
                                        ? new Date(p.createdAt).toLocaleString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })
                                        : '-'}
                                </td>
                                <td style={td}>{p.billNumber || '-'}</td>
                                <td style={td}>{p.supplierId?.name || '-'}</td>
                                <td style={td}>₹{Number(p.total || 0).toFixed(2)}</td>
                                <td style={td}>{p.items?.length || 0}</td>
                                <td style={td}>
                                    <button onClick={() => onEdit(p)}>Edit</button>
                                    <button onClick={() => onDelete(p._id)} style={{ marginLeft: 8, color: '#e53935' }}>
                                        Delete
                                    </button>
                                </td>
                            </tr>

                            {expandedId === p._id && (
                                <tr>
                                    <td style={td} colSpan={7}>
                                        <ItemsTable items={p.items} />
                                        {p.notes && <div style={{ marginTop: 8 }}><strong>Notes:</strong> {p.notes}</div>}
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                    {list.length === 0 && !loading && <tr><td style={td} colSpan="7">No purchases found</td></tr>}
                </tbody>
            </table>
        </div>
    </div>
);
}

function ItemsTable({ items = [] }) {
  return (
    <div style={{ marginTop: 8, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fafafa' }}>
        <thead>
          <tr>
            <th style={th}>Product</th>
            <th style={th}>Qty</th>
            <th style={th}>Cost</th>
            <th style={th}>Line Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => {
            const name = it.productId?.name || it.productId || '(product)';
            const qty = Number(it.quantity || 0);
            const cost = Number(it.costPrice || 0);
            const lineTotal = qty * cost;
            return (
              <tr key={i}>
                <td style={td}>{name}</td>
                <td style={td}>{qty}</td>
                <td style={td}>₹{cost.toFixed(2)}</td>
                <td style={td}>₹{lineTotal.toFixed(2)}</td>
              </tr>
            );
          })}
          {items.length === 0 && <tr><td style={td} colSpan="4">No items</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

const th = { textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #eee' };
const td = { padding: '8px 6px', borderBottom: '1px solid #f4f4f4' };
