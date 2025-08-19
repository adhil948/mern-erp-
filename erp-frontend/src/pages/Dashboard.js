
import { useAppState } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardActionArea, CardContent, Typography, Grid } from '@mui/material';
import React, { useState, useEffect } from "react";
import axios from "axios";

const moduleLabels = {
  sales: 'Sales',
  purchase: 'Purchase',
  inventory: 'Inventory',
  crm: 'CRM',
  
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
          `http://localhost:5000/api/orgs/${activeOrgId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOrg(res.data);
      }
    }
    fetchOrg();
  }, [activeOrgId, token]);

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" gutterBottom>
        Select a module to get started.
      </Typography>

            {role === "admin" && org && (
        <div>
          <b>Your organization is:</b> <code>{org.name}</code> <br />
          <b>Your organization join code:</b> <code>{org.joinCode}</code>
        </div>
      )}

      <Grid container spacing={4} sx={{ marginTop: 2 }}>
        {enabledModules.map((module) => (
          <Grid item xs={12} sm={6} md={4} key={module}>
            <Card>
              <CardActionArea onClick={() => handleCardClick(module)}>
                <CardContent>
                  <Typography variant="h5">{moduleLabels[module] || module}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage your {moduleLabels[module] || module} operations.
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
