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
  ListItemText,
  Tooltip
} from "@mui/material";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PrintIcon from "@mui/icons-material/Print";

const StyledTable = styled(Table)(() => ({
  whiteSpace: "pre",
  "& thead": { "& tr": { "& th": { paddingLeft: 8, paddingRight: 8 } } },
  "& tbody": { "& tr": { "& td": { paddingLeft: 8, textTransform: "capitalize" } } }
}));

function currencyINR(n) {
  const x = Number(n || 0);
  return `₹${x.toFixed(2)}`;
}

function getSupplierDisplay(purchase) {
  const sid = purchase?.supplierId;
  if (sid && typeof sid === "object") {
    return sid.name || sid.email || "(supplier)";
  }
  if (typeof sid === "string" && sid.length) return "(supplier)";
  return purchase?.supplier || "(supplier)";
}

function getItemsPreview(purchase) {
  const items = Array.isArray(purchase?.items) ? purchase.items : [];
  if (!items.length) return "-";
  const parts = items.map((it) => {
    const qty = Number(it?.quantity || 0);
    const name =
      it?.name ||
      (typeof it?.product === "object" && it?.product?.name) ||
      (typeof it?.productId === "object" && it?.productId?.name) ||
      it?.productName ||
      "Item";
    return `${name} x${qty}`;
  });
  return parts.join(", ");
}

function statusColor(status) {
  switch ((status || "").toLowerCase()) {
    case "received":
    case "completed":
      return "success";
    case "partial":
    case "in-transit":
      return "warning";
    case "cancelled":
    case "void":
      return "error";
    default:
      return "default";
  }
}

export default function PurchaseTable({
  purchases = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
  onPrintBill,
  pageSizeOptions = [5, 10, 25],
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event, purchase) => {
    setAnchorEl(event.currentTarget);
    setSelectedPurchase(purchase);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPurchase(null);
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
            <TableCell>Bill #</TableCell>
            <TableCell>Supplier</TableCell>
            <TableCell>Items</TableCell>
            <TableCell align="right">Total</TableCell>
            {Boolean(purchases?.some(p => p.status)) && <TableCell>Status</TableCell>}
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {purchases.length > 0 ? (
            purchases
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((p) => {
                const dateStr = p?.createdAt ? new Date(p.createdAt).toLocaleDateString() : "-";
                const billNo = p?.billNumber || "-";
                const supplier = getSupplierDisplay(p);
                const total = currencyINR(p?.total);
                const itemsPreview = getItemsPreview(p);
                const status = (p?.status || "").toLowerCase();

                return (
                  <TableRow key={p?._id}>
                    <TableCell>{dateStr}</TableCell>
                    <TableCell>{billNo}</TableCell>
                    <TableCell>{supplier}</TableCell>
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Tooltip title={itemsPreview}>
                        <span style={{ whiteSpace: "normal", textTransform: "none" }}>
                          {itemsPreview}
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">{total}</TableCell>
                    {Boolean(purchases?.some(px => px.status)) && (
                      <TableCell>
                        <Chip label={(status || "—").toUpperCase()} color={statusColor(status)} size="small" />
                      </TableCell>
                    )}
                    <TableCell align="center">
                      <IconButton onClick={(e) => handleMenuOpen(e, p)}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
          ) : (
            <TableRow>
              <TableCell colSpan={7} align="center">No purchases found</TableCell>
            </TableRow>
          )}
        </TableBody>
      </StyledTable>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {onView && (
          <MenuItem onClick={() => { onView?.(selectedPurchase); handleMenuClose(); }}>
            <ListItemIcon><VisibilityIcon color="primary" /></ListItemIcon>
            <ListItemText>View</ListItemText>
          </MenuItem>
        )}

        <MenuItem onClick={() => { onEdit?.(selectedPurchase); handleMenuClose(); }}>
          <ListItemIcon><EditIcon color="info" /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (selectedPurchase?._id && window.confirm("Delete this purchase? This will revert stock changes.")) {
              onDelete?.(selectedPurchase._id);
            }
            handleMenuClose();
          }}
        >
          <ListItemIcon><DeleteIcon color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>

        {onPrintBill && (
          <MenuItem onClick={() => { onPrintBill?.(selectedPurchase); handleMenuClose(); }}>
            <ListItemIcon><PrintIcon /></ListItemIcon>
            <ListItemText>Print Bill</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <TablePagination
        sx={{ px: 2 }}
        page={page}
        component="div"
        rowsPerPage={rowsPerPage}
        count={purchases.length}
        onPageChange={handleChangePage}
        rowsPerPageOptions={[5, 10, 25]}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
}
