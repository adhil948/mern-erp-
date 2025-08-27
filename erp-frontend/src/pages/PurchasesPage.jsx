// src/pages/PurchasesPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useApi } from "../api";
import { useNavigate } from "react-router-dom";
import PurchaseForm from "../components/purchase/PurchaseForm";
import SupplierForm from "../components/purchase/SupplierForm";
import PurchaseTable from "../components/purchase/PurchaseTable";
import { Box, Stack, TextField, MenuItem, Button } from "@mui/material";

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Completed", value: "completed" },
  { label: "Partial", value: "partial" },
  { label: "In-Transit", value: "in-transit" },
  { label: "Cancelled", value: "cancelled" },
];

export default function PurchasesPage() {
  const api = useApi();
  const navigate = useNavigate();

  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Forms
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showSupplierForm, setShowSupplierForm] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      if (status) params.set("status", status);
      const res = await api.get(`/purchases?${params.toString()}`);
      setPurchases(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load purchases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const getSupplierDisplay = (p) => {
    const sid = p?.supplierId;
    if (sid && typeof sid === "object") return sid.name || sid.email || "(supplier)";
    if (typeof sid === "string" && sid.length) return "(supplier)";
    return p?.supplier || "(supplier)";
  };

  const filteredPurchases = useMemo(() => {
    const s = (search || "").trim().toLowerCase();
    return (purchases || []).filter((p) => {
      if (status && (p?.status || "").toLowerCase() !== status) return false;
      if (fromDate) {
        const d = p?.createdAt ? new Date(p.createdAt) : null;
        if (!d || d < new Date(fromDate)) return false;
      }
      if (toDate) {
        const d = p?.createdAt ? new Date(p.createdAt) : null;
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        if (!d || d > end) return false;
      }
      if (!s) return true;
      const dateStr = p?.createdAt ? new Date(p.createdAt).toLocaleDateString() : "-";
      const billNo = p?.billNumber || "-";
      const supplier = getSupplierDisplay(p);
      const totalStr = Number(p?.total || 0).toFixed(2);
      const statusStr = (p?.status || "").toLowerCase();
      const haystack = [dateStr, billNo, supplier, totalStr, statusStr].join(" ").toLowerCase();
      return haystack.includes(s);
    });
  }, [purchases, search, status, fromDate, toDate]);

  const onSaved = () => {
    setShowForm(false);
    setShowSupplierForm(false);
    setEditing(null);
    load();
  };

  const onEdit = (purchase) => {
    setEditing(purchase);
    setShowForm(true);
  };

  const onDelete = async (purchaseId) => {
    if (!window.confirm("Delete this purchase? This will revert stock changes.")) return;
    try {
      await api.delete(`/purchases/${purchaseId}`);
      load();
    } catch (e) {
      alert(e?.response?.data?.error || "Failed to delete purchase");
    }
  };

  const onPrintBill = (purchase) => {
    if (!purchase?._id) return;
    navigate(`/purchases/${purchase._id}/print`);
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setFromDate("");
    setToDate("");
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Purchases</h2>

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
          Add Purchase
        </Button>
        <Button variant="outlined" onClick={load} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
        <Button variant="outlined" onClick={() => setShowSupplierForm(true)}>
          Add Supplier
        </Button>
      </div>

      {/* Filters */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <TextField
            label="Search"
            placeholder="Search date, bill, supplier, total, status"
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
            sx={{ minWidth: 180 }}
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
          <PurchaseForm onSaved={onSaved} initial={editing || null} onCancel={() => setShowForm(false)} />
        </div>
      )}
      {showSupplierForm && (
        <div style={panel}>
          <SupplierForm onSaved={onSaved} onCancel={() => setShowSupplierForm(false)} />
        </div>
      )}

      {/* Table */}
      <PurchaseTable
        purchases={filteredPurchases}
        loading={loading}
        onEdit={onEdit}
        onDelete={(p) => onDelete(typeof p === "string" ? p : p?._id)}
        onView={(p) =>
          alert(
            `Bill: ${p.billNumber || "-"}\nItems: ${p.items?.length || 0}\nTotal: ₹${Number(p.total || 0).toFixed(2)}`
          )
        }
        onPrintBill={onPrintBill}
      />
    </div>
  );
}

const panel = {
  border: "1px solid #ddd",
  padding: 12,
  borderRadius: 8,
  marginBottom: 12,
  background: "#fff",
};
