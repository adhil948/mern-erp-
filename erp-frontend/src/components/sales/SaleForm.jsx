import React, { useState, useEffect } from "react";
import { useApi } from "../../api";
import ProductSelect from "../common/ProductSelect";
import CustomerSelect from "../crm/CustomerSelect";

// MUI
import {
  Box,
  Paper,
  Grid,
  TextField,
  Typography,
  Button,
  Divider,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Fade,
  Stack
} from "@mui/material";

// Icons
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PercentIcon from "@mui/icons-material/Percent";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import AddIcon from "@mui/icons-material/Add";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

import CustomerForm from "../crm/CustomerForm"; // assumes CustomerForm exports a MUI-styled form as done earlier

export default function SaleForm({ onSaleAdded, initial = null }) {
  const api = useApi();

  const [customerId, setCustomerId] = useState("");
  const [customer, setCustomer] = useState("");
  const [items, setItems] = useState([{ product: null, productId: "", quantity: 1, price: 0 }]);

  const [subTotal, setSubTotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [total, setTotal] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Add Customer modal
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  const isEditing = Boolean(initial?._id);

  // Prefill when editing
  useEffect(() => {
    if (!initial) {
      setCustomerId("");
      setCustomer("");
      setItems([{ product: null, productId: "", quantity: 1, price: 0 }]);
      setDiscount(0);
      return;
    }

    setCustomerId(
      typeof initial.customerId === "object" ? initial.customerId._id : (initial.customerId || "")
    );
    setCustomer(initial.customer || "");

    const mapped = (initial.items || []).map((it) => {
      const productObj = (typeof it.productId === "object" && it.productId) || it.product || null;
      const pid =
        (typeof it.productId === "string" && it.productId) ||
        (typeof it.productId === "object" && it.productId?._id) ||
        productObj?._id ||
        "";

      return {
        product: productObj,
        productId: pid,
        quantity: Number(it.quantity || 0),
        price: Number(it.price || 0),
      };
    });
    setItems(mapped.length ? mapped : [{ product: null, productId: "", quantity: 1, price: 0 }]);

    setDiscount(Number(initial.discount || 0));
  }, [initial]);

  // Recalculate totals
  useEffect(() => {
    const st = items.reduce(
      (acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 0),
      0
    );
    setSubTotal(st);
    const d = Number(discount) || 0;
    setTotal(Math.max(0, st - d));
  }, [items, discount]);

  // Helpers
  const updateItem = (index, patch) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const handleItemChange = (index, field, value) => {
    if (field === "quantity" || field === "price") {
      value = Number(value);
      if (Number.isNaN(value) || value < 0) value = 0;
    }
    updateItem(index, { [field]: value });
  };

  const handleProductChange = (index, selectedProduct) => {
    if (!selectedProduct) {
      updateItem(index, { product: null, productId: "", price: 0 });
      return;
    }
    updateItem(index, {
      product: selectedProduct,
      productId: selectedProduct._id,
      price: Number(selectedProduct.price) || 0,
    });
  };

  const addItem = () =>
    setItems((prev) => [...prev, { product: null, productId: "", quantity: 1, price: 0 }]);

  const removeItem = (index) => {
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [{ product: null, productId: "", quantity: 1, price: 0 }];
    });
  };

  // Validation
  const validate = () => {
    if (!customerId) return "Please select a customer.";
    if (!items.length) return "Add at least one item.";
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.productId) return `Row ${i + 1}: Select a product.`;
      if (!it.quantity || it.quantity <= 0) return `Row ${i + 1}: Quantity must be > 0.`;
      if (it.price == null || it.price < 0) return `Row ${i + 1}: Price must be >= 0.`;
    }
    if (total < 0) return "Total cannot be negative.";
    return "";
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerId,
        customer: customer || undefined,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          price: it.price,
        })),
        subTotal,
        discount,
        total,
      };

      const res = isEditing
        ? await api.put(`/sales/${initial._id}`, payload)
        : await api.post("/sales", payload);

      onSaleAdded?.(res.data);

      if (!isEditing) {
        setCustomerId("");
        setCustomer("");
        setItems([{ product: null, productId: "", quantity: 1, price: 0 }]);
        setDiscount(0);
      }
    } catch (err) {
      setError(err?.response?.data?.error || (isEditing ? "Failed to update sale" : "Failed to save sale"));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle customer created in dialog
  const handleCustomerSaved = (created) => {
    setCustomerModalOpen(false);
    // assume created has _id and name
    if (created?._id) setCustomerId(created._id);
    if (created?.name) setCustomer(created.name);
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      backgroundColor: "#fff",
    },
  };

  return (
    <Fade in timeout={300}>
      <Paper
        elevation={8}
        sx={{
          p: 3,
          borderRadius: 3,
          maxWidth: 1000,
          mx: "auto",
          background: "linear-gradient(to bottom, #ffffff, #f8f9fa)",
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          border: "1px solid #e0e0e0",
          mt: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2.5 }}>
          <ShoppingCartIcon color="primary" sx={{ mr: 1.5, fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#2d3748" }}>
            {isEditing ? "Edit Sale" : "New Sale"}
          </Typography>
        </Box>

        {error && (
          <Box
            sx={{
              mb: 2,
              px: 2,
              py: 1,
              borderRadius: 1,
              color: "#b91c1c",
              bgcolor: "#fee2e2",
              border: "1px solid #fecaca",
            }}
          >
            {error}
          </Box>
        )}

        <Divider sx={{ mb: 2, bgcolor: "#e2e8f0" }} />

        <Box component="form" onSubmit={handleSubmit}>
          {/* Customer section */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, color: "text.secondary" }}>
                Customer
              </Typography>
              <CustomerSelect value={customerId} onChange={setCustomerId} />
            </Box>
            <Button
              variant="outlined"
              startIcon={<PersonAddIcon />}
              onClick={() => setCustomerModalOpen(true)}
              sx={{ whiteSpace: "nowrap", borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Add Customer
            </Button>
          </Stack>

          <Divider sx={{ my: 2, bgcolor: "#e2e8f0" }} />

          {/* Items header */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Items
            </Typography>
            <Button
              onClick={addItem}
              startIcon={<AddIcon />}
              sx={{ ml: "auto", textTransform: "none", borderRadius: 2 }}
            >
              Add Item
            </Button>
          </Box>

          {/* Items grid */}
          <Grid container spacing={2}>
            {items.map((item, index) => (
              <React.Fragment key={index}>
             
                  <ProductSelect
                    value={item.product}
                    onChange={(prod) => handleProductChange(index, prod)}
                  />
             
                <Grid item xs={6} md={3}>
                  <TextField
                    label="Quantity"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                    fullWidth
                    size="medium"
                    sx={inputSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FormatListNumberedIcon color="action" />
                        </InputAdornment>
                      ),
                      inputProps: { min: 1 },
                    }}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField
                    label="Price"
                    type="number"
                    value={item.price}
                    onChange={(e) => handleItemChange(index, "price", e.target.value)}
                    fullWidth
                    size="medium"
                    sx={inputSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CurrencyRupeeIcon color="action" />
                        </InputAdornment>
                      ),
                      inputProps: { min: 0, step: 0.01 },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <IconButton color="error" onClick={() => removeItem(index)} size="small">
                    <RemoveCircleOutlineIcon />
                  </IconButton>
                </Grid>
              </React.Fragment>
            ))}
          </Grid>

          <Divider sx={{ my: 2, bgcolor: "#e2e8f0" }} />

          {/* Totals */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
            <Typography variant="body1">Subtotal: ₹{subTotal.toFixed(2)}</Typography>
            <TextField
              label="Discount"
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              size="medium"
              sx={{ ...inputSx, width: { xs: "100%", sm: 180 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PercentIcon color="action" />
                  </InputAdornment>
                ),
                inputProps: { min: 0, step: 0.01 },
              }}
            />
            <Typography variant="h6" sx={{ ml: { sm: "auto" } }}>
              Total: ₹{total.toFixed(2)}
            </Typography>
          </Stack>

          {/* Actions */}
          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2, pt: 2, borderTop: "1px solid #e2e8f0" }}>
            <Button
              type="button"
              variant="outlined"
              color="inherit"
              onClick={() => window.history.back()}
              disabled={submitting}
              sx={{ borderRadius: 2, px: 3, textTransform: "none", fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ borderRadius: 2, px: 3, textTransform: "none", fontWeight: 600, boxShadow: "0 4px 12px rgba(25,118,210,0.3)" }}
            >
              {submitting ? (isEditing ? "Updating..." : "Saving...") : (isEditing ? "Update Sale" : "Save Sale")}
            </Button>
          </Box>
        </Box>

        {/* Add Customer Dialog */}
        <Dialog
          open={customerModalOpen}
          onClose={() => setCustomerModalOpen(false)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>Add Customer</DialogTitle>
          <DialogContent dividers>
            <CustomerForm
              onSaved={(c) => handleCustomerSaved(c)}
              onCancel={() => setCustomerModalOpen(false)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCustomerModalOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Fade>
  );
}
