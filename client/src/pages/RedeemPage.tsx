import React, { useState, useEffect } from 'react';
import { Gift, Sparkles, CheckCircle2, AlertCircle, Loader2, ArrowRight, Tag } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const RedeemPage: React.FC = () => {
  const { user, openLinkModal, updateBalance } = useAuth();

  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; summary?: string } | null>(null);
  const [myRedemptions, setMyRedemptions] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadRedemptions();
    }
  }, [user]);

  const loadRedemptions = async () => {
    try {
      const res = await api.getMyRedemptions();
      if (res && res.redemptions) {
        setMyRedemptions(res.redemptions);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      openLinkModal();
      return;
    }

    if (!code.trim()) {
      setResult({ success: false, message: 'กรุณากรอกโค้ดของขวัญ' });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await api.redeemCode(code.trim());
      updateBalance(res.newBalance);
      setResult({
        success: true,
        message: res.message,
        summary: res.rewardSummary,
      });
      setCode('');

      // Confetti celebration
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });

      loadRedemptions();
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'เกิดข้อผิดพลาดในการแลกโค้ด',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sampleCodes = [
    { code: 'CORARE2026', desc: 'รับฟรี 50 Points', type: 'Points' },
    { code: 'STARTERPACK', desc: 'รับเซ็ตอาวุธ & อาหารเริ่มต้นในเกม', type: 'In-Game Items' },
    { code: 'VIPFREE', desc: 'รับฟรี 100 Points (จำกัดสิทธิ์)', type: 'Points' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="w-14 h-14 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center justify-center text-sky-400 mx-auto mb-3 shadow-glow-sky">
          <Gift className="w-7 h-7" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">
          แลกรับไอเทมโค้ด
        </h1>
        <p className="text-sm text-gray-400">
          กรอกโค้ดโปรโมชันหรือโค้ดกิจกรรมจาก Discord และ Live Stream เพื่อแลกรับ Point และไอเทมพิเศษฟรี
        </p>
      </div>

      {/* Redeem Input Box */}
      <div className="p-6 sm:p-8 bg-[#121927] border border-gray-800 rounded-2xl shadow-xl space-y-6">
        <form onSubmit={handleRedeem} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 text-center">
              กรอกโค้ดของขวัญ (Redeem Code):
            </label>
            <div className="relative max-w-md mx-auto">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="เช่น CORARE2026"
                className="w-full px-5 py-4 bg-[#0d131f] border-2 border-gray-700 rounded-2xl text-center text-xl sm:text-2xl font-mono font-black text-sky-400 uppercase tracking-widest placeholder-gray-600 focus:outline-none focus:border-sky-400 transition shadow-inner"
              />
            </div>
          </div>

          {result && (
            <div
              className={`max-w-md mx-auto p-4 rounded-xl flex items-center gap-3 text-sm ${
                result.success
                  ? 'bg-sky-500/10 border border-sky-500/30 text-sky-400'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span>{result.message}</span>
            </div>
          )}

          <div className="max-w-md mx-auto">
            {!user ? (
              <button
                type="button"
                onClick={openLinkModal}
                className="w-full py-4 bg-gradient-to-r from-sky-500 to-cyan-500 text-black font-black rounded-xl shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 hover:scale-[1.01] transition"
              >
                <span>เข้าสู่ระบบก่อนแลกโค้ด</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || !code.trim()}
                className="w-full py-4 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 disabled:opacity-50 text-black font-black rounded-xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 hover:scale-[1.01] transition text-base"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    กำลังตรวจสอบโค้ด...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    แลกรับของรางวัล
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Sample Codes for easy test */}
        <div className="pt-6 border-t border-gray-800">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-3">
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>โค้ดแจกฟรีสำหรับทดสอบ (คลิกเพื่อใส่โค้ดทันที):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {sampleCodes.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setCode(item.code)}
                className="p-3 bg-[#0d131f] hover:bg-[#151e2e] border border-gray-800 hover:border-sky-500/40 rounded-xl text-left transition group"
              >
                <div className="font-mono font-bold text-sky-400 group-hover:text-sky-300 text-sm">
                  {item.code}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Redemption History */}
      {user && myRedemptions.length > 0 && (
        <div className="p-6 bg-[#121927] border border-gray-800 rounded-2xl shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white">โค้ดที่คุณเคยแลกรับแล้ว ({myRedemptions.length})</h3>
          <div className="divide-y divide-gray-800 text-xs text-gray-300">
            {myRedemptions.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sky-400">{item.code?.code}</span>
                  <span className="text-gray-400">• {item.rewardSummary}</span>
                </div>
                <span className="text-gray-500 text-[11px]">
                  {new Date(item.createdAt).toLocaleDateString('th-TH')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
