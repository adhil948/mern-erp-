import React, { useEffect, useState } from 'react';
import { useApi } from '../../api';

export default function CustomerSelect({ value, onChange, placeholder = 'Select customer', disabled }) {
  const api = useApi();
  const [options, setOptions] = useState([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    let active = true;
    const params = q ? `?q=${encodeURIComponent(q)}` : '';
    api.get(`/crm/customers${params}`)
      .then(res => { if (active) setOptions(res.data); })
      .catch(() => setOptions([]));
    return () => { active = false; };
  }, [api, q]);

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        placeholder="Search customers..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ minWidth: 160 }}
      />
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={{ minWidth: 240 }}>
        <option value="">{placeholder}</option>
        {options.map(c => (
          <option key={c._id} value={c._id}>
            {c.name} {c.company ? `— ${c.company}` : ''} {c.phone ? `(${c.phone})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
