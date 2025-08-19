// SalesPage.jsx

import React, { useEffect, useState } from "react";
import SaleTable from "../components/sales/SaleTable";
import SaleForm from "../components/sales/SaleForm";
import axios from "axios";
import { useApi } from "../api";
import { useAppState } from "../context/AppContext";

function SalesPage() {
  const [sales, setSales] = useState([]);
  // const { token } = useAppState();
  const [showForm, setShowForm] = useState(false);
    const api = useApi();


  

  useEffect(() => {
    api.get("/sales")
      .then((res) => setSales(res.data))
      .catch((err) => {
        console.error("Load sales failed", err?.response?.status, err?.response?.data);
      });
  }, [api]);


  const handleSaleAdded = sale => setSales([...sales, sale]);

  return (
    <div>
      <h2>Sales</h2>
      <button onClick={() => setShowForm(true)}>Add Sale</button>
      {showForm && <SaleForm onSaleAdded={handleSaleAdded} />}
      <SaleTable sales={sales} />
    </div>
  );
}

export default SalesPage;
