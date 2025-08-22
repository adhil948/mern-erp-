import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { onAuthStateChanged, getIdToken, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "./firebase";
import { useAppDispatch, useAppState } from "./context/AppContext";

import SignIn from "./components/SignIn";
import ModuleGuard from "./components/ModuleGuard";
import Navbar from "./components/Navbar";

import ChooseOrg from "./pages/ChooseOrg";

import SalesInvoicePrint from "./pages/print/SaleInvoicePrint";
import CashBillPrint from "./pages/print/CashBillPrint";

import routes from "./routes"; // ✅ new import

function App() {
  const dispatch = useAppDispatch();
  const { user, token, activeOrgId, role, needsOrgSelection } = useAppState();

  console.log("user:", user);
  console.log("activeOrgId:", activeOrgId);
  console.log("needsOrgSelection:", needsOrgSelection);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await getIdToken(firebaseUser);

          const res = await axios.post(
            "http://192.168.220.54:5000/api/auth/signin",
            {},
            { headers: { Authorization: `Bearer ${idToken}` } }
          );

          const userData = res.data.user;
          console.log(res.data.user);

          if (res.data.needsOrgSelection) {
            console.log("need orgSelection", res.data);

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

  // If no user, show Sign In
  if (!user) {
    return <SignIn onLogin={() => {}} />;
  }

  // If org selection is needed
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

  // ✅ Normal app routes
  return (
    <Router>
      <Navbar />
      <Routes>
        {routes(role, activeOrgId).map((r, idx) => (
          <Route
            key={idx}
            path={r.path}
            element={
              r.module ? (
                <ModuleGuard module={r.module}>{r.component}</ModuleGuard>
              ) : (
                r.component
              )
            }
          />
        ))}

        {/* Extra routes (not in sidebar) */}
        <Route path="/sales/:id/print" element={<SalesInvoicePrint />} />
        <Route path="/cash-bills/:id/print" element={<CashBillPrint />} />

        {/* Redirect unknown paths */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
