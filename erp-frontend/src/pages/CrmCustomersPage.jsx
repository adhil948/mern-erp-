import React, { useEffect, useState } from 'react';
import { useApi } from '../api';
import CustomerForm from '../components/crm/CustomerForm';

export default function CrmCustomersPage() {
  const api = useApi();
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    api.get(`/crm/customers?${params.toString()}`)
      .then(res => setList(res.data))
      .catch(err => alert(err?.response?.data?.error || 'Failed to load customers'));
  };

  useEffect(() => { load(); }, []);

  const onSaved = () => { setShowForm(false); setEditing(null); load(); };

  const remove = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try {
      await api.delete(`/crm/customers/${id}`);
      load();
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Customers</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
        <input placeholder="Search..." value={q} onChange={(e)=>setQ(e.target.value)} />
        <select value={status} onChange={(e)=>setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button onClick={load}>Search</button>
        <button onClick={() => { setEditing(null); setShowForm(true); }}>Add Customer</button>
      </div>

      {showForm && (
        <CustomerForm initial={editing} onSaved={onSaved} onCancel={() => { setShowForm(false); setEditing(null); }} />
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr><th>Name</th><th>Email</th><th>Phone</th><th>Company</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {list.map(c => (
            <tr key={c._id}>
              <td>{c.name}</td>
              <td>{c.email || '-'}</td>
              <td>{c.phone || '-'}</td>
              <td>{c.company || '-'}</td>
              <td>{c.status}</td>
              <td>
                <button onClick={() => { setEditing(c); setShowForm(true); }}>Edit</button>
                <button onClick={() => remove(c._id)} style={{ marginLeft: 8, color: '#e53935' }}>Delete</button>
              </td>
            </tr>
          ))}
          {list.length === 0 && <tr><td colSpan="6">No customers found</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
