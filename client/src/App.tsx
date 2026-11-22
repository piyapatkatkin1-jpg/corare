import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LinkModal } from './components/LinkModal';
import { HomePage } from './pages/HomePage';
import { StorePage } from './pages/StorePage';
import { TopupPage } from './pages/TopupPage';
import { RedeemPage } from './pages/RedeemPage';
import { NewsPage } from './pages/NewsPage';
import { RulesPage } from './pages/RulesPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminCodes } from './pages/admin/AdminCodes';
import { AdminNews } from './pages/admin/AdminNews';
import { AdminSecurity } from './pages/admin/AdminSecurity';
import { AdminRcon } from './pages/admin/AdminRcon';
import { AdminSettings } from './pages/admin/AdminSettings';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-gray-100 font-['Kanit',sans-serif]">
      {/* Show Client Navbar & Footer only when not inside admin layout */}
      {!isAdminRoute && <Navbar />}

      <div className="flex-1">
        <Routes>
          {/* Public Store Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/store" element={<StorePage />} />
          <Route path="/topup" element={<TopupPage />} />
          <Route path="/redeem" element={<RedeemPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="codes" element={<AdminCodes />} />
            <Route path="news" element={<AdminNews />} />
            <Route path="security" element={<AdminSecurity />} />
            <Route path="rcon" element={<AdminRcon />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {!isAdminRoute && <Footer />}

      {/* Global In-Game Account Linking Modal */}
      <LinkModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
