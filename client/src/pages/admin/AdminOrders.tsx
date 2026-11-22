import React, { useEffect, useState } from 'react';
import { ShoppingCart, Coins, Search, Filter } from 'lucide-react';
import { api } from '../../services/api';

export const AdminOrders: React.FC = () => {
  const [tab, setTab] = useState<'ORDERS' | 'TOPUPS'>('ORDERS');
  const [orders, setOrders] = useState<any[]>([]);
  const [topups, setTopups] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'ORDERS') {
        const res = await api.admin.getAllOrders(search);
        if (res?.orders) setOrders(res.orders);
      } else {
        const res = await api.admin.getAllTopups(search);
        if (res?.transactions) setTopups(res.transactions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">คำสั่งซื้อ & ประวัติเติมเงิน</h1>
          <p className="text-xs text-gray-400 mt-1">
            ตรวจสอบรายการซื้อไอเทม ยอดเติมเงิน และสถานะการชำระเงินของลูกค้า
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-[#121927] border border-gray-800 rounded-xl self-start">
          <button
            onClick={() => setTab('ORDERS')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              tab === 'ORDERS' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            คำสั่งซื้อสินค้า ({orders.length})
          </button>
          <button
            onClick={() => setTab('TOPUPS')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              tab === 'TOPUPS' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            ประวัติการเติมเงิน ({topups.length})
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อผู้เล่น หรือเลขออเดอร์..."
          className="w-full pl-9 pr-4 py-2 bg-[#121927] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Table */}
      <div className="bg-[#121927] border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
        {tab === 'ORDERS' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#0e1422] text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                <tr>
                  <th className="py-3 px-4">เลขที่ออเดอร์</th>
                  <th className="py-3 px-4">ชื่อผู้เล่น</th>
                  <th className="py-3 px-4">รายการสินค้า</th>
                  <th className="py-3 px-4">ราคารวม</th>
                  <th className="py-3 px-4">สถานะ</th>
                  <th className="py-3 px-4">เวลาสั่งซื้อ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-850">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-800/30">
                    <td className="py-3 px-4 font-mono text-gray-400">{ord.orderNumber}</td>
                    <td className="py-3 px-4 font-bold text-white">{ord.user?.username}</td>
                    <td className="py-3 px-4 text-emerald-400">
                      {ord.items?.map((it: any) => it.productName).join(', ')}
                    </td>
                    <td className="py-3 px-4 font-bold text-amber-400">{ord.totalPoints} P</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-bold">
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#0e1422] text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                <tr>
                  <th className="py-3 px-4">รหัสธุรกรรม</th>
                  <th className="py-3 px-4">ผู้เล่น</th>
                  <th className="py-3 px-4">ช่องทาง</th>
                  <th className="py-3 px-4">จำนวนเงิน</th>
                  <th className="py-3 px-4">Point ที่เติม</th>
                  <th className="py-3 px-4">สถานะ</th>
                  <th className="py-3 px-4">เวลา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-850">
                {topups.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-800/30">
                    <td className="py-3 px-4 font-mono text-gray-400">{tx.transactionId}</td>
                    <td className="py-3 px-4 font-bold text-white">{tx.user?.username}</td>
                    <td className="py-3 px-4">{tx.method}</td>
                    <td className="py-3 px-4 font-bold text-white">฿{tx.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 font-bold text-amber-400">+{tx.pointsCredited} P</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === 'SUCCESS'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(tx.createdAt).toLocaleString('th-TH')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
