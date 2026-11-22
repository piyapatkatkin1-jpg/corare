import React, { useEffect, useState } from 'react';
import { Newspaper, Calendar, Tag, ChevronRight, X } from 'lucide-react';
import { NewsArticle } from '../types';
import { api } from '../services/api';

export const NewsPage: React.FC = () => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getNews()
      .then((res) => {
        if (res && res.news) {
          setNews(res.news);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
          <Newspaper className="w-4 h-4" />
          <span>ข่าวสารและอัปเดต</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">
          ประกาศ & กิจกรรมเซิร์ฟเวอร์
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          ติดตามข่าวสารการอัปเดตระบบ กิจกรรมแจกของ และกำหนดการปิดปรับปรุงเซิร์ฟเวอร์
        </p>
      </div>

      {/* News Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-[#121927] rounded-2xl animate-pulse border border-gray-800"></div>
          ))}
        </div>
      ) : news.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {news.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedArticle(item)}
              className="group bg-[#121927] hover:bg-[#162033] border border-gray-800 hover:border-cyan-500/40 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer"
            >
              {item.coverImage && (
                <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90 group-hover:brightness-100"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-bold backdrop-blur-md">
                      {item.category}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(item.publishedAt).toLocaleDateString('th-TH')}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs text-gray-400 line-clamp-3 leading-relaxed">
                    {item.excerpt}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs font-semibold text-cyan-400">
                  <span>อ่านรายละเอียดเพิ่มเติม</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-[#101724] border border-gray-800 rounded-2xl p-8">
          <Newspaper className="w-16 h-16 text-gray-600 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-white">ยังไม่มีข่าวสารหรือประกาศในขณะนี้</h3>
        </div>
      )}

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#141b27] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-bold">
                {selectedArticle.category}
              </span>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {selectedArticle.coverImage && (
                <img
                  src={selectedArticle.coverImage}
                  alt={selectedArticle.title}
                  className="w-full h-56 object-cover rounded-xl border border-gray-700"
                />
              )}
              <div>
                <span className="text-xs text-gray-400">
                  เผยแพร่เมื่อ: {new Date(selectedArticle.publishedAt).toLocaleString('th-TH')}
                </span>
                <h2 className="text-2xl font-black text-white mt-1">
                  {selectedArticle.title}
                </h2>
              </div>
              <div className="text-sm text-gray-300 whitespace-pre-line leading-relaxed border-t border-gray-800 pt-4">
                {selectedArticle.content}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
