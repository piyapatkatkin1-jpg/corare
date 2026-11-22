import React, { useEffect, useState } from 'react';
import { Gift, Plus, Trash2, X, Tag } from 'lucide-react';
import { api } from '../../services/api';

export const AdminCodes: React.FC = () => {
  const [codes, setCodes] = useState<any[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    code: '',
    type: 'POINTS',
    pointReward: 50,
    commandReward: '',
    maxUses: 100,
    isActive: true,
  });

  const loadCodes = async () => {
    try {
      const res = await api.admin.getCodes();
      if (res?.codes) setCodes(res.codes);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCodes();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.admin.createCode(form);
      setIsAddOpen(false);
      setForm({ code: '', type: 'POINTS', pointReward: 50, commandReward: '', maxUses: 100, isActive: true });
      loadCodes();
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการสร้างโค้ด');
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`ต้องการลบโค้ด "${code}" หรือไม่?`)) return;
    try {
      await api.admin.deleteCode(id);
      loadCodes();
    } catch (err: any) {
      alert(err.message || 'ลบไม่สำเร็จ');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">จัดการโค้ดของขวัญ (Redeem)</h1>
          <p className="text-xs text-gray-400 mt-1">
            สร้างโค้ดกิจกรรมสำหรับแจก Point หรือไอเทมให้ผู้เล่น
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition shadow-md self-start"
        >
          <Plus className="w-4 h-4" />
          <span>สร้างโค้ดใหม่</span>
        </button>
      </div>

      <div className="bg-[#121927] border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#0e1422] text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
              <tr>
                <th className="py-3 px-4">โค้ด</th>
                <th className="py-3 px-4">ประเภทรางวัล</th>
                <th className="py-3 px-4">ของรางวัล</th>
                <th className="py-3 px-4">จำนวนที่ใช้ไป</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4 text-right">ลบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-850">
              {codes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-800/30">
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400">{c.code}</td>
                  <td className="py-3 px-4">{c.type}</td>
                  <td className="py-3 px-4 font-semibold text-white">
                    {c.type === 'POINTS' ? `${c.pointReward} Points` : c.commandReward}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {c.usedCount} / {c.maxUses}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {c.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(c.id, c.code)}
                      className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#141b27] border border-gray-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-4">
              <h3 className="text-base font-bold text-white">สร้างโค้ดของขวัญใหม่</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-400 mb-1">โค้ด (พิมพ์ใหญ่):</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="เช่น NEWYEAR2026"
                  className="w-full px-3 py-2 bg-[#0e1422] border border-gray-700 rounded-xl text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-400 mb-1">ประเภทของรางวัล:</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0e1422] border border-gray-700 rounded-xl text-white"
                >
                  <option value="POINTS">แต้ม Point</option>
                  <option value="COMMAND">คำสั่งในเกม (In-Game Commands)</option>
                </select>
              </div>

              {form.type === 'POINTS' ? (
                <div>
                  <label className="block font-bold text-gray-400 mb-1">จำนวน Point:</label>
                  <input
                    type="number"
                    value={form.pointReward}
                    onChange={(e) => setForm({ ...form, pointReward: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 bg-[#0e1422] border border-gray-700 rounded-xl text-white"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-gray-400 mb-1">คำสั่งไอเทม (JSON Array):</label>
                  <textarea
                    value={form.commandReward}
                    onChange={(e) => setForm({ ...form, commandReward: e.target.value })}
                    placeholder='["give %player% diamond 10"]'
                    rows={2}
                    className="w-full px-3 py-2 bg-[#0e1422] border border-gray-700 rounded-xl text-white font-mono"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-400 mb-1">จำกัดสิทธิ์ผู้ใช้ทั้งหมด (Max Uses):</label>
                <input
                  type="number"
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: parseInt(e.target.value, 10) || 1 })}
                  className="w-full px-3 py-2 bg-[#0e1422] border border-gray-700 rounded-xl text-white"
                  required
                />
              </div>

              <div className="pt-3 border-t border-gray-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-gray-800 text-white rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl"
                >
                  บันทึกโค้ด
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
