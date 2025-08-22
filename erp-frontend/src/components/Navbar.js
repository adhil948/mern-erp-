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
  Box,
  ListItemIcon,
  Tooltip,
  Avatar,
  useScrollTrigger
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import PointOfSaleRoundedIcon from '@mui/icons-material/PointOfSaleRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import ColorModeIconDropdown from '../shared-theme/ColorModeIconDropdown';


export default function Navbar() {



  const { user, enabledModules, role,activeOrgId } = useAppState(); // now also pulling role
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
    <Box sx={{ width: 280 }} role="presentation" onClick={toggleDrawer(false)}>
      <Typography variant="h6" sx={{ p: 2 }}>
        Modules
      </Typography>
      <Divider />
      <List>
        <ListItem button component={Link} to="/">
          <ListItemIcon>
            <HomeRoundedIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        {moduleLinks.map((module) => (
          <ListItem
            button
            key={module.key}
            component={Link}
            to={module.path}
          >
            <ListItemIcon>
              {module.key === 'sales' && <PointOfSaleRoundedIcon />}
              {module.key === 'purchase' && <ShoppingCartRoundedIcon />}
              {module.key === 'inventory' && <Inventory2RoundedIcon />}
              {module.key === 'crm' && <PeopleAltRoundedIcon />}
            </ListItemIcon>
            <ListItemText primary={module.name} />
          </ListItem>
        ))}


        {/* Admin-only Roles link */}
        {role === 'admin' && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItem button component={Link} to="/roles">
              <ListItemIcon>
                <SecurityRoundedIcon />
              </ListItemIcon>
              <ListItemText primary="Role Management" />
            </ListItem>
            <Divider sx={{ my: 1 }} />
            <ListItem button component={Link} to="/settings/company">
              <ListItemIcon>
                <BusinessRoundedIcon />
              </ListItemIcon>
              <ListItemText primary="Company Details" />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );


  return (
    <>
      <AppBar className='no-print' position="sticky" elevation={useScrollTrigger() ? 4 : 0} sx={{ mb: 2,backgroundColor: '#373d41ff', color: 'white' }}>
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


          <ColorModeIconDropdown />
          <Tooltip title={user?.email}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
              <Avatar sx={{ width: 28, height: 28 }}>
                {(user?.name || user?.email || 'U').slice(0, 1).toUpperCase()}
              </Avatar>
              <Typography variant="body2">{user?.name || user?.email}</Typography>
            </Box>
          </Tooltip>


          <Tooltip title="Logout">
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutRoundedIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>


      {/* Drawer sidebar */}
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        {drawerContent}
      </Drawer>
    </>
  );
}