import React, { useState } from 'react';
import { useApi } from '../../api';

export default function ContactForm({ initial, onSaved, onCancel }) {
  const api = useApi();
  const [firstName, setFirstName] = useState(initial?.firstName || '');
  const [lastName, setLastName] = useState(initial?.lastName || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [company, setCompany] = useState(initial?.company || '');
  const [role, setRole] = useState(initial?.role || '');
  const [address, setAddress] = useState(initial?.address || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [loading, setLoading] = useState(false);

  const isEdit = Boolean(initial?._id);

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = { firstName, lastName, email, phone, company, role, address, notes };
    try {
      let res;
      if (isEdit) res = await api.put(`/crm/contacts/${initial._id}`, payload);
      else res = await api.post('/crm/contacts', payload);
      onSaved?.(res.data);
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to save contact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={save} style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
      <h3 style={{ margin: 0 }}>{isEdit ? 'Edit Contact' : 'Add Contact'}</h3>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
        <input value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="First Name" required style={{ minWidth: 180 }} />
        <input value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Last Name" style={{ minWidth: 160 }} />
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" style={{ minWidth: 200 }} />
        <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone" style={{ minWidth: 160 }} />
        <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company" style={{ minWidth: 200 }} />
        <input value={role} onChange={e=>setRole(e.target.value)} placeholder="Role/Title" style={{ minWidth: 160 }} />
        <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Address" style={{ minWidth: 260 }} />
        <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes" style={{ minWidth: 260 }} />
      </div>
      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
        <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} disabled={loading}>Cancel</button>
      </div>
    </form>
  );
}
