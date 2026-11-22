import React, { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { User, ShieldCheck, Coins, ShoppingBag, Calendar, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMinecraftBodyUrl, getMinecraftHeadUrl } from '../utils/minecraftSkin';
import { api } from '../services/api';
import { Order } from '../types';

export const ProfilePage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (user) {
      api.getMyOrders()
        .then((res) => {
          if (res && res.orders) {
            setOrders(res.orders);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoadingOrders(false));
    }
  }, [user]);

  if (isLoading) return null;
  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* User Header Profile Card */}
      <div className="p-6 sm:p-8 bg-[#121927] border border-gray-800 rounded-3xl shadow-xl flex flex-col md:flex-row items-center gap-8">
        {/* 3D Skin Body Render */}
        <div className="flex-shrink-0 relative group">
          <div className="w-32 h-56 bg-[#090d15] border-2 border-sky-500/40 rounded-2xl flex items-center justify-center p-2 shadow-glow-sky overflow-hidden">
            <img
              src={getMinecraftBodyUrl(user.uuid || user.username, 4)}
              alt={user.username}
              className="h-full object-contain filter drop-shadow-xl pixelated group-hover:scale-110 transition-transform"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 px-2 py-0.5 bg-sky-500 text-black text-[10px] font-bold rounded-md uppercase">
            LINKED
          </div>
        </div>

        {/* User Details */}
        <div className="flex-1 text-center md:text-left space-y-3">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white">{user.username}</h1>
            <span className="px-2.5 py-0.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg text-xs font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              ผูกบัญชีเกมแล้ว
            </span>
            {user.role === 'ADMIN' && (
              <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-bold">
                ผู้ดูแลระบบ
              </span>
            )}
          </div>

          <p className="text-xs text-gray-400 font-mono">
            UUID: <span className="text-gray-300">{user.uuid || 'ไม่ได้บันทึก UUID'}</span>
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-[#0d131f] border border-gray-800 rounded-xl text-left">
              <span className="text-xs text-gray-400 block">ยอด Point ปัจจุบัน</span>
              <span className="text-lg font-black text-amber-400">
                {user.balance.toLocaleString()} P
              </span>
            </div>

            <div className="p-3 bg-[#0d131f] border border-gray-800 rounded-xl text-left">
              <span className="text-xs text-gray-400 block">ยอดใช้จ่ายสะสม</span>
              <span className="text-lg font-black text-white">
                {(user.totalSpent || 0).toLocaleString()} P
              </span>
            </div>

            <div className="p-3 bg-[#0d131f] border border-gray-800 rounded-xl text-left col-span-2 sm:col-span-1">
              <span className="text-xs text-gray-400 block">จำนวนคำสั่งซื้อ</span>
              <span className="text-lg font-black text-sky-400">
                {orders.length} รายการ
              </span>
            </div>
          </div>
        </div>

        {/* Top-up Quick Action */}
        <div className="flex-shrink-0">
          <Link
            to="/topup"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black rounded-xl shadow-lg shadow-amber-500/20 transition-transform hover:scale-105 text-sm"
          >
            <Coins className="w-4 h-4" />
            <span>เติม Point เพิ่ม</span>
          </Link>
        </div>
      </div>

      {/* Order History */}
      <div className="p-6 bg-[#121927] border border-gray-800 rounded-3xl shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-sky-400" />
          <span>ประวัติการสั่งซื้อสินค้าของคุณ</span>
        </h2>

        {loadingOrders ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-[#0d131f] rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#0e1422] text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                <tr>
                  <th className="py-3 px-4">เลขที่คำสั่งซื้อ</th>
                  <th className="py-3 px-4">สินค้า</th>
                  <th className="py-3 px-4">ราคา</th>
                  <th className="py-3 px-4">สถานะส่งของ</th>
                  <th className="py-3 px-4">วันที่ซื้อ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-850">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-800/30 transition">
                    <td className="py-3 px-4 font-mono text-gray-400">{ord.orderNumber}</td>
                    <td className="py-3 px-4">
                      {ord.items && ord.items.length > 0 ? (
                        <div>
                          <span className="font-bold text-white">
                            {ord.items.map((it) => it.productName).join(', ')}
                          </span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-amber-400">
                      {ord.totalPoints.toLocaleString()} Points
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-full text-[10px] font-bold">
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(ord.createdAt).toLocaleString('th-TH')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500 text-xs">
            คุณยังไม่มีประวัติการสั่งซื้อสินค้า
          </div>
        )}
      </div>
    </div>
  );
};
