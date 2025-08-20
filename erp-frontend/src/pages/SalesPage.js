// SalesPage.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useApi } from "../api";
import SaleTable from "../components/sales/SaleTable";
import SaleForm from "../components/sales/SaleForm";
import CashBillForm from "../components/sales/CashBillForm";
import { useNavigate } from "react-router-dom";

// Optional: if you use MUI inputs for consistent UI
import {
  Box,
  Stack,
  TextField,
  MenuItem,
  Button
} from "@mui/material";

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Paid", value: "paid" },
  { label: "Partial", value: "partial" },
  { label: "Unpaid", value: "unpaid" }
];

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

  // Search & Filters (page-level)
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(""); // "", "paid", "partial", "unpaid"
  const [fromDate, setFromDate] = useState(""); // "YYYY-MM-DD"
  const [toDate, setToDate] = useState("");

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

  useEffect(() => {
    load();
  }, []);

  // Helper: same as in table to ensure consistent display text checked by search
  const getCustomerDisplay = (sale) => {
    const cid = sale?.customerId;
    if (cid && typeof cid === "object") {
      return cid.name || cid.email || "(customer)";
    }
    if (typeof cid === "string" && cid.length) return "(customer)";
    return sale?.customer || "(customer)";
  };

  // Filtering happens here (before passing to table)
  const filteredSales = useMemo(() => {
    const s = (search || "").trim().toLowerCase();

    return (sales || []).filter((sale) => {
      // status filter
      if (status) {
        const st = (sale?.paymentStatus || "unpaid").toLowerCase();
        if (st !== status) return false;
      }

      // date range filter
      if (fromDate) {
        const sd = sale?.date ? new Date(sale.date) : null;
        if (!sd || sd < new Date(fromDate)) return false;
      }
      if (toDate) {
        const sd = sale?.date ? new Date(sale.date) : null;
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999); // include entire day
        if (!sd || sd > end) return false;
      }

      // full-text search across visible columns
      if (!s) return true;

      const dateStr = sale?.date ? new Date(sale.date).toLocaleDateString() : "-";
      const invoiceNo = sale?.invoiceNo || "(pending)";
      const customer = getCustomerDisplay(sale);
      const totalStr = Number(sale?.total || 0).toFixed(2);
      const paidStr = Number(sale?.paymentsTotal || 0).toFixed(2);
      const statusStr = (sale?.paymentStatus || "unpaid").toLowerCase();

      const haystack = [
        dateStr,
        invoiceNo,
        customer,
        totalStr,
        paidStr,
        statusStr
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(s);
    });
  }, [sales, search, status, fromDate, toDate]);

  // Create
  const onSaleAdded = () => {
    setShowForm(false);
    setEditing(null);
    load();
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

  // View
  const onView = async (sale) => {
    try {
      const res = await api.get(`/sales/${sale._id}`);
      const full = res.data;
      alert(
        `Invoice: ${full.invoiceNo || "-"}\nDate: ${new Date(full.date).toLocaleString()}\n` +
        `Items: ${full.items?.length || 0}\nTotal: ₹${Number(full.total || 0).toFixed(2)}`
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
  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };
  const closePayments = () => {
    setPaymentsOpen(false);
    setSelectedSale(null);
    setPayments([]);
    setPaymentsErr("");
  };
  const closeCashBill = () => {
    setShowCashBill(false);
    setSelectedSale(null);
  };

  // Clear filters handler
  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setFromDate("");
    setToDate("");
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Sales</h2>

      {err && <div style={{ color: "red", marginBottom: 8 }}>{err}</div>}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          Add Sale
        </Button>

        <Button variant="outlined" onClick={load} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Filters UI */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <TextField
            label="Search"
            placeholder="Search date, invoice, customer, total, paid, status"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 260 }}
          />

          <TextField
            select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            size="small"
            sx={{ minWidth: 160 }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="From"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="To"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
          />

          <Button variant="text" onClick={clearFilters}>
            Clear
          </Button>
        </Stack>
      </Box>

      {/* Forms */}
      {showForm && (
        <div style={panel}>
          <SaleForm
            onSaleAdded={onSaleAdded}
            initial={editing || null}
            onCancel={closeForm}
          />
        </div>
      )}

      {showCashBill && selectedSale && (
        <div style={panel}>
          <CashBillForm
            sale={selectedSale}
            onSaved={onCashBillSaved}
            onCancel={closeCashBill}
          />
        </div>
      )}

      {/* Table receives already-filtered data */}
      <SaleTable
        sales={filteredSales}
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>
                Payments for {selectedSale?.invoiceNo || "(invoice)"}
              </h3>
              <button onClick={closePayments}>Close</button>
            </div>
            {paymentsErr && <div style={{ color: "red" }}>{paymentsErr}</div>}
            <div style={{ marginTop: 8 }}>
              {payments.length === 0 && <div>No payments yet</div>}
              {payments.map((b) => (
                <div
                  key={b._id}
                  style={{
                    padding: 8,
                    border: "1px solid #eee",
                    borderRadius: 6,
                    marginBottom: 8
                  }}
                >
                  <div>
                    <strong>Bill No:</strong> {b.billNo || "-"}
                  </div>
                  <div>
                    <strong>Date:</strong> {new Date(b.date).toLocaleString()}
                  </div>
                  <div>
                    <strong>Total Paid:</strong> ₹{Number(b.totalPaid || 0).toFixed(2)}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <strong>Splits:</strong>
                    <ul style={{ margin: "6px 0 0 18px" }}>
                      {b.payments?.map((p, i) => (
                        <li key={i}>
                          {p.mode}: ₹{Number(p.amount || 0).toFixed(2)}{" "}
                          {p.refNo ? `(Ref: ${p.refNo})` : ""} {p.note ? `- ${p.note}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <button onClick={() => navigate(`/cash-bills/${b._id}/print`)}>
                      Print Cash Bill
                    </button>
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

const panel = {
  border: "1px solid #ddd",
  padding: 12,
  borderRadius: 8,
  marginBottom: 12,
  background: "#fff"
};

const modalWrap = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000
};

const modalBox = {
  width: "min(680px, 92vw)",
  background: "#fff",
  borderRadius: 8,
  padding: 12,
  boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
};
