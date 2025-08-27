import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  CardHeader,
  Typography,
  Avatar,
  Chip,
  Stack,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  MenuItem,
  Select,
  Tooltip,
  LinearProgress,
  useTheme,
} from '@mui/material';
import PointOfSaleRoundedIcon from '@mui/icons-material/PointOfSaleRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import axios from 'axios';
import { useAppState } from '../context/AppContext';
import { useApi } from '../api';

// Minimal inline sparkline using simple divs (no chart lib needed)
function Sparkline({ values = [], color = '#1976d2' }) {
  const max = Math.max(...values, 1);
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', height: 28, gap: 0.5 }}>
      {values.map((v, i) => (
        <Box
          key={i}
          sx={{
            width: 6,
            height: `${Math.max((v / max) * 100, 6)}%`,
            bgcolor: color,
            borderRadius: 1,
            opacity: 0.6,
          }}
        />
      ))}
    </Box>
  );
}

const moduleMeta = {
  sales:   { label: 'Sales',     icon: <PointOfSaleRoundedIcon /> , color: 'primary.main',  desc: 'Invoices, receipts, and revenue' },
  purchase:{ label: 'Purchase',  icon: <ShoppingCartRoundedIcon /> , color: 'success.main',  desc: 'Bills, vendors, and payables' },
  inventory:{label: 'Inventory', icon: <Inventory2RoundedIcon /> , color: 'warning.main',  desc: 'Stock levels and movement' },
  crm:     { label: 'CRM',       icon: <PeopleAltRoundedIcon />   , color: 'info.main',     desc: 'Leads, accounts, and deals' },
};



export default function Dashboard() {
  const { enabledModules, activeOrgId, role, token } = useAppState();
  const navigate = useNavigate();
  const theme = useTheme();
  const api = useApi();

  const [org, setOrg] = useState(null);
  const [range, setRange] = useState('MTD'); // Today | 7D | MTD | QTD | YTD
  const [loading, setLoading] = useState(false);

  // Example KPI state (mock until backend endpoints exist)
  const [kpis, setKpis] = useState({
    sales: { total: 0, delta: +0.0, trend: [3, 4, 6, 5, 7, 8, 10] },
    purchase: { total: 0, delta: -0.0, trend: [2, 2, 3, 4, 3, 5, 4] },
    inventory: { total: 0, delta: +0.0, trend: [5, 4, 4, 6, 7, 7, 8] },
    crm: { total: 0, delta: +0.0, trend: [1, 2, 2, 3, 4, 4, 5] },
  });

  const handleCardClick = (module) => navigate(`/${module}`);

  useEffect(() => {
    async function fetchOrg() {
      api
        .get(`/orgs/${activeOrgId}`)
        .then((res) => {
          console.log("Fetched org:", res.data);
          setOrg(res.data);
        })
        .catch((err) => {
          console.error("Error fetching org:", err);
          setOrg(null); // or handle error properly
        });
    }
    fetchOrg();
  }, [activeOrgId]);

useEffect(() => {
  async function fetchKpis() {
    setLoading(true);
    try {
      const res = await api.get(`/metrics/kpis`, { params: { orgId: activeOrgId, range } });
      setKpis(res.data);
    } catch (e) {
      console.error('Failed to load KPIs', e);
      // Optional: toast error, setKpis to zeros as fallback
    } finally {
      setLoading(false);
    }
  }
  fetchKpis();
}, [range, activeOrgId, activeOrgId]);

  const visibleModules = useMemo(
    () => enabledModules.filter((m) => moduleMeta[m]),
    [enabledModules]
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Dashboard</Typography>
        <Tooltip title="Key insights for the selected period">
          <InfoOutlinedIcon fontSize="small" color="action" />
        </Tooltip>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Quick view of KPIs and shortcuts. Use filters to change time range.
      </Typography>



      {loading && <LinearProgress sx={{ mb: 2 }} />}

            <Grid container spacing={2}>
        {visibleModules.map((module) => {
          const meta = moduleMeta[module];
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={module}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  transition: 'transform 120ms ease, box-shadow 120ms ease',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
                }}
              >
                <CardActionArea onClick={() => handleCardClick(module)} sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                      <Avatar sx={{ bgcolor: meta.color, color: 'white' }}>
                        {meta.icon}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {meta.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {meta.desc}
                        </Typography>
                      </Box>
                      <Box sx={{ flexGrow: 1 }} />
                      <ArrowOutwardRoundedIcon fontSize="small" color="action" />
                    </Stack>

                    <Stack direction="row" spacing={1}>
                      <Chip size="small" label="Quick Access" variant="outlined" />
                      <Chip size="small" label="Overview" variant="outlined" />
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

       <Divider sx={{ my: 2 }} />

             {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }} alignItems="center">
        <ToggleButtonGroup
          size="small"
          value={range}
          exclusive
          onChange={(_, v) => v && setRange(v)}
          sx={{ flexWrap: 'wrap' }}
        >
          {['Today','7D','MTD','QTD','YTD'].map((r) => (
            <ToggleButton key={r} value={r}>{r}</ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Box sx={{ flexGrow: 1 }} />

        {/* Org switcher placeholder (wire to real list later) */}
        <Select size="small" value={org?.name || ''} displayEmpty disabled sx={{ minWidth: 180 }}>
          <MenuItem value=""><em>Organization</em></MenuItem>
          {org?.name && <MenuItem value={org.name}>{org.name}</MenuItem>}
        </Select>
      </Stack>

      {/* KPI strip */}
      <Grid container spacing={2} sx={{ mb: 1 }}>
        {visibleModules.map((m) => {
          const meta = moduleMeta[m];
          const k = kpis[m] || { total: 0, delta: 0, trend: [] };
          const up = k.delta >= 0;
          return (
            <Grid item xs={12} sm={6} md={3} key={m}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ bgcolor: meta.color, color: 'white' }}>
                      {meta.icon}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Typography variant="body2" color="text.secondary">{meta.label}</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {k.total.toLocaleString()}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={`${up ? '+' : ''}${k.delta.toFixed(1)}%`}
                      color={up ? 'success' : 'error'}
                      variant="soft"
                    />
                  </Stack>
                  <Box sx={{ mt: 1 }}>
                    <Sparkline values={k.trend} color={theme.palette.primary.main} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

     

      {/* Module shortcuts */}


      {/* Admin panel */}
      {role === 'admin' && org && (
        <Card variant="outlined" sx={{ mt: 3 }}>
          <CardHeader title="Organization" />
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <Chip color="primary" label={org.name} variant="soft" />
              {org.joinCode && <Chip label={`Join Code: ${org.joinCode}`} variant="outlined" />}
              <Typography variant="body2" color="text.secondary">
                Manage company settings in Settings → Company Details.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
