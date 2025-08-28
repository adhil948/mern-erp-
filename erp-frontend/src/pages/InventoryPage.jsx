// src/pages/InventoryPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useApi } from "../api";
import ProductForm from "../components/inventory/ProductForm";
import ConfirmDialog from "../components/common/ConfirmDialogue";
import ProductTable from "../components/inventory/ProductTable";

// MUI
import {
  Box,
  Stack,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

export default function InventoryPage() {
  const api = useApi();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Form/edit
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);

  // Delete confirm
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (activeOnly) params.set("active", "true");
      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Client-side filter
  const filtered = useMemo(() => {
    const s = (search || "").trim().toLowerCase();
    return (products || []).filter((p) => {
      if (activeOnly && !p.isActive) return false;
      if (!s) return true;

      const name = (p.name || "").toLowerCase();
      const sku = (p.sku || "").toLowerCase();
      const category = (p.category || "").toLowerCase();
      const priceStr = Number(p.price || 0).toFixed(2);
      const stockStr = String(p.stock ?? "");
      const statusStr = p.isActive ? "active" : "inactive";

      return [name, sku, category, priceStr, stockStr, statusStr].some((v) =>
        v.includes(s)
      );
    });
  }, [products, search, activeOnly]);

  // Actions
  const onAdd = () => {
    setEditing(null);
    setShowForm(true);
  };
  const onEdit = (p) => {
    setEditing(p);
    setShowForm(true);
  };
  const onSaved = () => {
    setShowForm(false);
    setEditing(null);
    load();
  };
  const onCancel = () => {
    setShowForm(false);
    setEditing(null);
  };

  const askDelete = (p) => {
    setToDelete(p);
    setConfirmOpen(true);
  };
  const doDelete = async () => {
    try {
      await api.delete(`/products/${toDelete._id}`);
      setConfirmOpen(false);
      setToDelete(null);
      load();
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to delete");
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Inventory</h2>

      {err && <div style={{ color: "red", marginBottom: 8 }}>{err}</div>}

      {/* Top actions */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={onAdd}
          sx={{ textTransform: "none" }}
        >
          ADD PRODUCT
        </Button>
        <Button
          variant="outlined"
          onClick={load}
          disabled={loading}
          sx={{ textTransform: "none" }}
        >
          {loading ? "Refreshing..." : "REFRESH"}
        </Button>
      </div>

      {/* Filters */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
          <TextField
            label="Search"
            placeholder="Search name, SKU, category, price, stock, status"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 260 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
                size="small"
              />
            }
            label="Active only"
          />

          <Button
            variant="text"
            onClick={() => {
              setSearch("");
              setActiveOnly(true);
            }}
            sx={{ textTransform: "none" }}
          >
            CLEAR
          </Button>
        </Stack>
      </Box>

            {/* Form panel */}
{showForm && (
  <ProductForm initial={editing} onCancel={onCancel} onSaved={onSaved} />
)}

      {/* Product table */}
      <ProductTable
        products={filtered}
        loading={loading}
        onEdit={onEdit}
        onDelete={(id) => {
          const prod = products.find((p) => p._id === id);
          if (prod) askDelete(prod);
        }}
      />


      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete Product"
        message={`Are you sure you want to delete "${toDelete?.name}"?`}
        onCancel={() => {
          setConfirmOpen(false);
          setToDelete(null);
        }}
        onConfirm={doDelete}
      />
    </div>
  );
}
