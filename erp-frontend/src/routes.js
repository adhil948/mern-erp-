// src/routes.js
import Dashboard from "./pages/Dashboard";
import SalesPage from "./pages/SalesPage";
import PurchasePage from "./pages/PurchasesPage";
import InventoryPage from "./pages/InventoryPage";
import CrmCustomersPage from "./pages/CrmCustomersPage";
import RoleManagement from "./pages/RoleManagement";
import CompanyProfilePage from "./pages/CompanyProfile";

const routes = (role, activeOrgId) => [
  {
    path: "/",
    name: "Dashboard",
    component: <Dashboard />,
    module: null,
    icon: "home",
  },
  {
    path: "/sales",
    name: "Sales",
    component: <SalesPage />,
    module: "sales",
    icon: "shopping-cart",
  },
  {
    path: "/purchase",
    name: "Purchases",
    component: <PurchasePage />,
    module: "purchase",
    icon: "shopping-bag",
  },
  {
    path: "/crm",
    name: "CRM",
    component: <CrmCustomersPage />,
    module: "sales",
    icon: "users",
  },
  {
    path: "/inventory",
    name: "Inventory",
    component: <InventoryPage />,
    module: "inventory",
    icon: "boxes",
  },
  ...(role === "admin"
    ? [
        {
          path: "/roles",
          name: "Role Management",
          component: <RoleManagement orgId={activeOrgId} />,
          module: null,
          icon: "shield",
        },
        {
          path: "/settings/company",
          name: "Company Profile",
          component: <CompanyProfilePage />,
          module: null,
          icon: "building",
        },
      ]
    : []),
];

export default routes;
