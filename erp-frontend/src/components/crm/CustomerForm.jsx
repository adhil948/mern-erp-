import React, { useState } from 'react';
import { useApi } from '../../api';

export default function CustomerForm({ initial, onSaved, onCancel }) {
  const api = useApi();
  const [name, setName] = useState(initial?.name || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [company, setCompany] = useState(initial?.company || '');
  const [address, setAddress] = useState(initial?.address || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [status, setStatus] = useState(initial?.status || 'active');
  const [loading, setLoading] = useState(false);

  const isEdit = Boolean(initial?._id);

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = { name, email, phone, company, address, notes, status };
    try {
      let res;
      if (isEdit) res = await api.put(`/crm/customers/${initial._id}`, payload);
      else res = await api.post('/crm/customers', payload);
      onSaved?.(res.data);
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={save} style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
      <h3 style={{ margin: 0 }}>{isEdit ? 'Edit Customer' : 'Add Customer'}</h3>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" required style={{ minWidth: 220 }} />
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" style={{ minWidth: 220 }} />
        <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone" style={{ minWidth: 160 }} />
        <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company" style={{ minWidth: 200 }} />
        <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Address" style={{ minWidth: 260 }} />
        <select value={status} onChange={e=>setStatus(e.target.value)} style={{ minWidth: 140 }}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes" style={{ minWidth: 260 }} />
      </div>
      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
        <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} disabled={loading}>Cancel</button>
      </div>
    </form>
  );
}
