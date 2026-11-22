import React, { useEffect, useState } from 'react';
import { Package, Plus, Trash2, Edit, Check, X, Server, Layers } from 'lucide-react';
import { Product, GameServer, Category } from '../../types';
import { api } from '../../services/api';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [servers, setServers] = useState<GameServer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State for New Product
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 100,
    originalPrice: '',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
    serverId: '',
    categoryId: '',
    commands: '["lp user %player% parent add vip"]',
    isFeatured: false,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, srvRes] = await Promise.all([
        api.getProducts(),
        api.getServers(),
      ]);

      if (prodRes?.products) setProducts(prodRes.products);
      if (srvRes?.servers) {
        setServers(srvRes.servers);
        if (srvRes.servers.length > 0) {
          const firstSrv = srvRes.servers[0];
          setForm((f) => ({ ...f, serverId: firstSrv.id }));
          if (firstSrv.categories && firstSrv.categories.length > 0) {
            setCategories(firstSrv.categories);
            setForm((f) => ({ ...f, categoryId: firstSrv.categories![0].id }));
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleServerChange = (serverId: string) => {
    const srv = servers.find((s) => s.id === serverId);
    const cats = srv?.categories || [];
    setCategories(cats);
    setForm({
      ...form,
      serverId,
      categoryId: cats.length > 0 ? cats[0].id : '',
    });
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.admin.createProduct(form);
      setIsAddModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการสร้างสินค้า');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบสินค้า "${name}" หรือไม่?`)) return;
    try {
      await api.admin.deleteProduct(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถลบสินค้าได้');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">จัดการสินค้าในร้านค้า</h1>
          <p className="text-xs text-gray-400 mt-1">
            เพิ่ม ลบ และกำหนดคำสั่ง Minecraft Console ที่จะรันเมื่อผู้เล่นซื้อสินค้า
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-md self-start"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มสินค้าใหม่</span>
        </button>
      </div>

      {/* Product Table */}
      <div className="bg-[#121927] border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#0e1422] text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
              <tr>
                <th className="py-3 px-4">รูปภาพ</th>
                <th className="py-3 px-4">ชื่อสินค้า</th>
                <th className="py-3 px-4">เซิร์ฟเวอร์</th>
                <th className="py-3 px-4">หมวดหมู่</th>
                <th className="py-3 px-4">ราคา (Points)</th>
                <th className="py-3 px-4">คำสั่งในเกม</th>
                <th className="py-3 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-850">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-800/30 transition">
                  <td className="py-3 px-4">
                    <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-gray-700" />
                  </td>
                  <td className="py-3 px-4 font-bold text-white">
                    {p.name}
                    {p.isFeatured && (
                      <span className="ml-2 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded">
                        HOT
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-400">{p.server?.name}</td>
                  <td className="py-3 px-4 text-emerald-400">{p.category?.name}</td>
                  <td className="py-3 px-4 font-bold text-amber-400">{p.price.toLocaleString()} P</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-gray-400 max-w-[200px] truncate" title={p.commands}>
                    {p.commands}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteProduct(p.id, p.name)}
                      className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      title="ลบสินค้า"
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

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#141b27] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white">เพิ่มสินค้าใหม่</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div>
                <label className="block font-bold text-gray-400 mb-1">ชื่อสินค้า:</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="เช่น ยศ [VIP] ถาวร"
                  className="w-full px-3 py-2 bg-[#0e1422] border border-gray-700 rounded-xl text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-400 mb-1">คำอธิบายสินค้า:</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="สิทธิประโยชน์ของสินค้า..."
                  rows={2}
                  className="w-full px-3 py-2 bg-[#0e1422] border border-gray-700 rounded-xl text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-400 mb-1">ราคา (Points):</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 bg-[#0e1422] border border-gray-700 rounded-xl text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-400 mb-1">ราคาเต็มก่อนลด (ไม่บังคับ):</label>
                  <input
                    type="number"
                    value={form.originalPrice}
                    onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                    placeholder="เช่น 150"
                    className="w-full px-3 py-2 bg-[#0e1422] border border-gray-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-400 mb-1">เลือกเซิร์ฟเวอร์:</label>
                  <select
                    value={form.serverId}
                    onChange={(e) => handleServerChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0e1422] border border-gray-700 rounded-xl text-white"
                    required
                  >
                    {servers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-400 mb-1">เลือกหมวดหมู่:</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0e1422] border border-gray-700 rounded-xl text-white"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-400 mb-1">รูปภาพสินค้า (URL):</label>
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0e1422] border border-gray-700 rounded-xl text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-400 mb-1">
                  คำสั่งคอนโซลในเกม (JSON Array, รองรับ %player% และ %uuid%):
                </label>
                <textarea
                  value={form.commands}
                  onChange={(e) => setForm({ ...form, commands: e.target.value })}
                  placeholder='["lp user %player% parent add vip", "msg %player% &aได้รับยศเรียบร้อยแล้ว"]'
                  rows={3}
                  className="w-full px-3 py-2 bg-[#0e1422] border border-gray-700 rounded-xl text-white font-mono text-xs"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={form.isFeatured}
                  onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded bg-gray-900 border-gray-700"
                />
                <label htmlFor="isFeatured" className="text-gray-300 font-semibold cursor-pointer">
                  แสดงเป็นสินค้าแนะนำ (Featured / HOT)
                </label>
              </div>

              <div className="pt-3 border-t border-gray-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-md"
                >
                  บันทึกสินค้า
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
