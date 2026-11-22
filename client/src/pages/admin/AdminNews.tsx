import React, { useEffect, useState } from 'react';
import { Newspaper, Sparkles, Plus, Trash2, X } from 'lucide-react';
import { api } from '../../services/api';

export const AdminNews: React.FC = () => {
  const [news, setNews] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [isAddNewsOpen, setIsAddNewsOpen] = useState(false);
  const [isAddPromoOpen, setIsAddPromoOpen] = useState(false);

  const [newsForm, setNewsForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'อัปเดต',
    coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
  });

  const [promoForm, setPromoForm] = useState({
    title: '',
    subtitle: '',
    badge: 'HOT SALE',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    link: '/store',
    isActive: true,
  });

  const loadData = async () => {
    try {
      const [nRes, pRes] = await Promise.all([
        api.getNews(),
        api.admin.getPromotions(),
      ]);
      if (nRes?.news) setNews(nRes.news);
      if (pRes?.promotions) setPromos(pRes.promotions);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.admin.createNews(newsForm);
      setIsAddNewsOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.admin.createPromotion(promoForm);
      setIsAddPromoOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm('ต้องการลบข่าวนี้หรือไม่?')) return;
    await api.admin.deleteNews(id);
    loadData();
  };

  const handleDeletePromo = async (id: string) => {
    if (!confirm('ต้องการลบแบนเนอร์โปรโมชันนี้หรือไม่?')) return;
    await api.admin.deletePromotion(id);
    loadData();
  };

  return (
    <div className="space-y-8">
      {/* Promotions Manager */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              แบนเนอร์โปรโมชันหน้าแรก (Carousel)
            </h2>
            <p className="text-xs text-gray-400">ควบคุมแบนเนอร์ภาพสไลด์และส่วนลดที่แสดงบนหน้าแรก</p>
          </div>
          <button
            onClick={() => setIsAddPromoOpen(true)}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            เพิ่มโปรโมชัน
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promos.map((p) => (
            <div key={p.id} className="p-4 bg-[#121927] border border-gray-800 rounded-2xl flex items-center justify-between gap-4">
              <img src={p.image} alt={p.title} className="w-20 h-14 rounded-lg object-cover border border-gray-700" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded font-bold">
                  {p.badge}
                </span>
                <h4 className="text-sm font-bold text-white truncate mt-1">{p.title}</h4>
                <p className="text-[11px] text-gray-500 truncate">{p.link}</p>
              </div>
              <button
                onClick={() => handleDeletePromo(p.id)}
                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* News Manager */}
      <div className="space-y-4 pt-6 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-cyan-400" />
              บทความข่าวสาร & ประกาศ
            </h2>
            <p className="text-xs text-gray-400">จัดการโพสต์ข่าวสารในหน้า /news</p>
          </div>
          <button
            onClick={() => setIsAddNewsOpen(true)}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            เขียนข่าวใหม่
          </button>
        </div>

        <div className="divide-y divide-gray-800 bg-[#121927] border border-gray-800 rounded-2xl overflow-hidden">
          {news.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded font-bold flex-shrink-0">
                  {item.category}
                </span>
                <div className="truncate">
                  <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                  <p className="text-xs text-gray-500 truncate">{item.excerpt}</p>
                </div>
              </div>
              <button
                onClick={() => handleDeleteNews(item.id)}
                className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add News Modal */}
      {isAddNewsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#141b27] border border-gray-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
              <h3 className="text-base font-bold text-white">เขียนข่าวสาร / ประกาศใหม่</h3>
              <button onClick={() => setIsAddNewsOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNews} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-400 mb-1">หัวข้อข่าว:</label>
                <input
                  type="text"
                  value={newsForm.title}
                  onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0e1422] border border-gray-700 rounded-xl text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-400 mb-1">หมวดหมู่:</label>
                <select
                  value={newsForm.category}
                  onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0e1422] border border-gray-700 rounded-xl text-white"
                >
                  <option value="อัปเดต">อัปเดต</option>
                  <option value="กิจกรรม">กิจกรรม</option>
                  <option value="ประกาศ">ประกาศ</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-400 mb-1">เนื้อหาย่อ (Excerpt):</label>
                <input
                  type="text"
                  value={newsForm.excerpt}
                  onChange={(e) => setNewsForm({ ...newsForm, excerpt: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0e1422] border border-gray-700 rounded-xl text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-400 mb-1">เนื้อหาเต็ม (Content):</label>
                <textarea
                  value={newsForm.content}
                  onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-[#0e1422] border border-gray-700 rounded-xl text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-400 mb-1">รูปภาพหน้าปก (URL):</label>
                <input
                  type="text"
                  value={newsForm.coverImage}
                  onChange={(e) => setNewsForm({ ...newsForm, coverImage: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0e1422] border border-gray-700 rounded-xl text-white"
                />
              </div>

              <div className="pt-3 border-t border-gray-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddNewsOpen(false)}
                  className="px-4 py-2 bg-gray-800 text-white rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl"
                >
                  เผยแพร่ข่าว
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Promo Modal */}
      {isAddPromoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#141b27] border border-gray-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
              <h3 className="text-base font-bold text-white">เพิ่มแบนเนอร์โปรโมชัน</h3>
              <button onClick={() => setIsAddPromoOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePromo} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-400 mb-1">หัวข้อโปรโมชัน:</label>
                <input
                  type="text"
                  value={promoForm.title}
                  onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                  placeholder="เช่น ต้อนรับเทศกาลปีใหม่ ลดราคาทุกยศ 25%!"
                  className="w-full px-3 py-2 bg-[#0e1422] border border-gray-700 rounded-xl text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-400 mb-1">คำบรรยาย:</label>
                <input
                  type="text"
                  value={promoForm.subtitle}
                  onChange={(e) => setPromoForm({ ...promoForm, subtitle: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0e1422] border border-gray-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-400 mb-1">ป้ายกำกับ (Badge):</label>
                <input
                  type="text"
                  value={promoForm.badge}
                  onChange={(e) => setPromoForm({ ...promoForm, badge: e.target.value })}
                  placeholder="เช่น SALE 25%, HOT, SPECIAL"
                  className="w-full px-3 py-2 bg-[#0e1422] border border-gray-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-400 mb-1">ลิงก์เมื่อคลิก:</label>
                <input
                  type="text"
                  value={promoForm.link}
                  onChange={(e) => setPromoForm({ ...promoForm, link: e.target.value })}
                  placeholder="/store?server=mmo"
                  className="w-full px-3 py-2 bg-[#0e1422] border border-gray-700 rounded-xl text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-400 mb-1">รูปภาพแบนเนอร์ (URL):</label>
                <input
                  type="text"
                  value={promoForm.image}
                  onChange={(e) => setPromoForm({ ...promoForm, image: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0e1422] border border-gray-700 rounded-xl text-white"
                  required
                />
              </div>

              <div className="pt-3 border-t border-gray-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPromoOpen(false)}
                  className="px-4 py-2 bg-gray-800 text-white rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl"
                >
                  บันทึกแบนเนอร์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
