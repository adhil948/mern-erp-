import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from '../context/AppContext';
import { useApi } from '../api';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

import { IconButton } from '@mui/material';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';

import {
  Container,
  Paper,
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  Divider,
  Alert
} from '@mui/material';

export default function ChooseOrg({ token }) {
  const [orgName, setOrgName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const api = useApi();

  const handleCreateOrg = async () => {
    try {
      const res = await api.post('/auth/createOrg', { orgName });
      handleOrgJoined(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create organisation');
    }
  };

  const handleJoinOrg = async () => {
    try {
      const res = await api.post('/auth/joinOrg', { joinCode });
      handleOrgJoined(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join organisation');
    }
  };

    const handleLogout = async () => {
      await signOut(auth);
      dispatch({ type: 'LOGOUT' });
      navigate('/');
    };

const handleOrgJoined = (updatedUser) => {
  // Prefer backend’s activeOrgId if present; fallback to first membership
  const activeOrgId =
    updatedUser.activeOrgId?.toString?.() ||
    updatedUser.orgMemberships?.[0]?.orgId?.toString?.() ||
    null;

  // Find the matching membership
  const membership =
    updatedUser.orgMemberships?.find(m => m.orgId?.toString?.() === activeOrgId) ||
    updatedUser.orgMemberships?.[0] ||
    null;

    dispatch({
      type: 'LOGIN',
      payload: {
        user: updatedUser,
        token,
        activeOrgId,
        role: membership?.role || null,
        enabledModules: membership?.enabledModules || [],
        needsOrgSelection: !activeOrgId,
      }
    });

    navigate('/', { replace: true }); // go to dashboard after org switch
  };

  const hasOrgName = orgName.trim().length > 0;
  const hasJoinCode = joinCode.trim().length > 0;

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper elevation={3} sx={{ width: '100%', p: { xs: 2.5, sm: 4 }, borderRadius: 2 }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Welcome — choose organization
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create a new organization or join an existing one with a code. 
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              Create new organization
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                fullWidth
                label="Organization name"
                placeholder="e.g., Acme Pvt Ltd"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                size="medium"
                autoComplete="organization"
              />
              <Button
                variant="outlined"
                onClick={handleCreateOrg}
                disabled={!hasJoinCode}
                sx={{ minWidth: 120, alignSelf: { xs: 'stretch', sm: 'center' } }}
              >
                Create 
              </Button>
            </Stack>
          </Box>

          <Divider flexItem>or</Divider>

          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              Join existing organization
            </Typography>
                                    <Typography variant="body2" color="text.secondary">
              Ask your admin for the code. 
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                fullWidth
                label="Join code"
                placeholder="Enter invite code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                size="medium"
                inputProps={{ 'aria-label': 'Join code' }}
              />
              <Button
                variant="outlined"
                onClick={handleJoinOrg}
                disabled={!hasJoinCode}
                sx={{ minWidth: 120, alignSelf: { xs: 'stretch', sm: 'center' } }}
              >
                Join
              </Button>
                        <IconButton size="small" onClick={handleLogout} sx={{ ml: 'auto' }}>
                          <LogoutRoundedIcon fontSize="small" />
                        </IconButton>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}
