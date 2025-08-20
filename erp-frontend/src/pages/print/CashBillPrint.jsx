import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../../api';
import { inr, ymd } from '../../utils/format';

export default function CashBillPrint() {
  const { id } = useParams();
  const api = useApi();
  const navigate = useNavigate();

  const [bill, setBill] = useState(null);
  const [sale, setSale] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setErr('');
      // Cash bill
      const bres = await api.get(`/cash-bills/${id}`);
      setBill(bres.data);
      // Sale for invoiceNo/customer/total
      const sres = await api.get(`/sales/${bres.data.saleId}`);
      setSale(sres.data);
      // Company
      const cres = await api.get('/company-profile');
      setCompany(cres.data?.profile || null);
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to load cash bill');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // initial

  const onPrint = () => window.print();

  if (loading) return <div style={wrap}><p>Loading…</p></div>;
  if (err) return <div style={wrap}><p style={{ color: 'red' }}>{err}</p></div>;
  if (!bill) return <div style={wrap}><p>Bill not found</p></div>;

  const org = company || {};
  const custName = sale?.customerId?.name || sale?.customer || '(customer)';
  const toolbarStyle = { marginBottom: 12, display: 'flex', gap: 8 };

  return (
    <div style={page}>
      <div style={toolbarStyle} className="no-print">
        <button onClick={() => navigate(-1)}>Back</button>
        <button onClick={load}>Refresh</button>
        <button onClick={onPrint}>Print</button>
      </div>

      <div style={doc}>
        <Header company={org} title="Cash Bill / Receipt" />

        <div style={metaRow}>
          <div style={metaCol}>
            <h4 style={h4}>Receipt</h4>
            <div><strong>No:</strong> {bill.billNo || '-'}</div>
            <div><strong>Date:</strong> {ymd(bill.date)}</div>
            <div><strong>Invoice:</strong> {sale?.invoiceNo || '-'}</div>
          </div>
          <div style={metaCol}>
            <h4 style={h4}>Received From</h4>
            <div>{custName}</div>
            {sale?.customerId?.email ? <div>{sale.customerId.email}</div> : null}
            {sale?.customerId?.phone ? <div>{sale.customerId.phone}</div> : null}
          </div>
        </div>

        <PaymentsTable payments={bill.payments} />

        <div style={{ ...totalsRow, marginTop: 12 }}>
          <strong>Total Received</strong>
          <strong>{inr(bill.totalPaid)}</strong>
        </div>

        <Footer company={org} />
      </div>

      <PrintStyles />
    </div>
  );
}

function Header({ company, title }) {
  return (
    <div style={header}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {company.logoUrl ? <img alt="logo" src={company.logoUrl} style={{ maxHeight: 60 }} /> : null}
        <div>
          <h2 style={{ margin: 0 }}>{company.name || 'Company Name'}</h2>
          <div style={{ fontSize: 13, color: '#555' }}>
            {company.address || ''}{company.address ? ' • ' : ''}{company.phone || ''}{company.phone && company.email ? ' • ' : ''}{company.email || ''}
          </div>
          {company.gstin ? <div style={{ fontSize: 12 }}>GSTIN: {company.gstin}</div> : null}
          {company.website ? <div style={{ fontSize: 12 }}>{company.website}</div> : null}
        </div>
      </div>
      <div style={{ fontWeight: 'bold', fontSize: 20 }}>{title}</div>
    </div>
  );
}

function PaymentsTable({ payments = [] }) {
  return (
    <table style={table}>
      <thead>
        <tr>
          <th style={thLeft}>#</th>
          <th style={thLeft}>Mode</th>
          <th style={thLeft}>Ref/Txn No.</th>
          <th style={thLeft}>Note</th>
          <th style={thRight}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {payments.map((p, idx) => (
          <tr key={idx}>
            <td style={tdLeft}>{idx + 1}</td>
            <td style={tdLeft}>{p.mode}</td>
            <td style={tdLeft}>{p.refNo || '-'}</td>
            <td style={tdLeft}>{p.note || '-'}</td>
            <td style={tdRight}>{inr(p.amount)}</td>
          </tr>
        ))}
        {payments.length === 0 && (
          <tr><td style={tdLeft} colSpan={5}>No payments</td></tr>
        )}
      </tbody>
    </table>
  );
}

function Footer({ company }) {
  return (
    <div style={{ marginTop: 16 }}>
      {company.invoice?.footerNote ? (
        <div style={{ fontSize: 12, color: '#555' }}>{company.invoice.footerNote}</div>
      ) : null}
    </div>
  );
}

// Layout styles (reuse from invoice)
const wrap = { padding: 16 };
const page = { padding: 16, background: '#fff' };
const doc = { maxWidth: 900, margin: '0 auto' };
const header = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 };
const metaRow = { display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 };
const metaCol = { minWidth: 260, border: '1px solid #eee', padding: 10, borderRadius: 6, background: '#fafafa' };
const h4 = { margin: '0 0 6px 0' };

const table = { width: '100%', borderCollapse: 'collapse', marginTop: 8 };
const thLeft = { textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #ddd' };
const thRight = { textAlign: 'right', padding: '8px 6px', borderBottom: '1px solid #ddd' };
const tdLeft = { textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #f0f0f0' };
const tdRight = { textAlign: 'right', padding: '8px 6px', borderBottom: '1px solid #f0f0f0' };
const totalsRow = { display: 'flex', justifyContent: 'space-between' };

function PrintStyles() {
  return (
    <style>{`
      @media print {
        .no-print { display: none !important; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }
      }
      @page {
        size: A4;
        margin: 12mm;
      }
    `}</style>
  );
}
