// App.js
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { onAuthStateChanged, getIdToken, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "./firebase";
import { useAppDispatch, useAppState } from "./context/AppContext";

import SignIn from "./components/SignIn";
import ModuleGuard from "./components/ModuleGuard";
import Navbar, { RAIL_WIDTH } from "./components/Navbar"; // ⬅️ import RAIL_WIDTH
import ChooseOrg from "./pages/ChooseOrg";

import SalesInvoicePrint from "./pages/print/SaleInvoicePrint";
import CashBillPrint from "./pages/print/CashBillPrint";
import PurchaseInvoicePrint from "./pages/print/PurchaseInvoicePrint";

import routes from "./routes";
import { Box, Toolbar } from "@mui/material"; // ⬅️ add MUI Box/Toolbar

function App() {
  const dispatch = useAppDispatch();
  const { user, token, activeOrgId, role, needsOrgSelection } = useAppState();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await getIdToken(firebaseUser);
          const res = await axios.post(
            "http://3.110.253.196:5000/api/auth/signin",
            {},
            { headers: { Authorization: `Bearer ${idToken}` } }
          );

          const userData = res.data.user;

          if (res.data.needsOrgSelection) {
            dispatch({
              type: "LOGIN",
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
              type: "LOGIN",
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
            dispatch({
              type: "LOGIN",
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
          console.error("Sign-in error:", error);
          await firebaseSignOut(auth);
          dispatch({ type: "LOGOUT" });
        }
      } else {
        dispatch({ type: "LOGOUT" });
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  if (!user) {
    return <SignIn onLogin={() => {}} />;
  }

  if (needsOrgSelection || !activeOrgId) {
    return (
      <Router>
        <ChooseOrg
          token={token}
          onOrgJoined={(updatedUser) => {
            dispatch({
              type: "LOGIN",
              payload: {
                user: updatedUser,
                token,
                activeOrgId: updatedUser.orgMemberships[0]?.orgId || null,
                role: updatedUser.orgMemberships?.role || null,
                enabledModules: updatedUser.orgMemberships?.enabledModules || [],
                needsOrgSelection: false,
              },
            });
          }}
        />
      </Router>
    );
  }

  return (
    <Router>
      {/* Fixed rail + appbar live inside Navbar */}
      <Navbar />

      {/* Content container: shift by rail, add top spacer for AppBar */}
      <Box
        component="main"
        sx={{
          ml: `${RAIL_WIDTH}px`,      // leave space for mini-rail
          px: { xs: 2, md: 3 },       // horizontal page padding
          pb: 3,                      // bottom breathing room
        }}
      >
        {/* AppBar spacer: must match Toolbar variant/height used in Navbar */}
        <Toolbar variant="dense" sx={{ minHeight: 56 }} />

        <Routes>
          {routes(role, activeOrgId).map((r, idx) => (
            <Route
              key={idx}
              path={r.path}
              element={r.module ? <ModuleGuard module={r.module}>{r.component}</ModuleGuard> : r.component}
            />
          ))}

          <Route path="/sales/:id/print" element={<SalesInvoicePrint />} />
          <Route path="/cash-bills/:id/print" element={<CashBillPrint />} />
          <Route path="/purchases/:id/print" element={<PurchaseInvoicePrint />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Box>
    </Router>
  );
}

export default App;
