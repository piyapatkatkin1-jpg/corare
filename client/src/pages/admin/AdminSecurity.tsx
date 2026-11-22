import React, { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, Search, Lock, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { LinkLog } from '../../types';

export const AdminSecurity: React.FC = () => {
  const [logs, setLogs] = useState<LinkLog[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getLinkingLogs(search);
      if (res?.logs) setLogs(res.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">ความปลอดภัย & Log การผูกบัญชี</h1>
        <p className="text-xs text-gray-400 mt-1">
          บันทึกการทำงานของคำสั่ง /link ตรวจจับการลองสุ่มรหัส (Brute Force) และการพยายามสวมรอยตัวละคร
        </p>
      </div>

      {/* Security Policies Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-[#121927] border border-emerald-500/30 rounded-2xl space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Cryptographic Random PRNG</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            รหัส 5 หลักสุ่มด้วย Node.js Crypto ไม่ใช่ Math.random() ป้องกันการทำนายรหัสล่วงหน้าได้อย่างสมบูรณ์
          </p>
        </div>

        <div className="p-4 bg-[#121927] border border-purple-500/30 rounded-2xl space-y-1">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
            <Lock className="w-4 h-4" />
            <span>Strict Timeout & Single-Use</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            รหัสมีอายุเพียง 5 นาที และถูกทำลายทันทีที่ใช้งานสำเร็จ ไม่สามารถนำรหัสเก่ามาใช้ซ้ำได้
          </p>
        </div>

        <div className="p-4 bg-[#121927] border border-amber-500/30 rounded-2xl space-y-1">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>Anti Brute-Force Rate Limit</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            หากลองรหัสผิดเกิน 5 ครั้ง รหัสนั้นจะถูกยกเลิกทันที และจำกัดการขอรหัสไม่เกิน 8 ครั้งต่อ 5 นาที
          </p>
        </div>
      </div>

      {/* Search and Refresh */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อผู้เล่น, รหัส, หรือ IP..."
            className="w-full pl-9 pr-4 py-2 bg-[#121927] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <button
          onClick={loadLogs}
          className="p-2 bg-[#121927] hover:bg-gray-800 border border-gray-800 rounded-xl text-gray-400 hover:text-white transition"
          title="รีเฟรชข้อมูล"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-[#121927] border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#0e1422] text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
              <tr>
                <th className="py-3 px-4">เวลา</th>
                <th className="py-3 px-4">ชื่อผู้เล่น (Username)</th>
                <th className="py-3 px-4">UUID ในเกม</th>
                <th className="py-3 px-4">รหัสที่ลอง</th>
                <th className="py-3 px-4">สถานะผลลัพธ์</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">เซิร์ฟเวอร์</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-850">
              {logs.map((log) => {
                const isSuccess = log.status.includes('SUCCESS');
                return (
                  <tr key={log.id} className="hover:bg-gray-800/30 transition">
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(log.createdAt).toLocaleString('th-TH')}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{log.username}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-gray-400 truncate max-w-[140px]">
                      {log.uuid || '-'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-300">{log.code}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isSuccess
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-400 text-[11px]">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="py-3 px-4 text-gray-400">{log.serverIdentifier || 'Minecraft'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
