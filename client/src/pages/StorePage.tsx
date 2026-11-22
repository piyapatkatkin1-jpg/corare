import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ShoppingBag, Filter, Sparkles } from 'lucide-react';
import { GameServer, Category, Product } from '../types';
import { ServerSelector } from '../components/ServerSelector';
import { ProductCard } from '../components/ProductCard';
import { api } from '../services/api';

export const StorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const serverSlugParam = searchParams.get('server');

  const [servers, setServers] = useState<GameServer[]>([]);
  const [activeServer, setActiveServer] = useState<GameServer | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [loading, setLoading] = useState(true);

  // Load servers
  useEffect(() => {
    api.getServers()
      .then((res) => {
        if (res && res.servers && res.servers.length > 0) {
          setServers(res.servers);
          // Match slug if provided in URL, else first server
          const matched = serverSlugParam
            ? res.servers.find((s) => s.slug === serverSlugParam)
            : res.servers[0];
          setActiveServer(matched || res.servers[0]);
        }
      })
      .catch((err) => console.error(err));
  }, [serverSlugParam]);

  // When activeServer changes, update categories & load products
  useEffect(() => {
    if (!activeServer) return;

    setLoading(true);
    setActiveCategoryId('all');

    // Fetch server with its categories
    api.getServerBySlug(activeServer.slug)
      .then((res) => {
        if (res && res.server) {
          setCategories(res.server.categories || []);
        }
      })
      .catch((err) => console.error(err));

    // Fetch products for this server
    api.getProducts({ serverId: activeServer.id })
      .then((res) => {
        if (res && res.products) {
          setProducts(res.products);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [activeServer]);

  const handleSelectServer = (server: GameServer) => {
    setActiveServer(server);
    setSearchParams({ server: server.slug });
  };

  // Filter products by category and search
  const filteredProducts = products.filter((item) => {
    const matchesCategory = activeCategoryId === 'all' || item.categoryId === activeCategoryId;
    const matchesSearch =
      searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
          <ShoppingBag className="w-4 h-4" />
          <span>ร้านค้าเซิร์ฟเวอร์</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">
          เลือกซื้อสินค้า & ยศพิเศษ
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          ไอเทม ยศสนับสนุน และกุญแจกล่องสุ่ม ส่งเข้าเกมทันทีหลังจากสั่งซื้อสำเร็จ
        </p>
      </div>

      {/* Server Selector */}
      {servers.length > 0 && (
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
            เลือกเซิร์ฟเวอร์ / โหมดเกม:
          </label>
          <ServerSelector
            servers={servers}
            activeServer={activeServer}
            onSelectServer={handleSelectServer}
          />
        </div>
      )}

      {/* Category Pills & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-gray-800">
        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setActiveCategoryId('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition ${
              activeCategoryId === 'all'
                ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-black font-bold shadow-glow-sky'
                : 'bg-[#121927] hover:bg-[#182336] text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            ทั้งหมด ({products.length})
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition ${
                activeCategoryId === cat.id
                  ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-black font-bold shadow-glow-sky'
                  : 'bg-[#121927] hover:bg-[#182336] text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อสินค้า..."
              className="w-full pl-9 pr-4 py-2 bg-[#121927] border border-gray-800 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-sky-400 transition"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-[#121927] border border-gray-800 rounded-xl text-xs sm:text-sm text-gray-300 focus:outline-none focus:border-sky-400 transition"
          >
            <option value="featured">สินค้าแนะนำ</option>
            <option value="price-asc">ราคา: น้อย ➔ มาก</option>
            <option value="price-desc">ราคา: มาก ➔ น้อย</option>
          </select>
        </div>
      </div>

      {/* Product List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 bg-[#131b29] rounded-2xl animate-pulse border border-gray-800"></div>
          ))}
        </div>
      ) : sortedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onPurchaseSuccess={() => {
                // Refresh list if needed
              }}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-[#101724] border border-gray-800 rounded-2xl p-8">
          <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-white">ไม่พบสินค้าที่ตรงกับการค้นหา</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
            ลองเปลี่ยนหมวดหมู่หรือคำค้นหาเพื่อค้นหาสินค้าอื่น
          </p>
        </div>
      )}
    </div>
  );
};
