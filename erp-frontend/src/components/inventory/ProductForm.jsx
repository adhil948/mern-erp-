import React, { useState } from "react";
import { useApi } from "../../api";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Paper,
  Grid,
  InputAdornment,
  Fade,
  Divider
} from "@mui/material";
import {
  
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
  TrendingUp as StockIcon,
  ToggleOn as ActiveIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from "@mui/icons-material";
import TagIcon from '@mui/icons-material/Tag';

export default function ProductForm({ initial, onCancel, onSaved }) {
  const [name, setName] = useState(initial?.name || "");
  const [sku, setSku] = useState(initial?.sku || "");
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [category, setCategory] = useState(initial?.category || "");
  const [stock, setStock] = useState(initial?.stock ?? 0);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(initial?._id);
  const api = useApi();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { name, sku, price: Number(price), category, isActive };
      if (!isEdit) payload.stock = Number(stock);
      const res = isEdit
        ? await api.put(`/products/${initial._id}`, payload)
        : await api.post("/products", payload);
      onSaved(res.data);
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Fade in={true} timeout={500}>
      <Paper
        elevation={8}
        sx={{
          p: 3,
          borderRadius: 3,
          maxWidth: 900,
          mx: "auto",
          background: "linear-gradient(to bottom, #ffffff, #f8f9fa)",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
          border: "1px solid #e0e0e0",
          mt: 2
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2.5 }}>
          <InventoryIcon color="primary" sx={{ mr: 1.5, fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#2d3748" }}>
            {isEdit ? "Edit Product" : "Add New Product"}
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3, bgcolor: "#e2e8f0" }} />
        
        <Box component="form" onSubmit={onSubmit}>
          <Grid container spacing={3}>
            {/* Row 1: Name and SKU */}
            <Grid item xs={12} md={8}>
              <TextField
                size="medium"
                label="Product Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#fff'
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <InventoryIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                size="medium"
                label="SKU (Optional)"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                fullWidth
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#fff'
                  }
                }}
                                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TagIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Row 2: Price, Category, and Stock (if new) */}
            <Grid item xs={12} md={4}>
              <TextField
                size="medium"
                type="number"
                label="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                fullWidth
                variant="outlined"
                inputProps={{ step: "0.01", min: 0 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#fff'
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MoneyIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                size="medium"
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                fullWidth
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#fff'
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CategoryIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {!isEdit && (
              <Grid item xs={12} md={4}>
                <TextField
                  size="medium"
                  type="number"
                  label="Opening Stock"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  fullWidth
                  variant="outlined"
                  inputProps={{ min: 0 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: '#fff'
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <StockIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            )}

            {/* Status field */}
            <Grid item xs={12} md={isEdit ? 12 : 4}>
              <FormControl 
                size="medium" 
                fullWidth
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#fff'
                  }
                }}
              >
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={isActive ? "1" : "0"}
                  onChange={(e) => setIsActive(e.target.value === "1")}
                  startAdornment={
                    <InputAdornment position="start" sx={{ mr: 1, ml: 0.5 }}>
                      <ActiveIcon color="action" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="1">Active</MenuItem>
                  <MenuItem value="0">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Footer buttons */}
            <Grid item xs={12}>
              <Box 
                display="flex" 
                justifyContent="flex-end" 
                gap={2} 
                mt={2}
                sx={{
                  pt: 2,
                  borderTop: "1px solid #e2e8f0"
                }}
              >
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={onCancel}
                  disabled={loading}
                  startIcon={<CancelIcon />}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    textTransform: 'none',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
                  }}
                >
                  {loading ? "Saving..." : "Save Product"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Fade>
  );
}