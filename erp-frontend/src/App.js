import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { onAuthStateChanged, getIdToken, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from './firebase';
import { useAppDispatch, useAppState } from './context/AppContext';

import SignIn from './components/SignIn';
import ModuleManagement from './components/ModuleManagement';
import ModuleGuard from './components/ModuleGuard';
import Navbar from './components/Navbar';

import Dashboard from './pages/Dashboard';


import RoleManagement from './pages/RoleManagement';
import CompanyProfilePage from './pages/CompanyProfile';
import ChooseOrg from './pages/ChooseOrg'; 

import SalesPage from './pages/SalesPage';
import PurchasePage from './pages/PurchasesPage';
import InventoryPage from './pages/InventoryPage';
import CrmCustomersPage from './pages/CrmCustomersPage';
import SalesInvoicePrint from './pages/print/SaleInvoicePrint';
import CashBillPrint from './pages/print/CashBillPrint';  

import { signOut } from "firebase/auth";
import { AppBar } from '@mui/material';


function App() {

  
  const dispatch = useAppDispatch();
  const { user, token, activeOrgId, role,needsOrgSelection } = useAppState();


  console.log('user:', user);
console.log('activeOrgId:', activeOrgId);
console.log('needsOrgSelection:', needsOrgSelection);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await getIdToken(firebaseUser);

          const res = await axios.post(
            'http://localhost:5000/api/auth/signin',
            {},
            { headers: { Authorization: `Bearer ${idToken}` } }
          );

          const userData = res.data.user;

          console.log(res.data.user)

          if (res.data.needsOrgSelection) {

            console.log("need orgSelection",res.data)
            
            // User needs to create/join org - set flag and stop here
            dispatch({
              type: 'LOGIN',
              payload: {
                user: userData,
                token: idToken,
                activeOrgId: null,
                role: null,
                enabledModules: [],
                needsOrgSelection: true,
              },
            });
          } else if (userData.orgMemberships && userData.orgMemberships.length > 0) {
            const firstMembership = userData.orgMemberships[0];
            dispatch({
              type: 'LOGIN',
              payload: {
                user: userData,
                token: idToken,
                activeOrgId: firstMembership.orgId,
                role: firstMembership.role,
                enabledModules: firstMembership.enabledModules,
                needsOrgSelection: false,
              },
            });
          } else {
            // No membership but no flag? Treat as needsOrgSelection true to be safe
            dispatch({
              type: 'LOGIN',
              payload: {
                user: userData,
                token: idToken,
                activeOrgId: null,
                role: null,
                enabledModules: [],
                needsOrgSelection: true,
              },
            });
          }
        } catch (error) {
          console.error('Sign-in error:', error);
          // On error - sign out client and clear state
          await firebaseSignOut(auth);
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        // No firebase user - clear state
        dispatch({ type: 'LOGOUT' });
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  if (!user) {
    return <SignIn onLogin={() => {}} />;
  }



if (needsOrgSelection || !activeOrgId) {
  // Needs org selection or no orgId, show ChooseOrg
  return <Router> <ChooseOrg token={token} onOrgJoined={(updatedUser) => {
    dispatch({
      type: 'LOGIN',
      payload: {
        user: updatedUser,
        token,
        activeOrgId: updatedUser.orgMemberships[0]?.orgId || null,
        role: updatedUser.orgMemberships?.role || null,
        enabledModules: updatedUser.orgMemberships?.enabledModules || [],
        needsOrgSelection: false,
      }
    });
  }} /> </Router>;
}

  // User is signed in and belongs to org - allow dashboard and modules
  return (
    <Router>
      <Navbar/>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sales/:id/print" element={<SalesInvoicePrint />} />

        <Route path="/cash-bills/:id/print" element={<CashBillPrint />} />

        <Route
          path="/sales"
          element={
            <ModuleGuard module="sales">
              <SalesPage />
            </ModuleGuard>
          }
        />

        <Route
          path="/purchase"
          element={
            <ModuleGuard module="purchase">
              <PurchasePage />
            </ModuleGuard>
          }
        />

                <Route
          path="/crm"
          element={
            <ModuleGuard module="sales">
              <CrmCustomersPage />
            </ModuleGuard>
          }
        />

        {role === 'admin' && <Route path="/roles" element={<RoleManagement orgId={activeOrgId} />} />}
        {role === 'admin' && <Route path="/settings/company" element={<CompanyProfilePage />} />}

        <Route
          path="/inventory"
          element={
            <ModuleGuard module="inventory">
              <InventoryPage />
            </ModuleGuard>
          }
        />

        {/* Redirect unknown paths to root */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
