// SaleTable.jsx

import React from "react";

function SaleTable({ sales }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Customer</th>
          <th>Total</th>
          {/* Add more columns as needed */}
        </tr>
      </thead>
      <tbody>
        {sales.map(sale => (
          <tr key={sale._id}>
            <td>{new Date(sale.date).toLocaleDateString()}</td>
            <td>{sale.customerId.name}</td>
            <td>{sale.total}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default SaleTable;
