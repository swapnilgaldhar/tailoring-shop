import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "../components/Layout/MainLayout";

import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import Customers from "../pages/Customers/Customers";
import Orders from "../pages/Orders/Orders";
import Billing from "../pages/Billing/Billing";
import Reports from "../pages/Reports/Reports";
import Inventory from "../pages/Inventory/Inventory";
import Employees from "../pages/Employees/Employees";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route path="/" element={<MainLayout />}>

          {/* Default Route */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route path="dashboard" element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="orders" element={<Orders />} />
          <Route path="billing" element={<Billing />} />
          <Route path="reports" element={<Reports />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="employees" element={<Employees />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;