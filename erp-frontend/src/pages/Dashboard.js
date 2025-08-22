
import { useAppState } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardActionArea, CardContent, Typography, Grid, CardHeader, Avatar, Chip, Stack } from '@mui/material';
import PointOfSaleRoundedIcon from '@mui/icons-material/PointOfSaleRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import React, { useState, useEffect } from "react";
import axios from "axios";




const moduleMeta = {
  sales: { label: 'Sales', icon: <PointOfSaleRoundedIcon /> },
  purchase: { label: 'Purchase', icon: <ShoppingCartRoundedIcon /> },
  inventory: { label: 'Inventory', icon: <Inventory2RoundedIcon /> },
  crm: { label: 'CRM', icon: <PeopleAltRoundedIcon /> },
};

export default function Dashboard() {
  const { enabledModules } = useAppState();
  const navigate = useNavigate();
    const { activeOrgId, role, token } = useAppState();
  const [org, setOrg] = useState(null);

  const handleCardClick = (module) => {
    navigate(`/${module}`);
  };

   useEffect(() => {
    async function fetchOrg() {
      if (activeOrgId) {
        const res = await axios.get(
          `http://192.168.220.54:5000/api/orgs/${activeOrgId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOrg(res.data);
      }
    }
    fetchOrg();
  }, [activeOrgId, token]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Select a module to get started.
      </Typography>

            {role === "admin" && org && (
        <div>
          <b>Your organization is:</b> <code>{org.name}</code> <br />
          <b>Your organization join code:</b> <code>{org.joinCode}</code>
        </div>
      )}



      <Grid container spacing={3} sx={{ mt: 2 }}>
        {enabledModules.map((module) => (
          <Grid item xs={12} sm={6} md={4} key={module}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardActionArea onClick={() => handleCardClick(module)} sx={{ height: '100%' }}>
                <CardHeader
                  avatar={<Avatar color="primary">{moduleMeta[module]?.icon}</Avatar>}
                  titleTypographyProps={{ variant: 'h6' }}
                  title={moduleMeta[module]?.label || module}
                  subheader={`Manage your ${moduleMeta[module]?.label || module} operations`}
                />
                <CardContent>
                  <Stack direction="row" spacing={1}>
                    <Chip size="small" label="Quick Access" variant="outlined" />
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
