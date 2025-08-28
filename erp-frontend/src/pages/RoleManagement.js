import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  Checkbox,
  Button,
  Paper
} from '@mui/material';
import { useAppState } from '../context/AppContext';

const allRoles = ['admin', 'sales_user', 'purchase_user', 'inventory_user'];
const allModules = ['sales', 'purchase', 'inventory','crm'];

export default function RoleManagement({ orgId }) {
  const { token } = useAppState();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editedUsers, setEditedUsers] = useState({});

  // Fetch users in org
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(
          `http://3.110.253.196:5000/api/orgs/${orgId}/users`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setUsers(res.data);
        console.log('Fetched users:', res.data);

        // Initialize editable state from fetched users
        const initialState = {};
        res.data.forEach(user => {
          initialState[user._id] = {
            role: user.role,
            modules: user.enabledModules || []
          };
        });
        setEditedUsers(initialState);

      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [orgId, token]);

  const handleRoleChange = (userId, newRole) => {
    setEditedUsers(prev => ({
      ...prev,
      [userId]: { ...prev[userId], role: newRole }
    }));
  };

  const toggleModule = (userId, mod) => {
    setEditedUsers(prev => {
      const existing = prev[userId].modules || [];
      const updated = existing.includes(mod)
        ? existing.filter(m => m !== mod)
        : [...existing, mod];
      return {
        ...prev,
        [userId]: { ...prev[userId], modules: updated }
      };
    });
  };

  const updateUser = async (userId) => {
    try {
      const { role, modules } = editedUsers[userId];
      await axios.post(
        `http://3.110.253.196:5000/api/orgs/${orgId}/users/${userId}`,
        { role, enabledModules: modules },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('User updated successfully');
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Role Management
      </Typography>
      <Paper sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Enabled Modules</TableCell>
              <TableCell>Save</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(user => (
              <TableRow key={user._id}>
                <TableCell>{user.name || user.email}</TableCell>
                <TableCell>
                  <Select
                    value={editedUsers[user._id]?.role || ''}
                    onChange={e => handleRoleChange(user._id, e.target.value)}
                  >
                    {allRoles.map(r => (
                      <MenuItem key={r} value={r}>
                        {r}
                      </MenuItem>
                    ))}
                  </Select>
                </TableCell>
                <TableCell>
                  {allModules.map(mod => (
                    <label key={mod} style={{ marginRight: '8px' }}>
                      <Checkbox
                        checked={editedUsers[user._id]?.modules?.includes(mod) || false}
                        onChange={() => toggleModule(user._id, mod)}
                      />
                      {mod}
                    </label>
                  ))}
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => updateUser(user._id)}
                  >
                    Save
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
