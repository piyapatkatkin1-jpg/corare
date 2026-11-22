import React, { useEffect, useState } from 'react';
import { ShoppingBag, Sparkles, Clock } from 'lucide-react';
import { RecentPurchase } from '../types';
import { api } from '../services/api';
import { getMinecraftHeadUrl } from '../utils/minecraftSkin';

export const RecentBuyers: React.FC = () => {
  const [purchases, setPurchases] = useState<RecentPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecent = async () => {
    try {
      const res = await api.getRecentPurchases();
      if (res && res.recent) {
        setPurchases(res.recent);
      }
    } catch (err) {
      console.error('Error fetching recent purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecent();
    const interval = setInterval(fetchRecent, 12000); // Refresh every 12s
    return () => clearInterval(interval);
  }, []);

  if (loading && purchases.length === 0) return null;
  if (purchases.length === 0) return null;

  return (
    <div className="w-full bg-[#0c121e] border-y border-gray-800/80 py-3 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-3">
        {/* Label */}
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          <span>ผู้สนับสนุนล่าสุด</span>
        </div>

        {/* Scrollable list */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
          {purchases.map((item) => (
            <div
              key={item.id}
              className="flex-shrink-0 flex items-center gap-2.5 px-3 py-1.5 bg-[#141b29] hover:bg-[#1a2335] border border-gray-800 rounded-xl transition group shadow-sm"
            >
              <img
                src={getMinecraftHeadUrl(item.uuid || item.username, 28)}
                alt={item.username}
                className="w-7 h-7 rounded-lg border border-sky-500/40 bg-black/40 pixelated flex-shrink-0"
              />
              <div className="text-left text-xs leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white group-hover:text-sky-400 transition">
                    {item.username}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-gray-800 text-gray-400 rounded">
                    {item.serverName}
                  </span>
                </div>
                <div className="text-gray-400 flex items-center gap-1 mt-0.5">
                  <span className="text-sky-400 font-medium truncate max-w-[140px]">
                    {item.productName}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-amber-400 font-bold">{item.price} P</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
