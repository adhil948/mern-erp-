import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, enabledModules, role } = useAppState(); // now also pulling role
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    dispatch({ type: 'LOGOUT' });
    navigate('/');
  };

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

  // Links for enabled modules
  const moduleLinks = [
    { name: 'Sales', path: '/sales', key: 'sales' },
    { name: 'Purchase', path: '/purchase', key: 'purchase' },
    { name: 'Inventory', path: '/inventory', key: 'inventory' },
    { name: 'CRM', path: '/crm', key: 'crm' }
  ].filter((module) => enabledModules.includes(module.key));

  // Drawer content
  const drawerContent = (
    <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)}>
      <Typography variant="h6" sx={{ p: 2 }}>
        Modules
      </Typography>
      <Divider />
      <List>
        {moduleLinks.map((module) => (
          <ListItem
            button
            key={module.key}
            component={Link}
            to={module.path}
          >
            <ListItemText primary={module.name} />
          </ListItem>
        ))}

        {/* Admin-only Roles link */}
        {role === 'admin' && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItem
              button
              component={Link}
              to="/roles"
            >
              <ListItemText primary="Role Management" />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="static" sx={{ marginBottom: 2 }}>
        <Toolbar>
          {/* Sidebar menu toggle button */}
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            ERP App
          </Typography>

          <Typography variant="body1" sx={{ marginLeft: 2, marginRight: 2 }}>
            {user?.name || user?.email}
          </Typography>

          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Drawer sidebar */}
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        {drawerContent}
      </Drawer>
    </>
  );
}
