import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "../components/Layout/MainLayout";
import ProtectedRoute from "../components/ProtectedRoute";

import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import Customers from "../pages/Customers/Customers";
import Measurements from "../pages/Measurements/Measurements";
import Orders from "../pages/Orders/Orders";
import Billing from "../pages/Billing/Billing";
import Reports from "../pages/Reports/Reports";
import Inventory from "../pages/Inventory/Inventory";
import Employees from "../pages/Employees/Employees";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* Default Route - Redirect to Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public Route - Login */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes - Require Authentication */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
        </Route>

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="measurements" element={<Measurements />} />
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