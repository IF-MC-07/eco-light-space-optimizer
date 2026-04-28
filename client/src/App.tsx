import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import SavingsReport from './components/pages/main/SavingsReport';
import LightingAndAC from './components/pages/admin/LightingAndAC';
import RoomAvailability from './components/pages/admin/RoomAvailability';
import AutomationRules from './components/pages/admin/AutomationRules';
import ProfileSettings from './components/pages/admin/ProfileSettings';
import EnergyMonitor from './components/pages/admin/EnergyMonitor';
import RequiresAuth from './guards/RequiresAuth';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<Navigate to="/admin/savings-report" replace />} />

        <Route path="/admin/savings-report" element={
          <RequiresAuth>
            <Layout navbarTitle="Savings Report" searchPlaceholder="Search reports..." variant="admin">
              <SavingsReport />
            </Layout>
          </RequiresAuth>
        } />

        <Route path="/admin/energy-monitor" element={
          <RequiresAuth>
            <Layout navbarTitle="Energy Monitor" searchPlaceholder="Search..." variant="admin">
              <EnergyMonitor />
            </Layout>
          </RequiresAuth>
        } />

        <Route path="/admin/lighting-ac" element={
          <RequiresAuth>
            <Layout navbarTitle="Lighting & AC Status" searchPlaceholder="Search rooms..." variant="admin">
              <LightingAndAC />
            </Layout>
          </RequiresAuth>
        } />

        <Route path="/admin/room-availability" element={
          <RequiresAuth>
            <Layout navbarTitle="Eco-Light & Space Optimizer" searchPlaceholder="Search..." variant="admin">
              <RoomAvailability />
            </Layout>
          </RequiresAuth>
        } />

        <Route path="/admin/automation" element={
          <RequiresAuth>
            <Layout navbarTitle="Automation Rules" searchPlaceholder="Search routines..." variant="admin">
              <AutomationRules />
            </Layout>
          </RequiresAuth>
        } />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/admin/savings-report" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
