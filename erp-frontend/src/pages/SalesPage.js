// SalesPage.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useApi } from "../api";
import SaleTable from "../components/sales/SaleTable";
import SaleForm from "../components/sales/SaleForm";
import CashBillForm from "../components/sales/CashBillForm"; // from step 2
import { useNavigate } from "react-router-dom";

export default function SalesPage() {
  const api = useApi();
  const navigate = useNavigate();

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Create/Edit Sale
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  // Cash Bill (payments)
  const [showCashBill, setShowCashBill] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  // Payments view
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [payments, setPayments] = useState([]);
  const [paymentsErr, setPaymentsErr] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const res = await api.get("/sales");
      setSales(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load sales");
      console.error("Load sales failed", e?.response?.status, e?.response?.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // initial

  // Create
  const onSaleAdded = (sale) => {
    setShowForm(false);
    setEditing(null);
    // Option A: refresh entire list to include populated references and totals
    load();
    // Option B: optimistic append:
    // setSales(prev => [...prev, sale]);
  };

  // Edit
  const onEdit = (sale) => {
    setEditing(sale);
    setShowForm(true);
  };

  // Delete
  const onDelete = async (saleId) => {
    try {
      await api.delete(`/sales/${saleId}`);
      await load();
    } catch (e) {
      alert(e?.response?.data?.error || "Failed to delete sale");
    }
  };

  // View (optional: fetch single and show a simple modal)
  const onView = async (sale) => {
    try {
      const res = await api.get(`/sales/${sale._id}`);
      const full = res.data;
      alert(
        `Invoice: ${full.invoiceNo || "-"}\nDate: ${new Date(full.date).toLocaleString()}\n` +
        `Items: ${full.items?.length || 0}\nTotal: ₹${Number(full.total||0).toFixed(2)}`
      );
    } catch (e) {
      alert(e?.response?.data?.error || "Failed to load sale details");
    }
  };

  // Print invoice
  const onPrintInvoice = (sale) => {
    navigate(`/sales/${sale._id}/print`);
  };

  // Add payment (Cash Bill)
  const onAddPayment = (sale) => {
    setSelectedSale(sale);
    setShowCashBill(true);
  };

  const onCashBillSaved = () => {
    setShowCashBill(false);
    setSelectedSale(null);
    load();
  };

  // View payments
  const onViewPayments = async (sale) => {
    try {
      setPaymentsErr("");
      const res = await api.get(`/cash-bills?saleId=${sale._id}`);
      setPayments(res.data || []);
      setSelectedSale(sale);
      setPaymentsOpen(true);
    } catch (e) {
      setPaymentsErr(e?.response?.data?.error || "Failed to load payments");
    }
  };

  // Close modals
  const closeForm = () => { setShowForm(false); setEditing(null); };
  const closePayments = () => { setPaymentsOpen(false); setSelectedSale(null); setPayments([]); setPaymentsErr(""); };
  const closeCashBill = () => { setShowCashBill(false); setSelectedSale(null); };

  return (
    <div style={{ padding: 16 }}>
      <h2>Sales</h2>

      {err && <div style={{ color: 'red', marginBottom: 8 }}>{err}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => { setEditing(null); setShowForm(true); }}>Add Sale</button>
        <button onClick={load} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</button>
      </div>

      {showForm && (
        <div style={panel}>
          <SaleForm
            onSaleAdded={onSaleAdded}
            // If your SaleForm supports editing, pass initial={editing}
            // and switch to PUT inside the form when initial?._id exists.
            initial={editing || null}
            onCancel={closeForm}
          />
        </div>
      )}

      {showCashBill && selectedSale && (
        <div style={panel}>
          <CashBillForm sale={selectedSale} onSaved={onCashBillSaved} onCancel={closeCashBill} />
        </div>
      )}

      <SaleTable
        sales={sales}
        loading={loading}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        onPrintInvoice={onPrintInvoice}
        onAddPayment={onAddPayment}
        onViewPayments={onViewPayments}
      />

      {/* Simple payments modal */}
      {paymentsOpen && (
        <div style={modalWrap}>
          <div style={modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Payments for {selectedSale?.invoiceNo || '(invoice)'}</h3>
              <button onClick={closePayments}>Close</button>
            </div>
            {paymentsErr && <div style={{ color: 'red' }}>{paymentsErr}</div>}
            <div style={{ marginTop: 8 }}>
              {payments.length === 0 && <div>No payments yet</div>}
              {payments.map((b) => (
                <div key={b._id} style={{ padding: 8, border: '1px solid #eee', borderRadius: 6, marginBottom: 8 }}>
                  <div><strong>Bill No:</strong> {b.billNo || '-'}</div>
                  <div><strong>Date:</strong> {new Date(b.date).toLocaleString()}</div>
                  <div><strong>Total Paid:</strong> ₹{Number(b.totalPaid||0).toFixed(2)}</div>
                  <div style={{ marginTop: 6 }}>
                    <strong>Splits:</strong>
                    <ul style={{ margin: '6px 0 0 18px' }}>
                      {b.payments?.map((p,i) => (
                        <li key={i}>
                          {p.mode}: ₹{Number(p.amount||0).toFixed(2)} {p.refNo ? `(Ref: ${p.refNo})` : ''} {p.note ? `- ${p.note}` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <button onClick={() => navigate(`/cash-bills/${b._id}/print`)}>Print Cash Bill</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const panel = { border: '1px solid #ddd', padding: 12, borderRadius: 8, marginBottom: 12, background: '#fff' };

const modalWrap = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
};
const modalBox = {
  width: 'min(680px, 92vw)', background: '#fff', borderRadius: 8,
  padding: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
};
