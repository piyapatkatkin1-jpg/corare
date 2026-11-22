import React, { useState } from 'react';
import { X, Coins, ShieldCheck, AlertCircle, Loader2, ArrowRight, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

interface BuyModalProps {
  product: Product | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BuyModal: React.FC<BuyModalProps> = ({ product, onClose, onSuccess }) => {
  const { user, openLinkModal, updateBalance } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ message: string; remainingBalance: number } | null>(null);

  if (!product) return null;

  const userBalance = user?.balance || 0;
  const isSufficient = user ? userBalance >= product.price : false;
  const shortfall = product.price - userBalance;

  let commandsList: string[] = [];
  try {
    commandsList = JSON.parse(product.commands);
  } catch {
    commandsList = product.commands ? [product.commands] : [];
  }

  const handleConfirmPurchase = async () => {
    if (!user) {
      onClose();
      openLinkModal();
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await api.purchaseProduct(product.id);
      updateBalance(res.remainingBalance);
      setSuccessData({
        message: res.message,
        remainingBalance: res.remainingBalance,
      });

      // Confetti celebration
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการสั่งซื้อ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#141b27] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Glow Top Border */}
        <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-teal-300 to-cyan-400"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h3 className="text-xl font-bold text-white">ยืนยันคำสั่งซื้อ</h3>
            <p className="text-xs text-gray-400">ตรวจสอบรายละเอียดและส่งไอเทมเข้าเกมทันที</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {successData ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-20 h-20 bg-sky-500/20 border-2 border-sky-500 rounded-full flex items-center justify-center mx-auto text-sky-400 animate-bounce">
                <Check className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-2xl font-bold text-white">สั่งซื้อสำเร็จ!</h4>
                <p className="text-sm text-gray-300 mt-2 max-w-sm mx-auto">{successData.message}</p>
              </div>
              <div className="p-3.5 bg-[#0e1422] border border-gray-800 rounded-xl inline-block text-xs text-gray-300">
                ยอด Point คงเหลือของคุณ:{' '}
                <span className="font-bold text-sky-400 text-sm">
                  {successData.remainingBalance.toLocaleString()} Points
                </span>
              </div>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-black font-black rounded-xl transition shadow-lg shadow-sky-500/20"
                >
                  เรียบร้อย
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {error && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Product Info Card */}
              <div className="flex items-center gap-4 p-4 bg-[#0e1422] border border-gray-800 rounded-xl">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-16 h-16 rounded-xl object-cover border border-gray-700 flex-shrink-0 shadow-md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {product.server && (
                      <span className="text-[10px] px-2 py-0.5 bg-gray-800 text-gray-300 rounded font-semibold">
                        {product.server.name}
                      </span>
                    )}
                    {product.category && (
                      <span className="text-[10px] px-2 py-0.5 bg-sky-500/20 text-sky-400 rounded font-semibold">
                        {product.category.name}
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-bold text-white truncate">{product.name}</h4>
                  <p className="text-xs text-gray-400 line-clamp-1">{product.description}</p>
                </div>
              </div>

              {/* Price & Balance Calculation */}
              <div className="space-y-2 bg-[#0e1422] p-4 border border-gray-800 rounded-xl text-sm">
                <div className="flex justify-between items-center text-gray-400">
                  <span>ราคาสินค้า:</span>
                  <span className="font-bold text-amber-400 text-base">
                    {product.price.toLocaleString()} Points
                  </span>
                </div>

                <div className="flex justify-between items-center text-gray-400">
                  <span>ยอด Point ปัจจุบันของคุณ:</span>
                  <span className="font-medium text-white">
                    {user ? `${userBalance.toLocaleString()} Points` : 'ยังไม่ได้เข้าสู่ระบบ'}
                  </span>
                </div>

                {user && (
                  <div className="border-t border-gray-800 pt-2 flex justify-between items-center">
                    <span className="text-gray-300">ยอด Point หลังสั่งซื้อ:</span>
                    <span
                      className={`font-bold ${
                        isSufficient ? 'text-sky-400' : 'text-red-400'
                      }`}
                    >
                      {isSufficient
                        ? `${(userBalance - product.price).toLocaleString()} Points`
                        : 'ยอดไม่พอ'}
                    </span>
                  </div>
                )}
              </div>

              {/* Minecraft target receiver */}
              {user && (
                <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                    <span className="text-gray-300">
                      ส่งไอเทมเข้าตัวละคร:{' '}
                      <span className="font-bold text-sky-400">{user.username}</span>
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500">อัตโนมัติ</span>
                </div>
              )}

              {/* Action Buttons */}
              {!user ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openLinkModal();
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-cyan-500 text-black font-black rounded-xl shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 transition hover:scale-[1.02]"
                >
                  เข้าสู่ระบบเพื่อสั่งซื้อ
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : isSufficient ? (
                <button
                  type="button"
                  onClick={handleConfirmPurchase}
                  disabled={isLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-black font-black rounded-xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      กำลังประมวลผลคำสั่งซื้อ...
                    </>
                  ) : (
                    <>
                      <Coins className="w-5 h-5 text-amber-900" />
                      ยืนยันการซื้อด้วย Point
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>
                      คุณขาดอีก <b>{shortfall.toLocaleString()} Points</b> เพื่อซื้อสินค้านี้
                    </span>
                  </div>
                  <Link
                    to="/topup"
                    onClick={onClose}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition"
                  >
                    <Coins className="w-4 h-4" />
                    เติมเงินทันที (TrueMoney Wallet)
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
