import React, { useState } from 'react';
import { ShoppingCart, Sparkles, Tag, Eye } from 'lucide-react';
import { Product } from '../types';
import { BuyModal } from './BuyModal';

interface ProductCardProps {
  product: Product;
  onPurchaseSuccess?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPurchaseSuccess }) => {
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

  // Calculate discount percentage if original price is set
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  return (
    <>
      <div className="group relative bg-[#0d1627] hover:bg-[#121e35] border border-gray-800 hover:border-sky-500/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-glow-sky transition-all duration-300 flex flex-col justify-between">
        {/* Top Badges & Image Preview */}
        <div className="relative aspect-video w-full overflow-hidden bg-black/40">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 filter brightness-90 group-hover:brightness-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1627] via-transparent to-transparent"></div>

          {/* Badges on Image */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
            {product.isFeatured && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[10px] font-black uppercase rounded-lg shadow-sm">
                <Sparkles className="w-3 h-3 fill-black" />
                HOT
              </span>
            )}
            {discountPercent && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-lg shadow-sm">
                -{discountPercent}%
              </span>
            )}
          </div>

          {/* Category pill */}
          {product.category && (
            <div className="absolute bottom-2 left-3">
              <span className="text-[11px] px-2.5 py-0.5 bg-black/70 backdrop-blur-md text-sky-400 border border-sky-500/30 rounded-lg font-medium">
                {product.category.name}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-sky-400 transition-colors line-clamp-1">
              {product.name}
            </h3>
            <p className="mt-1 text-xs text-gray-400 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Price & Buy Button */}
          <div className="mt-5 pt-3 border-t border-gray-800/80 flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-amber-400">
                  {product.price.toLocaleString()}
                </span>
                <span className="text-xs text-gray-400 font-medium">Points</span>
              </div>
              {product.originalPrice && (
                <span className="text-xs text-gray-400 line-through -mt-1 block">
                  {product.originalPrice.toLocaleString()} P
                </span>
              )}
            </div>

            <button
              onClick={() => setIsBuyModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-black text-xs sm:text-sm font-black rounded-xl shadow-md shadow-sky-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>สั่งซื้อ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Buy Confirmation Modal */}
      {isBuyModalOpen && (
        <BuyModal
          product={product}
          onClose={() => setIsBuyModalOpen(false)}
          onSuccess={onPurchaseSuccess}
        />
      )}
    </>
  );
};
