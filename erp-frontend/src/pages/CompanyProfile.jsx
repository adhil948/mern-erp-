import React, { useEffect, useState } from 'react';
import { useApi } from '../api';
import { useAppState } from '../context/AppContext';

export default function CompanyProfilePage() {
  const api = useApi();
  const { enabledModules, user } = useAppState(); // if you want to restrict UI by role
  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(false);
  const [error, setError] = useState('');

  // form state
  const [name, setName] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const [bank, setBank] = useState({
    accountName: '',
    accountNo: '',
    ifsc: '',
    bankName: ''
  });

  const [invoice, setInvoice] = useState({
    prefix: 'INV-',
    nextNumber: 1,
    footerNote: '',
    terms: ''
  });

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/company-profile');
      const { exists, profile } = res.data;
      setExists(Boolean(exists));
      if (profile) {
        setName(profile.name || '');
        setGstin(profile.gstin || '');
        setAddress(profile.address || '');
        setEmail(profile.email || '');
        setPhone(profile.phone || '');
        setWebsite(profile.website || '');
        setLogoUrl(profile.logoUrl || '');
        setBank({
          accountName: profile.bank?.accountName || '',
          accountNo: profile.bank?.accountNo || '',
          ifsc: profile.bank?.ifsc || '',
          bankName: profile.bank?.bankName || ''
        });
        setInvoice({
          prefix: profile.invoice?.prefix || 'INV-',
          nextNumber: profile.invoice?.nextNumber ?? 1,
          footerNote: profile.invoice?.footerNote || '',
          terms: profile.invoice?.terms || ''
        });
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load company profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // initial

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        name, address, gstin, email, phone, website, logoUrl,
        bank,
        invoice
      };
      const res = await api.post('/company-profile', payload);
      if (res.data?.ok) {
        alert('Company profile saved');
        load();
      } else {
        alert('Saved, but no response flag returned');
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save company profile');
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 920 }}>
      <h2>Company Profile</h2>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !exists && <p style={{ color: '#555' }}>No company profile found. Please set up your details for invoices and bills.</p>}

      {!loading && (
        <form onSubmit={save}>
          <div style={row}>
            <div style={col}>
              <label>Company Name</label>
              <input value={name} onChange={e=>setName(e.target.value)} required />
            </div>
            <div style={col}>
              <label>GSTIN / Tax ID</label>
              <input value={gstin} onChange={e=>setGstin(e.target.value)} />
            </div>
          </div>

          <div style={row}>
            <div style={col}>
              <label>Address</label>
              <textarea rows={3} value={address} onChange={e=>setAddress(e.target.value)} />
            </div>
            <div style={col}>
              <label>Logo URL</label>
              <input value={logoUrl} onChange={e=>setLogoUrl(e.target.value)} placeholder="https://..." />
              {logoUrl ? <img src={logoUrl} alt="logo" style={{ marginTop: 8, maxHeight: 60 }} /> : null}
            </div>
          </div>

          <div style={row}>
            <div style={col}>
              <label>Email</label>
              <input value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
            <div style={col}>
              <label>Phone</label>
              <input value={phone} onChange={e=>setPhone(e.target.value)} />
            </div>
          </div>

          <div style={row}>
            <div style={col}>
              <label>Website</label>
              <input value={website} onChange={e=>setWebsite(e.target.value)} />
            </div>
          </div>

          <h3 style={{ marginTop: 20 }}>Bank Details</h3>
          <div style={row}>
            <div style={col}>
              <label>Account Name</label>
              <input value={bank.accountName} onChange={e=>setBank({ ...bank, accountName: e.target.value })} />
            </div>
            <div style={col}>
              <label>Account Number</label>
              <input value={bank.accountNo} onChange={e=>setBank({ ...bank, accountNo: e.target.value })} />
            </div>
          </div>
          <div style={row}>
            <div style={col}>
              <label>IFSC</label>
              <input value={bank.ifsc} onChange={e=>setBank({ ...bank, ifsc: e.target.value })} />
            </div>
            <div style={col}>
              <label>Bank Name</label>
              <input value={bank.bankName} onChange={e=>setBank({ ...bank, bankName: e.target.value })} />
            </div>
          </div>

          <h3 style={{ marginTop: 20 }}>Invoice Numbering & Terms</h3>
          <div style={row}>
            <div style={col}>
              <label>Invoice Prefix</label>
              <input value={invoice.prefix} onChange={e=>setInvoice({ ...invoice, prefix: e.target.value })} />
            </div>
            <div style={col}>
              <label>Next Invoice Number</label>
              <input
                type="number"
                min={1}
                value={invoice.nextNumber}
                onChange={e=>setInvoice({ ...invoice, nextNumber: Number(e.target.value) })}
              />
            </div>
          </div>

          <div style={row}>
            <div style={col}>
              <label>Footer Note</label>
              <textarea rows={2} value={invoice.footerNote} onChange={e=>setInvoice({ ...invoice, footerNote: e.target.value })} />
            </div>
            <div style={col}>
              <label>Terms & Conditions</label>
              <textarea rows={4} value={invoice.terms} onChange={e=>setInvoice({ ...invoice, terms: e.target.value })} />
            </div>
          </div>

          <button type="submit" style={{ marginTop: 12 }}>Save</button>
        </form>
      )}
    </div>
  );
}

const row = { display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 10 };
const col = { display: 'flex', flexDirection: 'column', minWidth: 260 };
