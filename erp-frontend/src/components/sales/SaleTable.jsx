import React from "react";

function currencyINR(n) {
  const x = Number(n || 0);
  return `₹${x.toFixed(2)}`;
}

function getCustomerDisplay(sale) {
  // Prefer populated customer object -> name/email
  const cid = sale?.customerId;
  if (cid && typeof cid === 'object') {
    return cid.name || cid.email || '(customer)';
  }
  // If only id or missing, fallback to string field or placeholder
  if (typeof cid === 'string' && cid.length) return '(customer)';
  return sale?.customer || '(customer)';
}

export default function SaleTable({
  sales,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onPrintInvoice,
  onAddPayment,
  onViewPayments,
}) {
  return (
    <div style={{ overflowX: 'auto', opacity: loading ? 0.6 : 1 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Date</th>
            <th style={th}>Invoice #</th>
            <th style={th}>Customer</th>
            <th style={th}>Total</th>
            <th style={th}>Paid</th>
            <th style={th}>Status</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sales?.map((sale) => {
            const dateStr = sale?.date ? new Date(sale.date).toLocaleDateString() : '-';
            const invoiceNo = sale?.invoiceNo || '(pending)';
            const customer = getCustomerDisplay(sale);
            const total = currencyINR(sale?.total);
            const paid = currencyINR(sale?.paymentsTotal || 0);
            const status = (sale?.paymentStatus || 'unpaid').toUpperCase();

            return (
              <tr key={sale?._id}>
                <td style={td}>{dateStr}</td>
                <td style={td}>{invoiceNo}</td>
                <td style={td}>{customer}</td>
                <td style={td}>{total}</td>
                <td style={td}>{paid}</td>
                <td style={td}>
                  <span style={{ ...badge, background: statusColor(sale?.paymentStatus) }}>
                    {status}
                  </span>
                </td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => onView?.(sale)}>View</button>
                    <button onClick={() => onEdit?.(sale)}>Edit</button>
                    <button
                      onClick={() => {
                        if (!sale?._id) return;
                        if (window.confirm('Delete this sale? This will restore stock.')) {
                          onDelete?.(sale._id);
                        }
                      }}
                      style={{ color: '#e53935' }}
                    >
                      Delete
                    </button>
                    <button onClick={() => onPrintInvoice?.(sale)}>Print Invoice</button>
                    <button onClick={() => onAddPayment?.(sale)}>Add Payment</button>
                    <button onClick={() => onViewPayments?.(sale)}>View Payments</button>
                  </div>
                </td>
              </tr>
            );
          })}
          {(!sales || sales.length === 0) && (
            <tr>
              <td style={td} colSpan={7}>No sales found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const th = { textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' };
const td = { padding: '8px 6px', borderBottom: '1px solid #f4f4f4', verticalAlign: 'middle' };
const badge = { color: '#fff', padding: '2px 8px', borderRadius: 6, fontSize: 12, display: 'inline-block' };

function statusColor(s) {
  switch (s) {
    case 'paid': return '#2e7d32';
    case 'partial': return '#ef6c00';
    case 'unpaid':
    default:
      return '#616161';
  }
}
