import React, { useState, useEffect } from 'react';
import {
  Coins,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TopupPackage, TopupTransaction } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const TopupPage: React.FC = () => {
  const { user, openLinkModal, updateBalance } = useAuth();

  const [packages, setPackages] = useState<TopupPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<TopupPackage | null>(null);
  const [voucherUrl, setVoucherUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ success: boolean; message: string } | null>(null);
  const [history, setHistory] = useState<TopupTransaction[]>([]);
  const [activeTab, setActiveTab] = useState<'TOPUP' | 'HISTORY'>('TOPUP');

  useEffect(() => {
    api.getTopupPackages()
      .then((res) => {
        if (res && res.packages) {
          setPackages(res.packages);
          setSelectedPackage(res.packages[1] || res.packages[0]); // default to 100 THB
        }
      })
      .catch((err) => console.error(err));

    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    try {
      const res = await api.getTopupHistory();
      if (res && res.history) {
        setHistory(res.history);
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

    if (!voucherUrl.trim()) {
      setResultMessage({ success: false, message: 'กรุณากรอกลิงก์ซองของขวัญ TrueMoney Wallet' });
      return;
    }

    setIsSubmitting(true);
    setResultMessage(null);

    try {
      const res = await api.redeemVoucher(voucherUrl.trim());
      updateBalance(res.newBalance);
      setResultMessage({
        success: true,
        message: res.message,
      });
      setVoucherUrl('');

      // Confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      loadHistory();
    } catch (err: any) {
      setResultMessage({
        success: false,
        message: err.message || 'เกิดข้อผิดพลาดในการเติมเงิน',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickTestVoucher = (code: string) => {
    setVoucherUrl(code);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Coins className="w-4 h-4" />
            <span>ระบบเติมเงินอัตโนมัติ</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            เติมเงิน <span className="text-amber-400">TrueMoney Wallet</span>
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            เติม Point สะดวก รวดเร็ว ด้วยซองของขวัญทรูมันนี่ วอลเล็ท รับโบนัสแต้มเพิ่มสูงสุด 25%
          </p>
        </div>

        {/* User Balance Card */}
        {user && (
          <div className="p-4 bg-[#141b29] border border-emerald-500/30 rounded-2xl flex items-center gap-3 shadow-md self-start">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-gray-400 block">ยอด Point ปัจจุบัน</span>
              <span className="text-xl font-black text-white">
                {user.balance.toLocaleString()} <span className="text-xs text-emerald-400 font-medium">Points</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-gray-800 pb-3">
        <button
          onClick={() => setActiveTab('TOPUP')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
            activeTab === 'TOPUP'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          เติมเงิน Point
        </button>
        <button
          onClick={() => {
            setActiveTab('HISTORY');
            if (user) loadHistory();
          }}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
            activeTab === 'HISTORY'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          ประวัติการทำรายการ {history.length > 0 && `(${history.length})`}
        </button>
      </div>

      {activeTab === 'TOPUP' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Packages & Input */}
          <div className="lg:col-span-2 space-y-6">
            {/* Packages Grid */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                1. เลือกแพ็กเกจที่ต้องการเติม:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {packages.map((pkg) => {
                  const isSelected = selectedPackage?.amount === pkg.amount;
                  return (
                    <div
                      key={pkg.amount}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`relative p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#182235] border-amber-400 shadow-glow-gold scale-[1.02]'
                          : 'bg-[#121927] hover:bg-[#151f30] border-gray-800'
                      }`}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-2.5 right-3 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[10px] font-black uppercase rounded-full shadow-sm">
                          {pkg.tag}
                        </div>
                      )}
                      {!pkg.popular && pkg.bonusPoints > 0 && (
                        <div className="absolute -top-2.5 right-3 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full">
                          {pkg.tag}
                        </div>
                      )}

                      <div className="text-xl sm:text-2xl font-black text-white">
                        ฿{pkg.amount.toLocaleString()}
                      </div>
                      <div className="mt-1 text-sm font-bold text-amber-400 flex items-center gap-1">
                        <span>{pkg.totalPoints.toLocaleString()}</span>
                        <span className="text-xs text-gray-400 font-normal">Points</span>
                      </div>
                      {pkg.bonusPoints > 0 && (
                        <div className="text-[11px] text-emerald-400 mt-0.5">
                          (โบนัส +{pkg.bonusPoints} P)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Voucher URL Input Form */}
            <div className="p-6 bg-[#121927] border border-gray-800 rounded-2xl shadow-lg space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  2. กรอกลิงก์ซองของขวัญ TrueMoney Wallet:
                </label>
                <form onSubmit={handleRedeem} className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={voucherUrl}
                      onChange={(e) => setVoucherUrl(e.target.value)}
                      placeholder="https://gift.truemoney.com/campaign/?v=xxxxxx"
                      className="w-full px-4 py-3.5 bg-[#0d131f] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono text-sm transition"
                    />
                  </div>

                  {resultMessage && (
                    <div
                      className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
                        resultMessage.success
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                          : 'bg-red-500/10 border border-red-500/30 text-red-400'
                      }`}
                    >
                      {resultMessage.success ? (
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      )}
                      <span>{resultMessage.message}</span>
                    </div>
                  )}

                  {!user ? (
                    <button
                      type="button"
                      onClick={openLinkModal}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 hover:scale-[1.01] transition"
                    >
                      <span>เข้าสู่ระบบเพื่อเติมเงิน</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting || !voucherUrl.trim()}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-black font-black rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 hover:scale-[1.01] transition"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          กำลังตรวจสอบซองของขวัญ...
                        </>
                      ) : (
                        <>
                          <Coins className="w-5 h-5" />
                          ยืนยันการเติมเงิน
                        </>
                      )}
                    </button>
                  )}
                </form>
              </div>

              {/* Sandbox Test Mode Helper for Testing */}
              <div className="pt-4 border-t border-gray-800">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>ทดสอบระบบ (Sandbox Mode สำหรับทดลองเติมเงิน):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickTestVoucher('TEST_50')}
                    className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-mono transition"
                  >
                    +50 บาท (TEST_50)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTestVoucher('TEST_100')}
                    className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-mono transition"
                  >
                    +100 บาท (TEST_100)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTestVoucher('TEST_500')}
                    className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-mono transition"
                  >
                    +500 บาท (TEST_500)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: How-to Tutorial Guide */}
          <div className="space-y-4">
            <div className="p-6 bg-[#121927] border border-gray-800 rounded-2xl shadow-lg space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                วิธีสร้างซองของขวัญ TrueMoney
              </h3>

              <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
                <div className="flex items-start gap-2.5 p-2.5 bg-[#0e1422] rounded-xl border border-gray-850">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center flex-shrink-0">
                    1
                  </span>
                  <div>
                    <span className="font-bold text-white">เปิดแอป TrueMoney</span>
                    <p className="text-gray-400 mt-0.5">กดที่เมนู <b>"โอนเงิน"</b> แล้วเลือก <b>"ส่งซองของขวัญ"</b></p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-[#0e1422] rounded-xl border border-gray-850">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center flex-shrink-0">
                    2
                  </span>
                  <div>
                    <span className="font-bold text-white">กรอกจำนวนเงินที่ต้องการเติม</span>
                    <p className="text-gray-400 mt-0.5">เช่น 50, 100, 300 หรือ 500 บาท</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-[#0e1422] rounded-xl border border-gray-850">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center flex-shrink-0">
                    3
                  </span>
                  <div>
                    <span className="font-bold text-white">เลือกประเภทการสุ่มเป็น "แบ่งเท่ากัน"</span>
                    <p className="text-gray-400 mt-0.5">และใส่จำนวนผู้รับเป็น <b>1 คน</b> เท่านั้น</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-[#0e1422] rounded-xl border border-gray-850">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center flex-shrink-0">
                    4
                  </span>
                  <div>
                    <span className="font-bold text-white">กดสร้างซองและคัดลอกลิงก์</span>
                    <p className="text-gray-400 mt-0.5">นำลิงก์มาวางในช่องเติมเงินด้านซ้ายมือแล้วกดยืนยัน</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-gray-500 border-t border-gray-800">
                🔒 ระบบเชื่อมต่อกับ TrueMoney Gift API ปลอดภัย ได้รับ Point เข้าบัญชีทันทีตลอด 24 ชั่วโมง
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Topup History Table */
        <div className="bg-[#121927] border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">ประวัติการทำรายการเติมเงินของคุณ</h3>
            <button
              onClick={loadHistory}
              className="text-xs text-emerald-400 hover:underline"
            >
              รีเฟรชข้อมูล
            </button>
          </div>

          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#0e1422] text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                  <tr>
                    <th className="py-3 px-4">รหัสธุรกรรม</th>
                    <th className="py-3 px-4">ช่องทาง</th>
                    <th className="py-3 px-4">จำนวนเงิน</th>
                    <th className="py-3 px-4">Point ที่ได้รับ</th>
                    <th className="py-3 px-4">สถานะ</th>
                    <th className="py-3 px-4">วันที่ทำรายการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850">
                  {history.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-800/40 transition">
                      <td className="py-3 px-4 font-mono text-gray-400">{tx.transactionId}</td>
                      <td className="py-3 px-4">{tx.method}</td>
                      <td className="py-3 px-4 font-bold text-white">฿{tx.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 font-bold text-amber-400">+{tx.pointsCredited.toLocaleString()} P</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.status === 'SUCCESS'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : tx.status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {new Date(tx.createdAt).toLocaleString('th-TH')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-gray-500 text-xs">
              ยังไม่มีประวัติการทำรายการเติมเงิน
            </div>
          )}
        </div>
      )}
    </div>
  );
};
