import React, { useState } from 'react';
import { Link, useLocation, Navigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Gift,
  Newspaper,
  ShieldCheck,
  Terminal,
  Settings,
  ArrowLeft,
  LogOut,
  Menu,
  X,
  Server,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const location = useLocation();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  if (isLoading) return null;
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/admin/login" replace />;
  }

  const menuItems = [
    { name: 'แดชบอร์ดภาพรวม', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'จัดการสินค้า & เซิร์ฟเวอร์', path: '/admin/products', icon: Package },
    { name: 'คำสั่งซื้อ & การเติมเงิน', path: '/admin/orders', icon: ShoppingCart },
    { name: 'โค้ดของขวัญ (Redeem)', path: '/admin/codes', icon: Gift },
    { name: 'ข่าวสาร & โปรโมชัน', path: '/admin/news', icon: Newspaper },
    { name: 'ความปลอดภัย & Log ผูกบัญชี', path: '/admin/security', icon: ShieldCheck },
    { name: 'RCON & คิวคำสั่งในเกม', path: '/admin/rcon', icon: Terminal },
    { name: 'ตั้งค่าระบบ & RCON', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-gray-200 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-[#101724] border-b border-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-black text-sky-400">CORARE ADMIN</span>
        </div>
        <button
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className="p-2 text-gray-400 hover:text-white"
        >
          {isMobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          isMobileNavOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-[#101724] border-r border-gray-800 flex-shrink-0 flex flex-col justify-between`}
      >
        <div className="p-5 space-y-6">
          {/* Logo */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center text-lg text-black font-black shadow-md">
              👑
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white block">
                CORARE<span className="text-sky-400">ADMIN</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                Control Panel
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileNavOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-400 hover:text-emerald-400 hover:bg-gray-800/40 rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่หน้าร้านค้า</span>
          </Link>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-xl transition text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>ออกจากระบบแอดมิน</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
