import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../../api';
import { inr, ymd } from '../../utils/format';

export default function SalesInvoicePrint() {
  const { id } = useParams();
  const api = useApi();
  const navigate = useNavigate();

  const [sale, setSale] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setErr('');
      // Fetch sale with populated fields
      const sres = await api.get(`/sales/${id}`);
      setSale(sres.data);

      // Fetch company profile
      const cres = await api.get('/company-profile');
      setCompany(cres.data?.profile || null);
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // initial

  const onPrint = () => window.print();

  if (loading) return <div style={wrap}><p>Loading…</p></div>;
  if (err) return <div style={wrap}><p style={{ color: 'red' }}>{err}</p></div>;
  if (!sale) return <div style={wrap}><p>Sale not found</p></div>;

  const org = company || {};
  const custName = sale.customerId?.name || sale.customer || '(customer)';
  const custEmail = sale.customerId?.email || '';
  const custPhone = sale.customerId?.phone || '';
  const custAddr = sale.customerId?.address || '';

  const subtotal = sale.items?.reduce((a, it) => a + Number(it.price||0) * Number(it.quantity||0), 0) || 0;
  const total = Number(sale.total || subtotal);

  const toolbarStyle = { marginBottom: 12, display: 'flex', gap: 8 };

  return (
    <div style={page}>
      {/* Toolbar (hidden in print) */}
      <div style={toolbarStyle} className="no-print">
        <button onClick={() => navigate(-1)}>Back</button>
        <button onClick={load}>Refresh</button>
        <button onClick={onPrint}>Print</button>
      </div>

      <div style={doc}>
        <Header company={org} title="Tax Invoice" />

        <div style={metaRow}>
          <div style={metaCol}>
            <h4 style={h4}>Invoice</h4>
            <div><strong>No:</strong> {sale.invoiceNo || '-'}</div>
            <div><strong>Date:</strong> {ymd(sale.date)}</div>
          </div>
          <div style={metaCol}>
            <h4 style={h4}>Bill To</h4>
            <div>{custName}</div>
            {custEmail ? <div>{custEmail}</div> : null}
            {custPhone ? <div>{custPhone}</div> : null}
            {custAddr ? <div style={{ whiteSpace: 'pre-wrap' }}>{custAddr}</div> : null}
          </div>
        </div>

        <ItemsTable items={sale.items} />

        <Totals subtotal={subtotal} total={total} />

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

function ItemsTable({ items = [] }) {
  return (
    <table style={table}>
      <thead>
        <tr>
          <th style={thLeft}>#</th>
          <th style={thLeft}>Item</th>
          <th style={thRight}>Qty</th>
          <th style={thRight}>Rate</th>
          <th style={thRight}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {items.map((it, idx) => {
          const name = it.productId?.name || it.productId || '(item)';
          const qty = Number(it.quantity || 0);
          const price = Number(it.price || 0);
          const amt = qty * price;
          return (
            <tr key={idx}>
              <td style={tdLeft}>{idx + 1}</td>
              <td style={tdLeft}>{name}</td>
              <td style={tdRight}>{qty}</td>
              <td style={tdRight}>{inr(price)}</td>
              <td style={tdRight}>{inr(amt)}</td>
            </tr>
          );
        })}
        {items.length === 0 && (
          <tr><td style={tdLeft} colSpan={5}>No items</td></tr>
        )}
      </tbody>
    </table>
  );
}

function Totals({ subtotal, total }) {
  return (
    <div style={totalsBox}>
      <div style={totalsRow}><span>Subtotal</span><span>{inr(subtotal)}</span></div>
      {/* Add tax/discount rows here later if you track them */}
      <div style={{ borderTop: '1px solid #ddd', margin: '6px 0' }} />
      <div style={{ ...totalsRow, fontWeight: 'bold' }}>
        <span>Total</span><span>{inr(total)}</span>
      </div>
    </div>
  );
}

function Footer({ company }) {
  return (
    <div style={{ marginTop: 16 }}>
      {company.invoice?.terms ? (
        <>
          <div style={{ fontWeight: 'bold' }}>Terms & Conditions</div>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{company.invoice.terms}</div>
        </>
      ) : null}
      {company.invoice?.footerNote ? (
        <div style={{ marginTop: 8, fontSize: 12, color: '#555' }}>{company.invoice.footerNote}</div>
      ) : null}
      {company.bank?.accountName ? (
        <div style={{ marginTop: 8, fontSize: 12 }}>
          <strong>Bank:</strong> {company.bank.bankName || ''} • <strong>Acct:</strong> {company.bank.accountNo || ''} • <strong>IFSC:</strong> {company.bank.ifsc || ''}
        </div>
      ) : null}
    </div>
  );
}

// Layout styles
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
const totalsBox = { display: 'flex', flexDirection: 'column', gap: 6, width: 320, marginLeft: 'auto', marginTop: 12 };
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
