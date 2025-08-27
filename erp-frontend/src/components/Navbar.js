import React, { useMemo, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Box,
  ListItemIcon,
  Tooltip,
  Avatar,
  CssBaseline,
  Chip,
  Collapse,
  useTheme,
} from '@mui/material';

import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import KeyboardArrowLeftRoundedIcon from '@mui/icons-material/KeyboardArrowLeftRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import PointOfSaleRoundedIcon from '@mui/icons-material/PointOfSaleRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppState } from '../context/AppContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import ColorModeIconDropdown from '../shared-theme/ColorModeIconDropdown';

export const RAIL_WIDTH = 72;
const DRAWER_WIDTH = 280;

export default function Navbar() {
  const theme = useTheme();
  const { user, enabledModules, role } = useAppState();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(true);
  const [otherOpen, setOtherOpen] = useState(true);

  const toggleOpen = () => setOpen((p) => !p);

  const handleLogout = async () => {
    await signOut(auth);
    dispatch({ type: 'LOGOUT' });
    navigate('/');
  };

  const moduleLinks = useMemo(
    () =>
      [
        { name: 'Sales', path: '/sales', key: 'sales', icon: <PointOfSaleRoundedIcon /> },
        { name: 'Purchase', path: '/purchase', key: 'purchase', icon: <ShoppingCartRoundedIcon /> },
        { name: 'Inventory', path: '/inventory', key: 'inventory', icon: <Inventory2RoundedIcon /> },
        { name: 'CRM', path: '/crm', key: 'crm', icon: <PeopleAltRoundedIcon /> },
      ].filter((m) => enabledModules.includes(m.key)),
    [enabledModules]
  );

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const NavItem = ({ to, icon, label, chip, onClick }) => (
    <ListItemButton
      component={Link}
      to={to}
      selected={isActive(to)}
      onClick={onClick}
      sx={{ borderRadius: 1.5, my: 0.25, px: open ? 1.25 : 1, minHeight: 44 }}
    >
      <ListItemIcon
        sx={{ minWidth: 0, mr: open ? 1.5 : 0, justifyContent: 'center', color: 'text.secondary' }}
      >
        {icon}
      </ListItemIcon>
      {open && (
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">{label}</Typography>
              {chip}
            </Box>
          }
        />
      )}
    </ListItemButton>
  );

  const Rail = (
    <Box
      sx={{
        width: RAIL_WIDTH,
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        borderRight: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Rail top: the ONLY toggle button */}
      <Box sx={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <IconButton size="small" onClick={toggleOpen} aria-label="toggle sidebar">
          {open ? <KeyboardArrowLeftRoundedIcon /> : <MenuRoundedIcon />}
        </IconButton>
      </Box>

      <Divider sx={{ width: '100%' }} />

      {/* Quick top link (Dashboard) */}
      <Tooltip title="Dashboard" placement="right">
        <Box sx={{ mt: 1 }}>
          <IconButton component={Link} to="/" color={isActive('/') ? 'primary' : 'default'}>
            <HomeRoundedIcon />
          </IconButton>
        </Box>
      </Tooltip>

      {/* Module icons */}
      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {moduleLinks.map((m) => (
          <Tooltip key={m.key} title={m.name} placement="right">
            <IconButton component={Link} to={m.path} color={isActive(m.path) ? 'primary' : 'default'}>
              {m.icon}
            </IconButton>
          </Tooltip>
        ))}
      </Box>

      <Box sx={{ flexGrow: 1 }} />

      {role === 'admin' && (
        <Tooltip title="Role Management" placement="right">
          <IconButton component={Link} to="/roles" color={isActive('/roles') ? 'primary' : 'default'}>
            <SecurityRoundedIcon />
          </IconButton>
        </Tooltip>
      )}

      <Tooltip title="Theme" placement="right">
        <Box sx={{ my: 0.5 }}>
          <ColorModeIconDropdown />
        </Box>
      </Tooltip>

      <Tooltip title="Logout" placement="right">
        <IconButton onClick={handleLogout} sx={{ mb: 1 }}>
          <LogoutRoundedIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );

  const Sidebar = (
    <Drawer
      variant="temporary"
      anchor="left"
      open={open}
      onClose={() => setOpen(false)}
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        sx: {
          width: DRAWER_WIDTH,
          ml: `${RAIL_WIDTH}px`,
          borderRight: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
        },
      }}
    >
      {/* Sidebar header with brand (keep ERP App visible here) */}
      <Box
        sx={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          ERP Super
        </Typography>
        {/* Secondary close button kept for convenience; the main toggle is on the rail */}
        <IconButton onClick={toggleOpen} aria-label="collapse sidebar">
          <KeyboardArrowLeftRoundedIcon />
        </IconButton>
      </Box>

      <Divider />

      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="overline" color="text.secondary">
          Home
        </Typography>
        <NavItem
          to="/"
          icon={<HomeRoundedIcon chip={<Chip size="small" color="primary" label="" sx={{ height: 20 }} />}/>}
          label="Dashboard"
          
          onClick={() => setOpen(false)}
        />
      </Box>

      <Box sx={{ px: 2, py: 1 }}>
        <Box
          onClick={() => setAppsOpen((p) => !p)}
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <Typography variant="overline" color="text.secondary">
            Apps
          </Typography>
          {appsOpen ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
        </Box>
        <Collapse in={appsOpen} unmountOnExit>
          <List disablePadding>
            {moduleLinks.map((m) => (
              <NavItem key={m.key} to={m.path} icon={m.icon} label={m.name} onClick={() => setOpen(false)} />
            ))}
          </List>
        </Collapse>
      </Box>

      {role === 'admin' && (
        <Box sx={{ px: 2, py: 1 }}>
          <Box
            onClick={() => setOtherOpen((p) => !p)}
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          >
            <Typography variant="overline" color="text.secondary">
              Other
            </Typography>
            {otherOpen ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
          </Box>
          <Collapse in={otherOpen} unmountOnExit>
            <List disablePadding>
              <NavItem to="/roles" icon={<SecurityRoundedIcon />} label="Role Management" onClick={() => setOpen(false)} />
              <NavItem to="/settings/company" icon={<BusinessRoundedIcon />} label="Company Details" onClick={() => setOpen(false)} />
            </List>
          </Collapse>
        </Box>
      )}

      <Box sx={{ flexGrow: 1 }} />

      <Box sx={{ px: 2, py: 2 }}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: (t) => (t.palette.mode === 'light' ? 'rgba(25,118,210,0.06)' : 'rgba(25,118,210,0.12)'),
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Avatar sx={{ width: 40, height: 40 }}>
            {(user?.name || user?.email || 'U').slice(0, 1).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" noWrap>
              {user?.name || 'Member'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.email}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleLogout} sx={{ ml: 'auto' }}>
            <LogoutRoundedIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Drawer>
  );

  return (
    <Box sx={{ display: 'flex' }} className="no-print">
      <CssBaseline />

      {/* AppBar WITHOUT the toggle button */}
      <AppBar
        position="fixed"
        elevation={0}
        color="default"
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
          ml: `${RAIL_WIDTH}px`,
          width: `calc(100% - ${RAIL_WIDTH}px)`,
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: 56 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            ERP Super
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <ColorModeIconDropdown />

          <Tooltip title={user?.email || ''}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
              <Avatar sx={{ width: 28, height: 28 }}>
                {(user?.name || user?.email || 'U').slice(0, 1).toUpperCase()}
              </Avatar>
              <Typography variant="body2" color="text.secondary" noWrap>
                {user?.name || user?.email}
              </Typography>
            </Box>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Mini Rail with the only toggle button */}
      {Rail}

      {/* Expanded Sidebar */}
      {Sidebar}

      {/* Main content area */}
      <Box component="main" sx={{ flexGrow: 1, ml: `${RAIL_WIDTH}px` }}>
        <Toolbar variant="dense" sx={{ minHeight: 56 }} />
        {/* Routed content goes here */}
      </Box>
    </Box>
  );
}
