import React, { useEffect, useState } from 'react';
import { useApi } from '../../api';

export default function SupplierSelect({ value, onChange, placeholder = 'Select supplier', disabled }) {
  const api = useApi();
  const [options, setOptions] = useState([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    let active = true;
    const params = q ? `?q=${encodeURIComponent(q)}` : '';
    api.get(`/suppliers${params}`)
      .then(res => { if (active) setOptions(res.data); })
      .catch(() => setOptions([]));
    return () => { active = false; };
  }, [api, q]);

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        placeholder="Search suppliers..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ minWidth: 160 }}
      />
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={{ minWidth: 240 }}>
        <option value="">{placeholder}</option>
        {options.map(s => (
          <option key={s._id} value={s._id}>
            {s.name} {s.company ? `— ${s.company}` : ''} {s.phone ? `(${s.phone})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
