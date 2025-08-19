import React, { useEffect, useMemo, useState } from 'react';
import { useApi } from '../api';
import ProductForm from '../components/inventory/ProductForm';
import ConfirmDialog from '../components/common/ConfirmDialogue';

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
   const api = useApi();

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (activeOnly) params.set('active', 'true');
      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data);
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // initial

  const filtered = useMemo(() => products, [products]); // server-side handles search/active

  const onAdd = () => { setEditing(null); setShowForm(true); };
  const onEdit = (p) => { setEditing(p); setShowForm(true); };
  const onSaved = () => { setShowForm(false); setEditing(null); load(); };
  const onCancel = () => { setShowForm(false); setEditing(null); };

  const askDelete = (p) => { setToDelete(p); setConfirmOpen(true); };
  const doDelete = async () => {
    try {
      await api.delete(`/products/${toDelete._id}`);
      setConfirmOpen(false);
      setToDelete(null);
      load();
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to delete');
    }
  };

  const headerStyle = { textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #eee' };
  const cellStyle = { padding: '8px 6px', borderBottom: '1px solid #f4f4f4' };

  return (
    <div style={{ padding: 16 }}>
      <h2>Inventory</h2>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <input
          placeholder="Search by name..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ minWidth: 240 }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />
          Active only
        </label>
        <button onClick={load}>Search</button>
        <button onClick={onAdd}>Add Product</button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : filtered.length === 0 ? (
        <div>No products found</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={headerStyle}>Name</th>
                <th style={headerStyle}>SKU</th>
                <th style={headerStyle}>Category</th>
                <th style={headerStyle}>Price</th>
                <th style={headerStyle}>Stock</th>
                <th style={headerStyle}>Status</th>
                <th style={headerStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p._id}>
                  <td style={cellStyle}>{p.name}</td>
                  <td style={cellStyle}>{p.sku || '-'}</td>
                  <td style={cellStyle}>{p.category || '-'}</td>
                  <td style={cellStyle}>₹{Number(p.price).toFixed(2)}</td>
                  <td style={cellStyle}>{p.stock}</td>
                  <td style={cellStyle}>{p.isActive ? 'Active' : 'Inactive'}</td>
                  <td style={cellStyle}>
                    <button onClick={() => onEdit(p)}>Edit</button>
                    <button onClick={() => askDelete(p)} style={{ marginLeft: 6, color: '#e53935' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ProductForm
          initial={editing}
          onCancel={onCancel}
          onSaved={onSaved}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Product"
        message={`Are you sure you want to delete "${toDelete?.name}"?`}
        onCancel={() => { setConfirmOpen(false); setToDelete(null); }}
        onConfirm={doDelete}
      />
    </div>
  );
}
