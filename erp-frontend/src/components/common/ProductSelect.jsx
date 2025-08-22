import React, { useEffect, useState } from 'react';
import { useApi } from '../../api';

function ProductSelect({ value, onChange, placeholder = 'Select product', disabled }) {
  const [options, setOptions] = useState([]);
  const api = useApi();

  useEffect(() => {
    let active = true;
    api.get('/products?active=true')
      .then(res => { if (active) setOptions(res.data); })
      .catch(err => {
        console.error('Load products failed', err?.response?.status, err?.response?.data);
        setOptions([]);
      });
    return () => { active = false; };
  }, [api]);

  return (
<select
  value={value?._id || ""}
  onChange={(e) => {
    const selected = options.find((p) => p._id === e.target.value);
    onChange(selected || null);
  }}
  disabled={disabled}
>
  <option value="">{placeholder}</option>
  {options.map((p) => (
    <option key={p._id} value={p._id}>
      {p.name} — ₹{p.price}
    </option>
  ))}
</select>

  );
}

export default ProductSelect;
