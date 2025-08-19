// SaleForm.jsx

import React, { useState, useEffect } from "react";
import { useApi } from "../../api";
import ProductSelect from "../common/ProductSelect";
import CustomerSelect from "../crm/CustomerSelect";

function SaleForm({ onSaleAdded }) {
  const api = useApi(); // use shared API (adds Authorization + X-Org-Id)

  const [customerId, setCustomerId] = useState("");
  const [customer, setCustomer] = useState(""); // optional free-text if you still want it
  const [items, setItems] = useState([{ productId: "", quantity: 1, price: 0 }]);
  const [total, setTotal] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Recalculate total
  useEffect(() => {
    const newTotal = items.reduce((acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
    setTotal(newTotal);
  }, [items]);

  // Handle change in item fields
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    if (field === "quantity" || field === "price") {
      value = Number(value);
      if (Number.isNaN(value) || value < 0) value = 0;
    }
    newItems[index][field] = value;
    setItems(newItems);
  };

  // Add/Remove item rows
  const addItem = () => setItems([...items, { productId: "", quantity: 1, price: 0 }]);
  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems.length ? newItems : [{ productId: "", quantity: 1, price: 0 }]);
  };

  // Simple client-side validation
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
      // If your backend Sale model supports customerId, send it.
      // Keep customer (text) optional for display if you want.
      const payload = { customerId, customer: customer || undefined, items, total };

      const res = await api.post("/sales", payload);
      onSaleAdded?.(res.data);

      // Reset form
      setCustomerId("");
      setCustomer("");
      setItems([{ productId: "", quantity: 1, price: 0 }]);
      setTotal(0);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to save sale");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ color: "red", marginBottom: 8 }}>{error}</div>
      )}

      <div style={{ marginBottom: 8 }}>
        <label style={{ display: "block", marginBottom: 4 }}>Customer:</label>
        <CustomerSelect value={customerId} onChange={setCustomerId} />
      </div>

      {/* Optional free-text customer display/name if needed */}
      {/* <div style={{ marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Customer name (optional)"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
        />
      </div> */}

      <hr />

      <div>
        <h4>Items</h4>
        {items.map((item, index) => (
          <div key={index} style={{ marginBottom: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <ProductSelect
              value={item.productId}
              onChange={(val) => handleItemChange(index, "productId", val)}
            />
            <input
              type="number"
              placeholder="Quantity"
              value={item.quantity}
              min="1"
              onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
              style={{ width: 100 }}
            />
            <input
              type="number"
              placeholder="Price"
              value={item.price}
              min="0"
              step="0.01"
              onChange={(e) => handleItemChange(index, "price", e.target.value)}
              style={{ width: 120 }}
            />
            <button type="button" onClick={() => removeItem(index)}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={addItem}>
          + Add Item
        </button>
      </div>

      <hr />

      <div>
        <strong>Total: </strong> ₹{total.toFixed(2)}
      </div>

      <button type="submit" style={{ marginTop: 15 }} disabled={submitting}>
        {submitting ? "Saving..." : "Save Sale"}
      </button>
    </form>
  );
}

export default SaleForm;
