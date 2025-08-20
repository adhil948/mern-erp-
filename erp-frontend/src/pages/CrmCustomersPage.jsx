import React, { useEffect, useMemo, useState } from "react";
import { useApi } from "../api";
import CustomerForm from "../components/crm/CustomerForm";
import ContactForm from "../components/crm/ContactForm";
import LeadForm from "../components/crm/LeadForm";

// MUI UI for consistent theme with Sales/Inventory
import {
  Box,
  Stack,
  TextField,
  MenuItem,
  Button,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

export default function CrmCustomersPage() {
  const api = useApi();

  // Data
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [contacts, setContacts] = useState([]);

  // Filters
  const [search, setSearch] = useState("");
  const [custStatus, setCustStatus] = useState("");
  const [leadStage, setLeadStage] = useState("");
  const [showContacts, setShowContacts] = useState(false);

  // Loading + error
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Forms
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingContact, setEditingContact] = useState(null);
  const [editingLead, setEditingLead] = useState(null);

  // Pagination (per section)
  const [custPage, setCustPage] = useState(0);
  const [custRpp, setCustRpp] = useState(5);

  const [leadPage, setLeadPage] = useState(0);
  const [leadRpp, setLeadRpp] = useState(5);

  const [ctPage, setCtPage] = useState(0);
  const [ctRpp, setCtRpp] = useState(5);

  // Loaders
  const loadCustomers = async () => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (custStatus) params.set("status", custStatus);
    const res = await api.get(`/crm/customers?${params.toString()}`);
    setCustomers(res.data || []);
  };

  const loadLeads = async () => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (leadStage) params.set("stage", leadStage);
    const res = await api.get(`/crm/leads?${params.toString()}`);
    setLeads(res.data || []);
  };

  const loadContacts = async () => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    const res = await api.get(`/crm/contacts?${params.toString()}`);
    setContacts(res.data || []);
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      setErr("");
      await Promise.all([
        loadCustomers(),
        loadLeads(),
        showContacts ? loadContacts() : Promise.resolve(),
      ]);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load CRM data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll(); // initial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Client-side filtering for instant UI response
  const customersFiltered = useMemo(() => {
    const s = (search || "").trim().toLowerCase();
    return (customers || []).filter((c) => {
      if (custStatus && (c.status || "").toLowerCase() !== custStatus) return false;
      if (!s) return true;
      const hay = [
        c.name,
        c.email,
        c.phone,
        c.company,
        c.status,
      ]
        .map((x) => (x || "").toString().toLowerCase())
        .join(" ");
      return hay.includes(s);
    });
  }, [customers, search, custStatus]);

  const leadsFiltered = useMemo(() => {
    const s = (search || "").trim().toLowerCase();
    return (leads || []).filter((l) => {
      if (leadStage && (l.stage || "").toLowerCase() !== leadStage) return false;
      if (!s) return true;
      const hay = [
        l.name,
        l.email,
        l.phone,
        l.company,
        l.source,
        l.stage,
      ]
        .map((x) => (x || "").toString().toLowerCase())
        .join(" ");
      return hay.includes(s);
    });
  }, [leads, search, leadStage]);

  const contactsFiltered = useMemo(() => {
    const s = (search || "").trim().toLowerCase();
    return (contacts || []).filter((ct) => {
      if (!s) return true;
      const hay = [
        ct.firstName,
        ct.lastName,
        ct.email,
        ct.phone,
        ct.company,
        ct.role,
      ]
        .map((x) => (x || "").toString().toLowerCase())
        .join(" ");
      return hay.includes(s);
    });
  }, [contacts, search]);

  // Pagination slices
  const customersPaged = useMemo(() => {
    const start = custPage * custRpp;
    return customersFiltered.slice(start, start + custRpp);
  }, [customersFiltered, custPage, custRpp]);

  const leadsPaged = useMemo(() => {
    const start = leadPage * leadRpp;
    return leadsFiltered.slice(start, start + leadRpp);
  }, [leadsFiltered, leadPage, leadRpp]);

  const contactsPaged = useMemo(() => {
    const start = ctPage * ctRpp;
    return contactsFiltered.slice(start, start + ctRpp);
  }, [contactsFiltered, ctPage, ctRpp]);

  // Reset pagination when filters change
  useEffect(() => {
    setCustPage(0);
    setLeadPage(0);
    setCtPage(0);
  }, [search, custStatus, leadStage, showContacts]);

  // Save/close handlers
  const onSavedAny = () => {
    setShowCustomerForm(false);
    setShowContactForm(false);
    setShowLeadForm(false);
    setEditingCustomer(null);
    setEditingContact(null);
    setEditingLead(null);
    loadAll();
  };

  // Remove handlers
  const removeCustomer = async (id) => {
    if (!window.confirm("Delete this customer?")) return;
    try {
      await api.delete(`/crm/customers/${id}`);
      loadCustomers();
    } catch (e) {
      alert(e?.response?.data?.error || "Failed to delete customer");
    }
  };

  const removeLead = async (id) => {
    if (!window.confirm("Delete this lead?")) return;
    try {
      await api.delete(`/crm/leads/${id}`);
      loadLeads();
    } catch (e) {
      alert(e?.response?.data?.error || "Failed to delete lead");
    }
  };

  const removeContact = async (id) => {
    if (!window.confirm("Delete this contact?")) return;
    try {
      await api.delete(`/crm/contacts/${id}`);
      loadContacts();
    } catch (e) {
      alert(e?.response?.data?.error || "Failed to delete contact");
    }
  };

  // Styles consistent with Sales/Inventory
  const panel = {
    border: "1px solid #ddd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    background: "#fff",
  };
  const th = { textAlign: "left", padding: "8px 6px", borderBottom: "1px solid #eee" };
  const td = { padding: "8px 6px", borderBottom: "1px solid #f4f4f4" };

  const Pagination = ({
    total,
    page,
    rpp,
    setPage,
    setRpp,
    align = "flex-end",
  }) => {
    const from = total === 0 ? 0 : page * rpp + 1;
    const to = Math.min(total, (page + 1) * rpp);
    return (
      <div
        style={{
          display: "flex",
          justifyContent: align,
          alignItems: "center",
          gap: 12,
          paddingTop: 8,
        }}
      >
        <div style={{ color: "#666" }}>
          {total === 0 ? "0–0 of 0" : `${from}–${to} of ${total}`}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>Rows per page:</span>
          <select
            value={rpp}
            onChange={(e) => {
              setRpp(Number(e.target.value));
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
              setPage((p) => ((p + 1) * rpp >= total ? p : p + 1))
            }
            disabled={(page + 1) * rpp >= total}
            sx={{ textTransform: "none" }}
          >
            ›
          </Button>
        </div>
      </div>
    );
  };

  const stageChipStyle = (stage) => ({
    padding: "2px 6px",
    borderRadius: 4,
    color: "#fff",
    background:
      stage === "new"
        ? "#546e7a"
        : stage === "contacted"
        ? "#1976d2"
        : stage === "qualified"
        ? "#2e7d32"
        : stage === "lost"
        ? "#8e24aa"
        : stage === "converted"
        ? "#ef6c00"
        : "#616161",
  });

  return (
    <div style={{ padding: 16 }}>
      <h2>CRM</h2>

      {err && <div style={{ color: "red", marginBottom: 8 }}>{err}</div>}

      {/* Top actions like Sales/Inventory */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setEditingCustomer(null);
            setShowCustomerForm(true);
          }}
          sx={{ textTransform: "none" }}
        >
          ADD CUSTOMER
        </Button>
        <Button
          variant="outlined"
          onClick={loadAll}
          disabled={loading}
          sx={{ textTransform: "none" }}
        >
          {loading ? "Refreshing..." : "REFRESH"}
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            setEditingContact(null);
            setShowContactForm(true);
          }}
          sx={{ textTransform: "none" }}
        >
          ADD CONTACT
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            setEditingLead(null);
            setShowLeadForm(true);
          }}
          sx={{ textTransform: "none" }}
        >
          ADD LEAD
        </Button>
      </div>

      {/* Filters row to match overall theme */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
          <TextField
            label="Search"
            placeholder="Search name, email, phone, company"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 260 }}
          />

          <TextField
            select
            label="Customer status"
            value={custStatus}
            onChange={(e) => setCustStatus(e.target.value)}
            size="small"
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>

          <TextField
            select
            label="Lead stage"
            value={leadStage}
            onChange={(e) => setLeadStage(e.target.value)}
            size="small"
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="new">New</MenuItem>
            <MenuItem value="contacted">Contacted</MenuItem>
            <MenuItem value="qualified">Qualified</MenuItem>
            <MenuItem value="lost">Lost</MenuItem>
            <MenuItem value="converted">Converted</MenuItem>
          </TextField>

          <FormControlLabel
            control={
              <Checkbox
                checked={showContacts}
                onChange={async (e) => {
                  const val = e.target.checked;
                  setShowContacts(val);
                  if (val && contacts.length === 0) {
                    await loadContacts();
                  }
                }}
                size="small"
              />
            }
            label="Show Contacts"
          />

          <Button
            variant="text"
            onClick={() => {
              setSearch("");
              setCustStatus("");
              setLeadStage("");
              setShowContacts(false);
            }}
            sx={{ textTransform: "none" }}
          >
            CLEAR
          </Button>
        </Stack>
      </Box>

      {/* Inline forms in a panel, like Sales */}
      {showCustomerForm && (
        <div style={panel}>
          <CustomerForm
            initial={editingCustomer}
            onSaved={onSavedAny}
            onCancel={() => {
              setShowCustomerForm(false);
              setEditingCustomer(null);
            }}
          />
        </div>
      )}
      {showContactForm && (
        <div style={panel}>
          <ContactForm
            initial={editingContact}
            onSaved={onSavedAny}
            onCancel={() => {
              setShowContactForm(false);
              setEditingContact(null);
            }}
          />
        </div>
      )}
      {showLeadForm && (
        <div style={panel}>
          <LeadForm
            initial={editingLead}
            onSaved={onSavedAny}
            onCancel={() => {
              setShowLeadForm(false);
              setEditingLead(null);
            }}
          />
        </div>
      )}

      {/* Customers table */}
      <h3 style={{ marginTop: 20 }}>Customers</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Name</th>
              <th style={th}>Email</th>
              <th style={th}>Phone</th>
              <th style={th}>Company</th>
              <th style={th}>Status</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customersPaged.map((c) => (
              <tr key={c._id}>
                <td style={td}>{c.name}</td>
                <td style={td}>{c.email || "-"}</td>
                <td style={td}>{c.phone || "-"}</td>
                <td style={td}>{c.company || "-"}</td>
                <td style={td}>{c.status}</td>
                <td style={td}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setEditingCustomer(c);
                      setShowCustomerForm(true);
                    }}
                    sx={{ textTransform: "none", mr: 1 }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => removeCustomer(c._id)}
                    sx={{ textTransform: "none" }}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            {customersFiltered.length === 0 && (
              <tr>
                <td style={td} colSpan={6}>
                  No customers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination
          total={customersFiltered.length}
          page={custPage}
          rpp={custRpp}
          setPage={setCustPage}
          setRpp={setCustRpp}
        />
      </div>

      {/* Leads table */}
      <h3 style={{ marginTop: 24 }}>Leads</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Name</th>
              <th style={th}>Email</th>
              <th style={th}>Phone</th>
              <th style={th}>Company</th>
              <th style={th}>Source</th>
              <th style={th}>Stage</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leadsPaged.map((l) => (
              <tr key={l._id}>
                <td style={td}>{l.name}</td>
                <td style={td}>{l.email || "-"}</td>
                <td style={td}>{l.phone || "-"}</td>
                <td style={td}>{l.company || "-"}</td>
                <td style={td}>{l.source || "-"}</td>
                <td style={td}>
                  <span style={stageChipStyle(l.stage)}>{l.stage}</span>
                </td>
                <td style={td}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setEditingLead(l);
                      setShowLeadForm(true);
                    }}
                    sx={{ textTransform: "none", mr: 1 }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => removeLead(l._id)}
                    sx={{ textTransform: "none" }}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            {leadsFiltered.length === 0 && (
              <tr>
                <td style={td} colSpan={7}>
                  No leads found
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination
          total={leadsFiltered.length}
          page={leadPage}
          rpp={leadRpp}
          setPage={setLeadPage}
          setRpp={setLeadRpp}
        />
      </div>

      {/* Contacts section (optional) */}
      {showContacts && (
        <>
          <h3 style={{ marginTop: 24 }}>Contacts</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>First</th>
                  <th style={th}>Last</th>
                  <th style={th}>Email</th>
                  <th style={th}>Phone</th>
                  <th style={th}>Company</th>
                  <th style={th}>Role</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contactsPaged.map((ct) => (
                  <tr key={ct._id}>
                    <td style={td}>{ct.firstName}</td>
                    <td style={td}>{ct.lastName || "-"}</td>
                    <td style={td}>{ct.email || "-"}</td>
                    <td style={td}>{ct.phone || "-"}</td>
                    <td style={td}>{ct.company || "-"}</td>
                    <td style={td}>{ct.role || "-"}</td>
                    <td style={td}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setEditingContact(ct);
                          setShowContactForm(true);
                        }}
                        sx={{ textTransform: "none", mr: 1 }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => removeContact(ct._id)}
                        sx={{ textTransform: "none" }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
                {contactsFiltered.length === 0 && (
                  <tr>
                    <td style={td} colSpan={7}>
                      No contacts found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <Pagination
              total={contactsFiltered.length}
              page={ctPage}
              rpp={ctRpp}
              setPage={setCtPage}
              setRpp={setCtRpp}
            />
          </div>
        </>
      )}
    </div>
  );
}
