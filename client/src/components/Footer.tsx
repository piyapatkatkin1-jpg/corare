import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, MessageSquare, ExternalLink, Heart } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Footer: React.FC = () => {
  const { user } = useAuth();
  const [storeName, setStoreName] = useState('corarevanilla');
  const [serverIp, setServerIp] = useState('corarevanilla.xyz');
  const [discordUrl, setDiscordUrl] = useState('https://discord.gg/corarevanilla');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoIcon, setLogoIcon] = useState('💎');

  useEffect(() => {
    api.getPublicSettings()
      .then((res) => {
        if (res?.settings) {
          if (res.settings.storeName) setStoreName(res.settings.storeName);
          if (res.settings.serverIp) setServerIp(res.settings.serverIp);
          if (res.settings.discordUrl) setDiscordUrl(res.settings.discordUrl);
          if (res.settings.logoUrl) setLogoUrl(res.settings.logoUrl);
          if (res.settings.logoIcon) setLogoIcon(res.settings.logoIcon);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-[#050a14] border-t border-gray-850 mt-16 text-gray-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center text-lg text-black font-black shadow-glow-sky overflow-hidden p-0.5">
                {logoUrl ? (
                  <img src={logoUrl} alt={storeName} className="w-full h-full object-contain rounded-lg" />
                ) : (
                  <span>{logoIcon || '💎'}</span>
                )}
              </div>
              <span className="text-xl font-black tracking-tight text-white uppercase">
                {storeName}
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-md">
              {storeName} SMP — เซิร์ฟเวอร์มายคราฟ Survival SMP คอมมูนิตี้เอาชีวิตรอดแท้ สร้างบ้าน ทำฟาร์ม ค้าขาย สนุกไปกับเพื่อนๆ รองรับการเชื่อมต่อที่ IP: <span className="text-sky-400 font-mono font-bold">{serverIp}</span>
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <a
                href={discordUrl || 'https://discord.gg/corarevanilla'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/30 rounded-xl hover:bg-[#5865F2]/30 text-xs font-semibold transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Discord Community
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
              {user?.role === 'ADMIN' && (
                <Link
                  to="/admin/dashboard"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-800 text-gray-400 hover:text-white rounded-xl text-xs transition"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin Panel
                </Link>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">เมนูลัด</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/store" className="hover:text-sky-400 transition">ร้านค้าไอเทม & ยศ SMP</Link>
              </li>
              <li>
                <Link to="/topup" className="hover:text-sky-400 transition">เติมเงิน TrueMoney Wallet</Link>
              </li>
              <li>
                <Link to="/redeem" className="hover:text-sky-400 transition">แลกไอเทมโค้ด</Link>
              </li>
              <li>
                <Link to="/news" className="hover:text-sky-400 transition">ข่าวสาร & กิจกรรม</Link>
              </li>
              <li>
                <Link to="/rules" className="hover:text-sky-400 transition">กฎกติกาเซิร์ฟเวอร์</Link>
              </li>
            </ul>
          </div>

          {/* Legal / Disclaimer */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">ข้อกำหนด & สิทธิ์</h4>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              เซิร์ฟเวอร์นี้ไม่มีส่วนเกี่ยวข้องใดๆ กับ Mojang AB หรือ Microsoft Corporation ทั้งสิ้น Minecraft เป็นเครื่องหมายการค้าจดทะเบียนของ Mojang AB
            </p>
            <p className="text-[11px] text-gray-400 mt-2">
              การชำระเงินทั้งหมดถือเป็นการสนับสนุนการดำเนินงานของเซิร์ฟเวอร์โดยสมัครใจ
            </p>
          </div>
        </div>

        <div className="border-t border-gray-850 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400">
          <div>
            &copy; {new Date().getFullYear()} corarevanilla Network (corarevanilla.xyz). All rights reserved.
          </div>
          <div className="flex items-center gap-1 mt-2 sm:mt-0">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
            <span>for Minecraft Community</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
