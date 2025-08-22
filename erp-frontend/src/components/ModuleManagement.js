import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Checkbox, FormControlLabel, Typography, Select, MenuItem, Paper, Stack, Divider } from '@mui/material';

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
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Organization Modules</Typography>
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
          {allModules.map(mod => (
            <FormControlLabel
              key={mod}
              control={<Checkbox checked={orgModules.includes(mod)} onChange={() => toggleModule(mod)} />}
              label={mod.charAt(0).toUpperCase() + mod.slice(1)}
            />
          ))}
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Button variant="contained" onClick={saveOrgModules}>Save Modules</Button>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Users</Typography>
        <Stack spacing={2}>
          {users.map(user => (
            <UserEditor key={user._id} user={user} token={token} orgId={orgId} updateUser={updateUser} />
          ))}
        </Stack>
      </Paper>
    </Stack>
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
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>{user.name || user.email}</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2">Role:</Typography>
          <Select size="small" value={role} onChange={(e) => setRole(e.target.value)}>
            {['admin', 'sales_user', 'purchase_user', 'inventory_user'].map(r => (
              <MenuItem key={r} value={r}>{r}</MenuItem>
            ))}
          </Select>
        </Stack>
        <Divider flexItem orientation="vertical" sx={{ display: { xs: 'none', sm: 'block' } }} />
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          {['sales', 'purchase', 'inventory','crm'].map(mod => (
            <FormControlLabel
              key={mod}
              control={<Checkbox checked={modules.includes(mod)} onChange={() => toggleUserModule(mod)} />}
              label={mod}
            />
          ))}
        </Stack>
        <Button variant="outlined" onClick={handleSave} sx={{ ml: 'auto' }}>Save</Button>
      </Stack>
    </Paper>
  );
}
