import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Checkbox, FormControlLabel, Typography, Select, MenuItem } from '@mui/material';

const allModules = ['sales', 'purchase', 'inventory','crm'];
const allRoles = ['admin', 'sales_user', 'purchase_user', 'inventory_user'];

export default function ModuleManagement({ orgId, token }) {
  const [orgModules, setOrgModules] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const modRes = await axios.get(`/api/org/${orgId}/modules`, { headers: { Authorization: `Bearer ${token}` } });
      setOrgModules(modRes.data.enabledModules);

      const usersRes = await axios.get(`/api/org/${orgId}/users`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(usersRes.data);

      setLoading(false);
    };
    fetchData();
  }, [orgId, token]);

  const toggleModule = (module) => {
    setOrgModules(prev => prev.includes(module) ? prev.filter(m => m !== module) : [...prev, module]);
  };

  const saveOrgModules = async () => {
    await axios.post(`/api/org/${orgId}/modules`, { enabledModules: orgModules }, { headers: { Authorization: `Bearer ${token}` } });
    alert('Organization modules updated');
  };

  const updateUser = async (userId, newRole, newModules) => {
    await axios.post(`/api/org/${orgId}/users/${userId}`, { role: newRole, enabledModules: newModules }, { headers: { Authorization: `Bearer ${token}` } });
    alert('User updated');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <Typography variant="h6">Organization Modules</Typography>
      {allModules.map(mod => (
        <FormControlLabel
          key={mod}
          control={<Checkbox checked={orgModules.includes(mod)} onChange={() => toggleModule(mod)} />}
          label={mod.charAt(0).toUpperCase() + mod.slice(1)}
        />
      ))}
      <Button variant="contained" onClick={saveOrgModules}>Save Modules</Button>

      <Typography variant="h6" style={{ marginTop: '2rem' }}>Users</Typography>
      {users.map(user => (
        <UserEditor key={user._id} user={user} token={token} orgId={orgId} updateUser={updateUser} />
      ))}
    </div>
  );
}

function UserEditor({ user, token, orgId, updateUser }) {
  const [role, setRole] = React.useState(user.role);
  const [modules, setModules] = React.useState(user.enabledModules || []);

  const toggleUserModule = (mod) => {
    setModules(prev => prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]);
  };

  const handleSave = () => {
    updateUser(user._id, role, modules);
  };

  return (
    <div style={{ marginBottom: '1rem', border: '1px solid #ccc', padding: '1rem' }}>
      <div><strong>{user.name || user.email}</strong></div>
      <div>
        Role:{' '}
        <Select value={role} onChange={(e) => setRole(e.target.value)}>
          {['admin', 'sales_user', 'purchase_user', 'inventory_user'].map(r => (
            <MenuItem key={r} value={r}>{r}</MenuItem>
          ))}
        </Select>
      </div>
      <div>
        Modules:
        {['sales', 'purchase', 'inventory','crm'].map(mod => (
          <FormControlLabel
            key={mod}
            control={<Checkbox checked={modules.includes(mod)} onChange={() => toggleUserModule(mod)} />}
            label={mod}
          />
        ))}
      </div>
      <Button variant="outlined" onClick={handleSave}>Save User Settings</Button>
    </div>
  );
}
