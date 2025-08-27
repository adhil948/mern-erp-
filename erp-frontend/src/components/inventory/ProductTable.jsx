// src/components/inventory/ProductTable.jsx
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
} from "@mui/material";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const StyledTable = styled(Table)(() => ({
  whiteSpace: "pre",
  "& thead": {
    "& tr": { "& th": { paddingLeft: 8, paddingRight: 8 } },
  },
  "& tbody": {
    "& tr": { "& td": { paddingLeft: 8, textTransform: "capitalize" } },
  },
}));

function currencyINR(n) {
  const x = Number(n || 0);
  return `₹${x.toFixed(2)}`;
}

function statusColor(isActive) {
  return isActive ? "success" : "default";
}

export default function ProductTable({
  products = [],
  loading = false,
  onEdit,
  onDelete,
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [anchorEl, setAnchorEl] = useState(null);
  const [selected, setSelected] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event, product) => {
    setAnchorEl(event.currentTarget);
    setSelected(product);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelected(null);
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
            <TableCell>Name</TableCell>
            <TableCell>SKU</TableCell>
            <TableCell>Category</TableCell>
            <TableCell align="right">Price</TableCell>
            <TableCell align="right">Stock</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {products.length > 0 ? (
            products
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((p) => (
                <TableRow key={p._id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.sku || "-"}</TableCell>
                  <TableCell>{p.category || "-"}</TableCell>
                  <TableCell align="right">{currencyINR(p.price)}</TableCell>
                  <TableCell align="right">{p.stock ?? 0}</TableCell>
                  <TableCell>
                    <Chip
                      label={p.isActive ? "ACTIVE" : "INACTIVE"}
                      color={statusColor(p.isActive)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton onClick={(e) => handleMenuOpen(e, p)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} align="center">
                No products found
              </TableCell>
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
        <MenuItem
          onClick={() => {
            onEdit?.(selected);
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
              selected?._id &&
              window.confirm(`Delete "${selected.name}"?`)
            ) {
              onDelete?.(selected._id);
            }
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <DeleteIcon color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      <TablePagination
        sx={{ px: 2 }}
        page={page}
        component="div"
        rowsPerPage={rowsPerPage}
        count={products.length}
        onPageChange={handleChangePage}
        rowsPerPageOptions={[5, 10, 25]}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
}
