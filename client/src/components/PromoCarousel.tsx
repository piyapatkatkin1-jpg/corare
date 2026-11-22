import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { Promotion } from '../types';
import { api } from '../services/api';

export const PromoCarousel: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    api.getPromotions()
      .then((res) => {
        if (res && res.promotions && res.promotions.length > 0) {
          setPromotions(res.promotions);
        }
      })
      .catch((err) => console.error('Error fetching promotions:', err));
  }, []);

  useEffect(() => {
    if (promotions.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [promotions.length]);

  if (promotions.length === 0) return null;

  const current = promotions[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + promotions.length) % promotions.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % promotions.length);
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-gray-800 shadow-2xl bg-[#121927]">
      {/* Background Banner Image with Gradient Overlay */}
      <div className="relative h-[280px] sm:h-[360px] md:h-[420px] w-full overflow-hidden">
        <img
          src={current.image}
          alt={current.title}
          className="w-full h-full object-cover object-center filter brightness-50 transition-all duration-700 transform scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1422] via-[#0e1422]/60 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e1422] via-[#0e1422]/40 to-transparent"></div>

        {/* Content */}
        <div className="absolute inset-0 p-6 sm:p-10 md:p-14 flex flex-col justify-end max-w-2xl">
          {current.badge && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-xs font-black uppercase tracking-wider rounded-lg shadow-glow-gold mb-3 self-start">
              <Sparkles className="w-3.5 h-3.5 fill-black" />
              <span>{current.badge}</span>
            </div>
          )}

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight drop-shadow-md">
            {current.title}
          </h2>

          {current.subtitle && (
            <p className="mt-2 text-sm sm:text-base text-gray-300 line-clamp-2 max-w-xl">
              {current.subtitle}
            </p>
          )}

          <div className="mt-5 flex items-center gap-3">
            <Link
              to={current.link || '/store'}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-black font-black rounded-xl shadow-lg shadow-sky-500/25 transition-transform hover:scale-105 text-sm"
            >
              <span>ดูรายละเอียดสินค้า</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Navigation Arrows */}
        {promotions.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm transition border border-white/10"
              aria-label="Previous Promo"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm transition border border-white/10"
              aria-label="Next Promo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Indicators */}
        {promotions.length > 1 && (
          <div className="absolute bottom-4 right-6 flex items-center space-x-2">
            {promotions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex ? 'w-6 bg-sky-400' : 'w-2 bg-gray-600 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
