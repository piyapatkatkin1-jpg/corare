import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Coins,
  Gift,
  Newspaper,
  BookOpen,
  User as UserIcon,
  LogOut,
  Shield,
  Menu,
  X,
  Copy,
  Check,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMinecraftHeadUrl } from '../utils/minecraftSkin';
import { api } from '../services/api';

export const Navbar: React.FC = () => {
  const { user, logout, openLinkModal } = useAuth();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [copiedIp, setCopiedIp] = useState(false);

  const [serverIp, setServerIp] = useState('corarevanilla.xyz');
  const [storeName, setStoreName] = useState('corarevanilla');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoIcon, setLogoIcon] = useState('💎');
  const [tagline, setTagline] = useState('Official Web Store');
  const [announcement, setAnnouncement] = useState('ยินดีต้อนรับสู่ corarevanilla SMP - สังคมเอาชีวิตรอด คอมมูนิตี้มายคราฟแท้ IP: corarevanilla.xyz');

  useEffect(() => {
    api.getPublicSettings()
      .then((res) => {
        if (res?.settings) {
          if (res.settings.serverIp) setServerIp(res.settings.serverIp);
          if (res.settings.storeName) setStoreName(res.settings.storeName);
          if (res.settings.announcement) setAnnouncement(res.settings.announcement);
          if (res.settings.logoUrl !== undefined) setLogoUrl(res.settings.logoUrl);
          if (res.settings.logoIcon) setLogoIcon(res.settings.logoIcon);
          if (res.settings.tagline) setTagline(res.settings.tagline);
        }
      })
      .catch(() => {});
  }, []);

  const handleCopyIp = () => {
    navigator.clipboard.writeText(serverIp);
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  const navLinks = [
    { name: 'หน้าแรก', path: '/' },
    { name: 'ร้านค้า SMP', path: '/store', icon: ShoppingBag },
    { name: 'เติมเงิน', path: '/topup', icon: Coins, highlight: true },
    { name: 'แลกโค้ด', path: '/redeem', icon: Gift },
    { name: 'ข่าวสาร', path: '/news', icon: Newspaper },
    { name: 'กฎกติกา', path: '/rules', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#070e1b]/95 backdrop-blur-md border-b border-gray-800/80">
      {/* Top Banner / Server IP bar */}
      <div className="bg-[#050a14] border-b border-gray-850 px-4 py-1.5 text-xs text-gray-400">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            <span className="text-gray-300 truncate max-w-xs sm:max-w-md">{announcement}</span>
            <span className="hidden sm:inline text-gray-600">|</span>
            <span className="hidden sm:inline text-sky-400 font-medium">ออนไลน์ 128/500 คน</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-gray-400 hidden sm:inline">Server IP:</span>
            <button
              onClick={handleCopyIp}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-gray-800/80 hover:bg-gray-700/80 border border-sky-500/30 rounded-lg text-sky-400 font-mono font-medium transition shadow-sm"
              title="คลิกเพื่อคัดลอก IP"
            >
              {serverIp}
              {copiedIp ? <Check className="w-3.5 h-3.5 text-sky-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-300 flex items-center justify-center shadow-glow-sky group-hover:scale-105 transition-transform overflow-hidden p-1 flex-shrink-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={storeName}
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <span className="text-xl sm:text-2xl font-black text-black">{logoIcon || '💎'}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white group-hover:text-sky-400 transition uppercase">
                  {storeName}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded font-bold">
                  SMP
                </span>
              </div>
              <span className="text-[10px] tracking-widest uppercase text-gray-400 font-medium block -mt-1">
                {tagline}
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 shadow-sm'
                      : link.highlight
                      ? 'text-amber-400 hover:bg-amber-400/10'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {link.name}
                  {link.highlight && (
                    <span className="px-1.5 py-0.2 text-[10px] bg-amber-500/20 text-amber-400 rounded-full font-bold">
                      โบนัส
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile / Login Button */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                {/* Points Balance Badge */}
                <Link
                  to="/topup"
                  className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-sky-950/60 to-gray-900 border border-sky-500/30 hover:border-sky-500/60 rounded-xl transition group shadow-sm"
                  title="คลิกเพื่อเติมเงิน"
                >
                  <Coins className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <span className="text-xs text-gray-400 block -mb-1">ยอดคงเหลือ</span>
                    <span className="text-sm font-bold text-white group-hover:text-sky-400">
                      {user.balance.toLocaleString()} <span className="text-xs text-sky-400 font-normal">Points</span>
                    </span>
                  </div>
                </Link>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 pl-2 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 rounded-xl transition"
                  >
                    <img
                      src={getMinecraftHeadUrl(user.uuid || user.username, 32)}
                      alt={user.username}
                      className="w-7 h-7 rounded-lg border border-sky-500/40 bg-black/50 pixelated"
                    />
                    <span className="text-sm font-semibold text-white max-w-[100px] truncate">
                      {user.username}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-52 bg-[#0c1524] border border-gray-800 rounded-xl shadow-2xl py-2 z-50 animate-fadeIn"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-gray-800">
                        <p className="text-xs text-gray-400">เข้าสู่ระบบในชื่อ</p>
                        <p className="text-sm font-bold text-white truncate">{user.username}</p>
                        {user.role === 'ADMIN' && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-[10px] font-bold">
                            ผู้ดูแลระบบ (Admin)
                          </span>
                        )}
                      </div>

                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition"
                      >
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        โปรไฟล์ & ประวัติสั่งซื้อ
                      </Link>

                      {user.role === 'ADMIN' && (
                        <Link
                          to="/admin/dashboard"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-sky-400 hover:bg-sky-950/30 transition"
                        >
                          <Shield className="w-4 h-4" />
                          ระบบจัดการหลังบ้าน
                        </Link>
                      )}

                      <div className="border-t border-gray-800 my-1"></div>

                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        ออกจากระบบ
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={openLinkModal}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-black text-sm font-black rounded-xl shadow-lg shadow-sky-500/25 transition-all hover:scale-105"
              >
                <Sparkles className="w-4 h-4" />
                เข้าสู่ระบบ / ผูกบัญชี
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            {user && (
              <Link
                to="/topup"
                className="px-2.5 py-1 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg text-xs font-bold"
              >
                {user.balance.toLocaleString()} P
              </Link>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#070e1b] border-b border-gray-800 px-4 pt-2 pb-5 space-y-2 animate-fadeIn">
          {user ? (
            <div className="p-3 bg-[#0d1728] border border-gray-800 rounded-xl mb-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={getMinecraftHeadUrl(user.uuid || user.username, 36)}
                  alt={user.username}
                  className="w-9 h-9 rounded-lg border border-sky-500/40 bg-black/50 pixelated"
                />
                <div>
                  <div className="text-sm font-bold text-white">{user.username}</div>
                  <div className="text-xs text-sky-400 font-medium">
                    {user.balance.toLocaleString()} Points
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg text-xs flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
                ออก
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                openLinkModal();
              }}
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-cyan-500 text-black font-black rounded-xl text-center shadow-lg shadow-sky-500/25 mb-3 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              เข้าสู่ระบบ / ผูกบัญชี
            </button>
          )}

          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800"
            >
              {link.name}
            </Link>
          ))}

          {user && (
            <Link
              to="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800"
            >
              โปรไฟล์ & ประวัติสั่งซื้อ
            </Link>
          )}

          {user?.role === 'ADMIN' && (
            <Link
              to="/admin/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-sky-400 hover:bg-sky-950/30"
            >
              ระบบจัดการหลังบ้าน (Admin)
            </Link>
          )}
        </div>
      )}
    </header>
  );
};
