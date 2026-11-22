import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Sparkles, Shield, Zap, Users, ArrowRight, MessageSquare } from 'lucide-react';
import { PromoCarousel } from '../components/PromoCarousel';
import { RecentBuyers } from '../components/RecentBuyers';
import { ServerSelector } from '../components/ServerSelector';
import { ProductCard } from '../components/ProductCard';
import { GameServer, Product } from '../types';
import { api } from '../services/api';

export const HomePage: React.FC = () => {
  const [servers, setServers] = useState<GameServer[]>([]);
  const [activeServer, setActiveServer] = useState<GameServer | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [serversRes, productsRes] = await Promise.all([
          api.getServers(),
          api.getProducts({ featured: true }),
        ]);

        if (serversRes && serversRes.servers.length > 0) {
          setServers(serversRes.servers);
          setActiveServer(serversRes.servers[0]);
        }

        if (productsRes && productsRes.products) {
          setFeaturedProducts(productsRes.products);
        }
      } catch (err) {
        console.error('Error fetching homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = activeServer
    ? featuredProducts.filter((p) => p.serverId === activeServer.id)
    : featuredProducts;

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Hero Promotional Carousel */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <PromoCarousel />
      </section>

      {/* 2. Real-time Recent Buyers Feed */}
      <RecentBuyers />

      {/* 3. Server-based Shop Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>สินค้าแนะนำตามเซิร์ฟเวอร์</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              ร้านค้าแยกโหมดเกม
            </h2>
          </div>

          {/* Server Switcher */}
          {servers.length > 0 && (
            <ServerSelector
              servers={servers}
              activeServer={activeServer}
              onSelectServer={(srv) => setActiveServer(srv)}
            />
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-72 bg-[#131b29] rounded-2xl animate-pulse border border-gray-800"></div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center bg-[#101724] border border-gray-800 rounded-2xl p-8">
            <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-300">ยังไม่มีสินค้าแนะนำในเซิร์ฟเวอร์นี้</h3>
            <p className="text-xs text-gray-500 mt-1">คุณสามารถเลือกดูสินค้าทั้งหมดในหน้าร้านค้าได้</p>
            <Link
              to="/store"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-cyan-500 text-black font-bold rounded-xl text-sm hover:scale-105 transition"
            >
              ไปที่หน้าร้านค้า
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/store"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#131b29] hover:bg-[#192437] border border-gray-700 hover:border-sky-500/50 text-white font-bold rounded-xl transition shadow-md"
          >
            <span>ดูสินค้าทั้งหมดในร้านค้า</span>
            <ArrowRight className="w-4 h-4 text-sky-400" />
          </Link>
        </div>
      </section>

      {/* 4. Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            ทำไมต้องเล่นที่ <span className="text-sky-400">corarevanilla?</span>
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            ระบบเซิร์ฟเวอร์ที่ออกแบบมาเพื่อมอบประสบการณ์การเล่นเกมที่ดีที่สุดให้แก่ผู้เล่นทุกคน
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-[#121927] border border-gray-800 hover:border-sky-500/40 rounded-2xl transition">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">ส่งไอเทมเข้าเกมทันที</h3>
            <p className="mt-2 text-xs text-gray-400 leading-relaxed">
              เมื่อทำรายการซื้อผ่านหน้าเว็บ ระบบคำสั่งจะส่งยศ ไอเทม หรือกุญแจเข้าตัวละครของคุณในเกมโดยอัตโนมัติไม่ต้องรอแอดมิน
            </p>
          </div>

          <div className="p-6 bg-[#121927] border border-gray-800 hover:border-amber-500/40 rounded-2xl transition">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">ผูกบัญชีเกม ปลอดภัย 100%</h3>
            <p className="mt-2 text-xs text-gray-400 leading-relaxed">
              ระบบยืนยันตัวตนด้วยคำสั่ง /link ภายในเกมโดยตรง ไม่ต้องกรอกรหัสผ่าน ป้องกันการสวมรอยและการแฮกบัญชีได้อย่างสมบูรณ์แบบ
            </p>
          </div>

          <div className="p-6 bg-[#121927] border border-gray-800 hover:border-cyan-500/40 rounded-2xl transition">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">คอมมูนิตี้ที่เหนียวแน่น</h3>
            <p className="mt-2 text-xs text-gray-400 leading-relaxed">
              มีกิจกรรมประจำสัปดาห์ การแข่งขันตีบอส และการอัปเดตอย่างต่อเนื่อง พร้อมทีมงานคอยดูแลและช่วยเหลือตลอด 24 ชั่วโมง
            </p>
          </div>
        </div>
      </section>

      {/* 5. Discord CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl p-8 sm:p-12 overflow-hidden bg-gradient-to-r from-[#20264a] via-[#151c36] to-[#0c1224] border border-[#5865F2]/40 shadow-2xl">
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#5865F2]/20 text-[#7289da] border border-[#5865F2]/30 rounded-xl text-xs font-bold uppercase mb-4">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>DISCORD COMMUNITY</span>
            </div>
            <h3 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              เข้าร่วมกลุ่มพูดคุย Discord กับเพื่อนๆ ผู้เล่น!
            </h3>
            <p className="mt-3 text-sm text-gray-300">
              รับการแจ้งเตือนโค้ดของขวัญฟรี กิจกรรมแจก Point ข่าวสารอัปเดตก่อนใคร และพูดคุยแลกเปลี่ยนไอเทมกับผู้เล่นกว่า 5,000 คน
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <a
                href="https://discord.gg/corarevanilla"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold rounded-xl shadow-lg shadow-[#5865F2]/30 transition-transform hover:scale-105 text-sm"
              >
                <MessageSquare className="w-5 h-5" />
                <span>เข้าร่วม Discord ตอนนี้</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
