import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from '../context/AppContext';
import { useApi } from '../api';

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
        token, // Firebase ID token
        activeOrgId,
        role: membership?.role || null,
        enabledModules: membership?.enabledModules || [],
        needsOrgSelection: !activeOrgId,
      }
    });

    navigate('/'); // dashboard
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Welcome! Please create or join an organization:</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div>
        <h3>Create New Organization</h3>
        <input
          placeholder="Organization Name"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
        />
        <button onClick={handleCreateOrg} disabled={!orgName.trim()}>
          Create
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>Join Existing Organization</h3>
        <input
          placeholder="Enter Join Code"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
        />
        <button onClick={handleJoinOrg} disabled={!joinCode.trim()}>
          Join
        </button>
      </div>
    </div>
  );
}
