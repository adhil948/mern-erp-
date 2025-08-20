import { useState } from "react";
import {
  Box,
  Table,
  styled,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  IconButton,
  TablePagination,
  Chip,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from "@mui/material";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PrintIcon from "@mui/icons-material/Print";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import PaymentsIcon from "@mui/icons-material/Payments";

// STYLED COMPONENT
const StyledTable = styled(Table)(() => ({
  whiteSpace: "pre",
  "& thead": {
    "& tr": { "& th": { paddingLeft: 8, paddingRight: 8 } }
  },
  "& tbody": {
    "& tr": { "& td": { paddingLeft: 8, textTransform: "capitalize" } }
  }
}));

function currencyINR(n) {
  const x = Number(n || 0);
  return `₹${x.toFixed(2)}`;
}

function getCustomerDisplay(sale) {
  const cid = sale?.customerId;
  if (cid && typeof cid === "object") {
    return cid.name || cid.email || "(customer)";
  }
  if (typeof cid === "string" && cid.length) return "(customer)";
  return sale?.customer || "(customer)";
}

function statusColor(status) {
  switch (status) {
    case "paid":
      return "success";
    case "partial":
      return "warning";
    case "unpaid":
    default:
      return "default";
  }
}

export default function SaleTable({
  sales = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
  onPrintInvoice,
  onAddPayment,
  onViewPayments
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event, sale) => {
    setAnchorEl(event.currentTarget);
    setSelectedSale(sale);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSale(null);
  };

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(+e.target.value);
    setPage(0);
  };

  return (
    <Box width="100%" overflow="auto">
      {loading && (
        <Box display="flex" justifyContent="center" p={2}>
          <CircularProgress size={28} />
        </Box>
      )}

      <StyledTable>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Invoice #</TableCell>
            <TableCell>Customer</TableCell>
            <TableCell align="right">Total</TableCell>
            <TableCell align="right">Paid</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {sales.length > 0 ? (
            sales
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((sale) => {
                const dateStr = sale?.date
                  ? new Date(sale.date).toLocaleDateString()
                  : "-";
                const invoiceNo = sale?.invoiceNo || "(pending)";
                const customer = getCustomerDisplay(sale);
                const total = currencyINR(sale?.total);
                const paid = currencyINR(sale?.paymentsTotal || 0);
                const status = (sale?.paymentStatus || "unpaid").toLowerCase();

                return (
                  <TableRow key={sale?._id}>
                    <TableCell>{dateStr}</TableCell>
                    <TableCell>{invoiceNo}</TableCell>
                    <TableCell>{customer}</TableCell>
                    <TableCell align="right">{total}</TableCell>
                    <TableCell align="right">{paid}</TableCell>
                    <TableCell>
                      <Chip
                        label={status.toUpperCase()}
                        color={statusColor(status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton onClick={(e) => handleMenuOpen(e, sale)}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
          ) : (
            <TableRow>
              <TableCell colSpan={7} align="center">
                No sales found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </StyledTable>

      {/* Dropdown menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => {
            onView?.(selectedSale);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <VisibilityIcon color="primary" />
          </ListItemIcon>
          <ListItemText>View</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            onEdit?.(selectedSale);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <EditIcon color="info" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (
              selectedSale?._id &&
              window.confirm("Delete this sale? This will restore stock.")
            ) {
              onDelete?.(selectedSale._id);
            }
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <DeleteIcon color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            onPrintInvoice?.(selectedSale);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <PrintIcon />
          </ListItemIcon>
          <ListItemText>Print Invoice</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            onAddPayment?.(selectedSale);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <AddCircleIcon />
          </ListItemIcon>
          <ListItemText>Add Payment</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            onViewPayments?.(selectedSale);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <PaymentsIcon />
          </ListItemIcon>
          <ListItemText>View Payments</ListItemText>
        </MenuItem>
      </Menu>

      <TablePagination
        sx={{ px: 2 }}
        page={page}
        component="div"
        rowsPerPage={rowsPerPage}
        count={sales.length}
        onPageChange={handleChangePage}
        rowsPerPageOptions={[5, 10, 25]}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
}
