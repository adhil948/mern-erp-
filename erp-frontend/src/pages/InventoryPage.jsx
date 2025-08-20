import React, { useEffect, useMemo, useState } from "react";
import { useApi } from "../api";
import ProductForm from "../components/inventory/ProductForm";
import ConfirmDialog from "../components/common/ConfirmDialogue";

// MUI controls to match Sales page look-and-feel
import {
  Box,
  Stack,
  TextField,
  MenuItem,
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

  // Filters (align with Sales)
  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);

  // Delete confirm
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // Pagination (same pattern as Sales)
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

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

  // Client-side filter to keep UI snappy (like Sales)
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

  // Pagination slice
  const paged = useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [search, activeOnly]);

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

  // Styles to match Sales
  const panel = {
    border: "1px solid #ddd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    background: "#fff",
  };
  const headerStyle = {
    textAlign: "left",
    padding: "8px 6px",
    borderBottom: "1px solid #eee",
  };
  const cellStyle = {
    padding: "8px 6px",
    borderBottom: "1px solid #f4f4f4",
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Inventory</h2>

      {err && <div style={{ color: "red", marginBottom: 8 }}>{err}</div>}

      {/* Top actions — same order/text as Sales */}
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

      {/* Filters row — use MUI for consistent look */}
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

      {/* Table — same density and spacing style */}
      {loading ? (
        <div>Loading...</div>
      ) : filtered.length === 0 ? (
        <div>No products found</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={headerStyle}>Name</th>
                <th style={headerStyle}>SKU</th>
                <th style={headerStyle}>Category</th>
                <th style={headerStyle}>Price</th>
                <th style={headerStyle}>Stock</th>
                <th style={headerStyle}>Status</th>
                <th style={headerStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((p) => (
                <tr key={p._id}>
                  <td style={cellStyle}>{p.name}</td>
                  <td style={cellStyle}>{p.sku || "-"}</td>
                  <td style={cellStyle}>{p.category || "-"}</td>
                  <td style={cellStyle}>₹{Number(p.price || 0).toFixed(2)}</td>
                  <td style={cellStyle}>{p.stock ?? 0}</td>
                  <td style={cellStyle}>{p.isActive ? "Active" : "Inactive"}</td>
                  <td style={cellStyle}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onEdit(p)}
                      sx={{ textTransform: "none", mr: 1 }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => askDelete(p)}
                      sx={{ textTransform: "none" }}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination — matches Sales semantics */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 12,
              paddingTop: 8,
            }}
          >
            <div style={{ color: "#666" }}>
              {filtered.length === 0
                ? "0–0 of 0"
                : `${page * rowsPerPage + 1}–${Math.min(
                    filtered.length,
                    (page + 1) * rowsPerPage
                  )} of ${filtered.length}`}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(0);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>

              <Button
                size="small"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                sx={{ textTransform: "none" }}
              >
                ‹
              </Button>
              <Button
                size="small"
                onClick={() =>
                  setPage((p) =>
                    (p + 1) * rowsPerPage >= filtered.length ? p : p + 1
                  )
                }
                disabled={(page + 1) * rowsPerPage >= filtered.length}
                sx={{ textTransform: "none" }}
              >
                ›
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Form panel (same look as Sales) */}
      {showForm && (
        <div style={panel}>
          <ProductForm initial={editing} onCancel={onCancel} onSaved={onSaved} />
        </div>
      )}

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
