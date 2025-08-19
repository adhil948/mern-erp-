import React, { useEffect, useMemo, useState } from 'react';
import { useApi } from '../api';
import CustomerForm from '../components/crm/CustomerForm';
import ContactForm from '../components/crm/ContactForm';
import LeadForm from '../components/crm/LeadForm';

export default function CrmCustomersPage() {
  const api = useApi();

  // Data
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [contacts, setContacts] = useState([]);

  // Filters (shared q; specific status/stage)
  const [q, setQ] = useState('');
  const [custStatus, setCustStatus] = useState('');
  const [leadStage, setLeadStage] = useState('');
  const [showContacts, setShowContacts] = useState(false);

  // Forms
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingContact, setEditingContact] = useState(null);
  const [editingLead, setEditingLead] = useState(null);

  // Loaders
  const loadCustomers = async () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (custStatus) params.set('status', custStatus);
    const res = await api.get(`/crm/customers?${params.toString()}`);
    setCustomers(res.data);
  };

  const loadLeads = async () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (leadStage) params.set('stage', leadStage);
    const res = await api.get(`/crm/leads?${params.toString()}`);
    setLeads(res.data);
  };

  const loadContacts = async () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    const res = await api.get(`/crm/contacts?${params.toString()}`);
    setContacts(res.data);
  };

  const loadAll = async () => {
    try {
      await Promise.all([loadCustomers(), loadLeads(), showContacts ? loadContacts() : Promise.resolve()]);
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to load CRM data');
    }
  };

  useEffect(() => { loadAll(); /* initial */ }, []); // eslint-disable-line

  const onSavedAny = () => {
    // Close all forms and reload
    setShowCustomerForm(false);
    setShowContactForm(false);
    setShowLeadForm(false);
    setEditingCustomer(null);
    setEditingContact(null);
    setEditingLead(null);
    loadAll();
  };

  const removeCustomer = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try {
      await api.delete(`/crm/customers/${id}`);
      loadCustomers();
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to delete customer');
    }
  };

  const removeLead = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      await api.delete(`/crm/leads/${id}`);
      loadLeads();
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to delete lead');
    }
  };

  const removeContact = async (id) => {
    if (!window.confirm('Delete this contact?')) return;
    try {
      await api.delete(`/crm/contacts/${id}`);
      loadContacts();
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to delete contact');
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>CRM</h2>

      {/* Filters toolbar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <input placeholder="Search name/email/phone/company..." value={q} onChange={(e)=>setQ(e.target.value)} style={{ minWidth: 240 }} />
        <button onClick={loadAll}>Search</button>

        {/* Customer status filter */}
        <label style={{ marginLeft: 10 }}>
          Customer status:
          <select value={custStatus} onChange={(e)=>setCustStatus(e.target.value)} style={{ marginLeft: 6 }}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>

        {/* Lead stage filter */}
        <label style={{ marginLeft: 10 }}>
          Lead stage:
          <select value={leadStage} onChange={(e)=>setLeadStage(e.target.value)} style={{ marginLeft: 6 }}>
            <option value="">All</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="lost">Lost</option>
            <option value="converted">Converted</option>
          </select>
        </label>

        {/* Toggle contacts section */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 10 }}>
          <input type="checkbox" checked={showContacts} onChange={(e) => {
            setShowContacts(e.target.checked);
            if (e.target.checked) loadContacts();
          }} />
          Show Contacts
        </label>

        {/* Actions */}
        <button onClick={() => { setEditingCustomer(null); setShowCustomerForm(true); }}>Add Customer</button>
        <button onClick={() => { setEditingContact(null); setShowContactForm(true); }}>Add Contact</button>
        <button onClick={() => { setEditingLead(null); setShowLeadForm(true); }}>Add Lead</button>
      </div>

      {/* Forms (inline) */}
      {showCustomerForm && (
        <CustomerForm
          initial={editingCustomer}
          onSaved={onSavedAny}
          onCancel={() => { setShowCustomerForm(false); setEditingCustomer(null); }}
        />
      )}
      {showContactForm && (
        <ContactForm
          initial={editingContact}
          onSaved={onSavedAny}
          onCancel={() => { setShowContactForm(false); setEditingContact(null); }}
        />
      )}
      {showLeadForm && (
        <LeadForm
          initial={editingLead}
          onSaved={onSavedAny}
          onCancel={() => { setShowLeadForm(false); setEditingLead(null); }} // fixed: previously closing wrong form
        />
      )}

      {/* Customers table */}
      <h3 style={{ marginTop: 20 }}>Customers</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr><th style={th}>Name</th><th style={th}>Email</th><th style={th}>Phone</th><th style={th}>Company</th><th style={th}>Status</th><th style={th}>Actions</th></tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c._id}>
                <td style={td}>{c.name}</td>
                <td style={td}>{c.email || '-'}</td>
                <td style={td}>{c.phone || '-'}</td>
                <td style={td}>{c.company || '-'}</td>
                <td style={td}>{c.status}</td>
                <td style={td}>
                  <button onClick={() => { setEditingCustomer(c); setShowCustomerForm(true); }}>Edit</button>
                  <button onClick={() => removeCustomer(c._id)} style={{ marginLeft: 8, color: '#e53935' }}>Delete</button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && <tr><td style={td} colSpan="6">No customers found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Leads table */}
      <h3 style={{ marginTop: 24 }}>Leads</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr><th style={th}>Name</th><th style={th}>Email</th><th style={th}>Phone</th><th style={th}>Company</th><th style={th}>Source</th><th style={th}>Stage</th><th style={th}>Actions</th></tr>
          </thead>
          <tbody>
            {leads.map(l => (
              <tr key={l._id}>
                <td style={td}>{l.name}</td>
                <td style={td}>{l.email || '-'}</td>
                <td style={td}>{l.phone || '-'}</td>
                <td style={td}>{l.company || '-'}</td>
                <td style={td}>{l.source || '-'}</td>
                <td style={td}>
                  <span style={{ padding: '2px 6px', borderRadius: 4, background: stageColor(l.stage), color: '#fff' }}>
                    {l.stage}
                  </span>
                </td>
                <td style={td}>
                  <button onClick={() => { setEditingLead(l); setShowLeadForm(true); }}>Edit</button>
                  <button onClick={() => removeLead(l._id)} style={{ marginLeft: 8, color: '#e53935' }}>Delete</button>
                </td>
              </tr>
            ))}
            {leads.length === 0 && <tr><td style={td} colSpan="7">No leads found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Optional Contacts section */}
      {showContacts && (
        <>
          <h3 style={{ marginTop: 24 }}>Contacts</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr><th style={th}>First</th><th style={th}>Last</th><th style={th}>Email</th><th style={th}>Phone</th><th style={th}>Company</th><th style={th}>Role</th><th style={th}>Actions</th></tr>
              </thead>
              <tbody>
                {contacts.map(ct => (
                  <tr key={ct._id}>
                    <td style={td}>{ct.firstName}</td>
                    <td style={td}>{ct.lastName || '-'}</td>
                    <td style={td}>{ct.email || '-'}</td>
                    <td style={td}>{ct.phone || '-'}</td>
                    <td style={td}>{ct.company || '-'}</td>
                    <td style={td}>{ct.role || '-'}</td>
                    <td style={td}>
                      <button onClick={() => { setEditingContact(ct); setShowContactForm(true); }}>Edit</button>
                      <button onClick={() => removeContact(ct._id)} style={{ marginLeft: 8, color: '#e53935' }}>Delete</button>
                    </td>
                  </tr>
                ))}
                {contacts.length === 0 && <tr><td style={td} colSpan="7">No contacts found</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// simple styles
const th = { textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #eee' };
const td = { padding: '8px 6px', borderBottom: '1px solid #f4f4f4' };

function stageColor(stage) {
  switch (stage) {
    case 'new': return '#546e7a';
    case 'contacted': return '#1976d2';
    case 'qualified': return '#2e7d32';
    case 'lost': return '#8e24aa';
    case 'converted': return '#ef6c00';
    default: return '#616161';
  }
}
