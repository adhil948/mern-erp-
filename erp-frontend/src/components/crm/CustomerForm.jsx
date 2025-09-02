import React, { useState } from "react";
import { useApi } from "../../api";
import {
  Box,
  Paper,
  Grid,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  InputAdornment,
  Typography,
  Button,
  Divider,
  CircularProgress,
  Fade
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BusinessIcon from "@mui/icons-material/Business";
import HomeIcon from "@mui/icons-material/Home";
import NotesIcon from "@mui/icons-material/Notes";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";

export default function CustomerForm({ initial, onSaved, onCancel }) {
  const api = useApi();
  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [company, setCompany] = useState(initial?.company || "");
  const [address, setAddress] = useState(initial?.address || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [status, setStatus] = useState(initial?.status || "active");
  const [loading, setLoading] = useState(false);

  const isEdit = Boolean(initial?._id);

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = { name, email, phone, company, address, notes, status };
    try {
      const res = isEdit
        ? await api.put(`/crm/customers/${initial._id}`, payload)
        : await api.post("/crm/customers", payload);
      onSaved?.(res.data);
    } catch (e) {
      alert(e?.response?.data?.error || "Failed to save customer");
    } finally {
      setLoading(false);
    }
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      backgroundColor: "#fff",
    },
  };

  return (
    <Fade in timeout={400}>
      <Paper
        elevation={8}
        sx={{
          p: 3,
          borderRadius: 3,
          maxWidth: 900,
          mx: "auto",
          background: "linear-gradient(to bottom, #ffffff, #f8f9fa)",
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          border: "1px solid #e0e0e0",
          mt: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2.5 }}>
          <BusinessIcon color="primary" sx={{ mr: 1.5, fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#2d3748" }}>
            {isEdit ? "Edit Customer" : "Add New Customer"}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3, bgcolor: "#e2e8f0" }} />

        <Box component="form" onSubmit={save}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                size="medium"
                variant="outlined"
                sx={inputSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                fullWidth
                size="medium"
                variant="outlined"
                sx={inputSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                fullWidth
                size="medium"
                variant="outlined"
                sx={inputSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                fullWidth
                size="medium"
                variant="outlined"
                sx={inputSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={8}>
              <TextField
                label="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                fullWidth
                size="medium"
                variant="outlined"
                sx={inputSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <HomeIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>


            <Grid item xs={12}>
              <TextField
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
                multiline
                minRows={3}
                size="medium"
                variant="outlined"
                sx={inputSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignItems: "flex-start", mt: 1 }}>
                      <NotesIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box
                display="flex"
                justifyContent="flex-end"
                gap={2}
                mt={2}
                sx={{ pt: 2, borderTop: "1px solid #e2e8f0" }}
              >
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={onCancel}
                  disabled={loading}
                  startIcon={<CancelIcon />}
                  sx={{ borderRadius: 2, px: 3, py: 1, textTransform: "none", fontWeight: 600 }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={
                    loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />
                  }
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    textTransform: "none",
                    fontWeight: 600,
                    boxShadow: "0 4px 12px rgba(25,118,210,0.3)",
                  }}
                >
                  {loading ? "Saving..." : "Save Customer"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Fade>
  );
}
