import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Coins,
  ShoppingCart,
  Users,
  Terminal,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../services/api';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.getStats()
      .then((res) => {
        if (res) {
          setStats(res);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-400">กำลังโหลดข้อมูลแดชบอร์ด...</div>;
  }

  const s = stats?.stats || {};
  const recentOrders = stats?.recentOrders || [];
  const recentLinking = stats?.recentLinkingLogs || [];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">แดชบอร์ดภาพรวมระบบ</h1>
        <p className="text-xs text-gray-400 mt-1">
          สถิติยอดขาย การเติมเงิน คำสั่งซื้อ และความปลอดภัยล่าสุดของ corarevanilla Store
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 bg-[#121927] border border-gray-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold">ยอดเติมเงินรวมทั้งหมด</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            ฿{(s.totalRevenueBaht || 0).toLocaleString()} <span className="text-xs text-emerald-400">THB</span>
          </div>
          <div className="text-[11px] text-gray-500">
            สำเร็จ {s.totalSuccessfulTopups || 0} รายการ
          </div>
        </div>

        {/* Total Points Issued */}
        <div className="p-5 bg-[#121927] border border-gray-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold">Point ที่ถูกเติมเข้าสู่ระบบ</span>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400">
            {(s.totalPointsIssued || 0).toLocaleString()} <span className="text-xs text-gray-400 font-normal">Points</span>
          </div>
          <div className="text-[11px] text-gray-500">รวมแต้มโบนัสทั้งหมด</div>
        </div>

        {/* Total Orders */}
        <div className="p-5 bg-[#121927] border border-gray-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold">คำสั่งซื้อทั้งหมด</span>
            <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {(s.totalOrders || 0).toLocaleString()} <span className="text-xs text-gray-400 font-normal">ออเดอร์</span>
          </div>
          <div className="text-[11px] text-gray-500">ส่งไอเทมเข้าเกมสำเร็จ</div>
        </div>

        {/* Total Users */}
        <div className="p-5 bg-[#121927] border border-gray-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold">ผู้เล่นที่ผูกบัญชี</span>
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {(s.totalUsers || 0).toLocaleString()} <span className="text-xs text-gray-400 font-normal">คน</span>
          </div>
          <div className="text-[11px] text-gray-500">
            คิวคำสั่งค้างในเกม: <span className="text-amber-400 font-bold">{s.pendingCommands || 0}</span>
          </div>
        </div>
      </div>

      {/* Two Columns: Recent Orders & Linking Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="p-5 bg-[#121927] border border-gray-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-400" />
              คำสั่งซื้อล่าสุด
            </h3>
            <Link to="/admin/orders" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
              ดูทั้งหมด <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="text-[10px] uppercase text-gray-400 border-b border-gray-800 bg-[#0d131f]">
                <tr>
                  <th className="py-2.5 px-3">ผู้เล่น</th>
                  <th className="py-2.5 px-3">สินค้า</th>
                  <th className="py-2.5 px-3">ราคา</th>
                  <th className="py-2.5 px-3">เวลา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-850">
                {recentOrders.map((ord: any) => (
                  <tr key={ord.id} className="hover:bg-gray-800/30">
                    <td className="py-2.5 px-3 font-semibold text-white">{ord.user?.username}</td>
                    <td className="py-2.5 px-3 text-emerald-400 truncate max-w-[150px]">
                      {ord.items && ord.items[0]?.productName}
                    </td>
                    <td className="py-2.5 px-3 text-amber-400 font-bold">{ord.totalPoints} P</td>
                    <td className="py-2.5 px-3 text-gray-500">
                      {new Date(ord.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Linking Logs */}
        <div className="p-5 bg-[#121927] border border-gray-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              Log การผูกบัญชี /link ล่าสุด
            </h3>
            <Link to="/admin/security" className="text-xs text-purple-400 hover:underline flex items-center gap-1">
              ดูทั้งหมด <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="text-[10px] uppercase text-gray-400 border-b border-gray-800 bg-[#0d131f]">
                <tr>
                  <th className="py-2.5 px-3">ผู้เล่น</th>
                  <th className="py-2.5 px-3">รหัส</th>
                  <th className="py-2.5 px-3">สถานะ</th>
                  <th className="py-2.5 px-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-850">
                {recentLinking.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-800/30">
                    <td className="py-2.5 px-3 font-semibold text-white">{log.username}</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-300">{log.code}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status.includes('SUCCESS')
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 font-mono text-[11px]">{log.ipAddress || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
