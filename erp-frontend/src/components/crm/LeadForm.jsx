import React, { useState } from 'react';
import { useApi } from '../../api';

export default function LeadForm({ initial, onSaved, onCancel }) {
  const api = useApi();
  const [name, setName] = useState(initial?.name || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [source, setSource] = useState(initial?.source || '');
  const [stage, setStage] = useState(initial?.stage || 'new');
  const [company, setCompany] = useState(initial?.company || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [loading, setLoading] = useState(false);

  const isEdit = Boolean(initial?._id);

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = { name, email, phone, source, stage, company, notes };
    try {
      let res;
      if (isEdit) res = await api.put(`/crm/leads/${initial._id}`, payload);
      else res = await api.post('/crm/leads', payload);
      onSaved?.(res.data);
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to save lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={save} style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
      <h3 style={{ margin: 0 }}>{isEdit ? 'Edit Lead' : 'Add Lead'}</h3>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" required style={{ minWidth: 220 }} />
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" style={{ minWidth: 200 }} />
        <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone" style={{ minWidth: 160 }} />
        <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company" style={{ minWidth: 200 }} />
        <input value={source} onChange={e=>setSource(e.target.value)} placeholder="Source" style={{ minWidth: 160 }} />
        <select value={stage} onChange={e=>setStage(e.target.value)} style={{ minWidth: 160 }}>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="lost">Lost</option>
          <option value="converted">Converted</option>
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
