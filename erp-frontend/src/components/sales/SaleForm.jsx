import React, { useState, useEffect } from "react";
import { useApi } from "../../api";
import ProductSelect from "../common/ProductSelect";
import CustomerSelect from "../crm/CustomerSelect";

function SaleForm({ onSaleAdded, initial = null }) {
  const api = useApi();

  const [customerId, setCustomerId] = useState("");
  const [customer, setCustomer] = useState("");
  const [items, setItems] = useState([
    { product: null, productId: "", quantity: 1, price: 0 }
  ]);

  // new: discount + totals
  const [subTotal, setSubTotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [total, setTotal] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Prefill when editing
  useEffect(() => {
    if (!initial) {
      // reset for create
      setCustomerId("");
      setCustomer("");
      setItems([{ product: null, productId: "", quantity: 1, price: 0 }]);
      setDiscount(0);
      return;
    }

    // customerId can be string or populated object
    setCustomerId(
      typeof initial.customerId === "object" ? initial.customerId._id : (initial.customerId || "")
    );
    setCustomer(initial.customer || "");

    const mapped = (initial.items || []).map((it) => {
      const productObj =
        (typeof it.productId === "object" && it.productId) ||
        it.product ||
        null;
      const pid =
        (typeof it.productId === "string" && it.productId) ||
        (typeof it.productId === "object" && it.productId?._id) ||
        productObj?._id ||
        "";

      return {
        product: productObj,
        productId: pid,
        quantity: Number(it.quantity || 0),
        price: Number(it.price || 0)
      };
    });
    setItems(mapped.length ? mapped : [{ product: null, productId: "", quantity: 1, price: 0 }]);

    setDiscount(Number(initial.discount || 0));
  }, [initial]);

  // Recalculate subTotal and total
  useEffect(() => {
    const st = items.reduce(
      (acc, item) =>
        acc + (Number(item.price) || 0) * (Number(item.quantity) || 0),
      0
    );
    setSubTotal(st);
    const d = Number(discount) || 0;
    setTotal(Math.max(0, st - d));
  }, [items, discount]);

  // Generic item update helper
  const updateItem = (index, patch) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  // Handle change in item fields
  const handleItemChange = (index, field, value) => {
    if (field === "quantity" || field === "price") {
      value = Number(value);
      if (Number.isNaN(value) || value < 0) value = 0;
    }
    updateItem(index, { [field]: value });
  };

  // When a product is selected, auto-set productId and price
  const handleProductChange = (index, selectedProduct) => {
    if (!selectedProduct) {
      updateItem(index, { product: null, productId: "", price: 0 });
      return;
    }
    updateItem(index, {
      product: selectedProduct,
      productId: selectedProduct._id,
      price: Number(selectedProduct.price) || 0
    });
  };

  // Add/Remove item rows
  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { product: null, productId: "", quantity: 1, price: 0 }
    ]);

  const removeItem = (index) => {
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length
        ? next
        : [{ product: null, productId: "", quantity: 1, price: 0 }];
    });
  };

  // Validation
  const validate = () => {
    if (!customerId) return "Please select a customer.";
    if (!items.length) return "Add at least one item.";
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.productId) return `Row ${i + 1}: Select a product.`;
      if (!it.quantity || it.quantity <= 0)
        return `Row ${i + 1}: Quantity must be > 0.`;
      if (it.price == null || it.price < 0)
        return `Row ${i + 1}: Price must be >= 0.`;
    }
    if (total < 0) return "Total cannot be negative.";
    return "";
  };

  // Submit (create or update)
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
          price: it.price
        })),
        subTotal,
        discount,
        total
      };

      let res;
      if (initial?._id) {
        res = await api.put(`/sales/${initial._id}`, payload);
      } else {
        res = await api.post("/sales", payload);
      }

      onSaleAdded?.(res.data);

      // Reset only if creating; let parent close on edit
      if (!initial?._id) {
        setCustomerId("");
        setCustomer("");
        setItems([{ product: null, productId: "", quantity: 1, price: 0 }]);
        setDiscount(0);
      }
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          (initial?._id ? "Failed to update sale" : "Failed to save sale")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isEditing = Boolean(initial?._id);

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ color: "red", marginBottom: 8 }}>{error}</div>
      )}

      <div style={{ marginBottom: 8 }}>
        <label style={{ display: "block", marginBottom: 4 }}>Customer:</label>
        <CustomerSelect value={customerId} onChange={setCustomerId} />
      </div>

      <hr />

      <div>
        <h4>{isEditing ? "Edit Items" : "Items"}</h4>
        {items.map((item, index) => (
          <div
            key={index}
            style={{
              marginBottom: 10,
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap"
            }}
          >
            <ProductSelect
              value={item.product} // pass the whole product for controlled display
              onChange={(prod) => handleProductChange(index, prod)}
            />
            <input
              type="number"
              placeholder="Quantity"
              value={item.quantity}
              min="1"
              onChange={(e) =>
                handleItemChange(index, "quantity", e.target.value)
              }
              style={{ width: 100 }}
            />
            <input
              type="number"
              placeholder="Price"
              value={item.price}
              min="0"
              step="0.01"
              onChange={(e) =>
                handleItemChange(index, "price", e.target.value)
              }
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

      {/* Totals */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div>Subtotal: ₹{subTotal.toFixed(2)}</div>
        <div>
          Discount:{" "}
          <input
            type="number"
            min="0"
            step="0.01"
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value) || 0)}
            style={{ width: 120 }}
          />
        </div>
        <strong>Total: ₹{total.toFixed(2)}</strong>
      </div>

      <button type="submit" style={{ marginTop: 15 }} disabled={submitting}>
        {submitting ? (isEditing ? "Updating..." : "Saving...") : (isEditing ? "Update Sale" : "Save Sale")}
      </button>
    </form>
  );
}

export default SaleForm;
