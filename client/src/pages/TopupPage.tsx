import React, { useState, useEffect } from 'react';
import {
  Coins,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  ArrowRight,
  QrCode,
  FlaskConical,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TopupPackage, TopupTransaction } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

type PaymentMethod = 'PROMPTPAY' | 'TRUEMONEY' | 'TEST_MODE';

export const TopupPage: React.FC = () => {
  const { user, openLinkModal, updateBalance } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PROMPTPAY');
  const [packages, setPackages] = useState<TopupPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<TopupPackage | null>(null);

  // PromptPay State
  const [promptpayData, setPromptpayData] = useState<{
    transactionId: string;
    amount: number;
    pointsData: { basePoints: number; bonusPoints: number; totalPoints: number };
    qrImageUrl: string;
    recipient: { number: string; name: string };
    expiresAt: string;
  } | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [isConfirmingPromptpay, setIsConfirmingPromptpay] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  // TrueMoney State
  const [voucherUrl, setVoucherUrl] = useState('');
  const [isSubmittingVoucher, setIsSubmittingVoucher] = useState(false);

  // Test Topup State
  const [testAmount, setTestAmount] = useState<number>(100);
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);

  // Common Feedback & History
  const [resultMessage, setResultMessage] = useState<{ success: boolean; message: string } | null>(null);
  const [history, setHistory] = useState<TopupTransaction[]>([]);
  const [activeMainTab, setActiveMainTab] = useState<'TOPUP' | 'HISTORY'>('TOPUP');

  useEffect(() => {
    api.getTopupPackages()
      .then((res) => {
        if (res && res.packages) {
          setPackages(res.packages);
          setSelectedPackage(res.packages[1] || res.packages[0]); // default 100 THB
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

  const triggerCelebration = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
    });
  };

  // 1. Generate PromptPay QR
  const handleGeneratePromptPay = async () => {
    if (!user) {
      openLinkModal();
      return;
    }

    const amount = selectedPackage ? selectedPackage.amount : 100;
    setIsGeneratingQr(true);
    setResultMessage(null);

    try {
      const res = await api.createPromptPayQr(amount);
      if (res.success) {
        setPromptpayData(res);
      }
    } catch (err: any) {
      setResultMessage({
        success: false,
        message: err.message || 'ไม่สามารถสร้าง QR Code พร้อมเพย์ได้',
      });
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // 2. Confirm / Simulate PromptPay Payment
  const handleConfirmPromptPay = async () => {
    if (!promptpayData) return;

    setIsConfirmingPromptpay(true);
    setResultMessage(null);

    try {
      const res = await api.confirmPromptPay(promptpayData.transactionId);
      updateBalance(res.newBalance);
      setResultMessage({
        success: true,
        message: res.message,
      });
      setPromptpayData(null);
      triggerCelebration();
      loadHistory();
    } catch (err: any) {
      setResultMessage({
        success: false,
        message: err.message || 'เกิดข้อผิดพลาดในการยืนยันการชำระเงิน',
      });
    } finally {
      setIsConfirmingPromptpay(false);
    }
  };

  // 3. TrueMoney Voucher Redeem
  const handleRedeemVoucher = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      openLinkModal();
      return;
    }

    if (!voucherUrl.trim()) {
      setResultMessage({ success: false, message: 'กรุณากรอกลิงก์ซองของขวัญ TrueMoney Wallet' });
      return;
    }

    setIsSubmittingVoucher(true);
    setResultMessage(null);

    try {
      const res = await api.redeemVoucher(voucherUrl.trim());
      updateBalance(res.newBalance);
      setResultMessage({
        success: true,
        message: res.message,
      });
      setVoucherUrl('');
      triggerCelebration();
      loadHistory();
    } catch (err: any) {
      setResultMessage({
        success: false,
        message: err.message || 'เกิดข้อผิดพลาดในการเติมเงินด้วยซองของขวัญ',
      });
    } finally {
      setIsSubmittingVoucher(false);
    }
  };

  // 4. Instant Test Top-up (Sandbox)
  const handleInstantTestTopup = async (amountToTest?: number) => {
    if (!user) {
      openLinkModal();
      return;
    }

    const amount = amountToTest || testAmount;
    setIsSubmittingTest(true);
    setResultMessage(null);

    try {
      const res = await api.testTopup(amount);
      updateBalance(res.newBalance);
      setResultMessage({
        success: true,
        message: res.message,
      });
      triggerCelebration();
      loadHistory();
    } catch (err: any) {
      setResultMessage({
        success: false,
        message: err.message || 'เกิดข้อผิดพลาดในการเติมเงินทดสอบ',
      });
    } finally {
      setIsSubmittingTest(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
            <Coins className="w-4 h-4" />
            <span>ระบบเติมเงินอัตโนมัติ (Automated Top-up)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            เติม Point <span className="text-sky-400">เข้าบัญชีเกม</span>
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            รองรับทั้ง <b>พร้อมเพย์ (PromptPay QR)</b>, <b>TrueMoney Wallet</b> และ <b>ระบบเติมเงินทดสอบ (Sandbox Mode)</b>
          </p>
        </div>

        {/* User Balance Card */}
        {user && (
          <div className="p-4 bg-[#141b29] border border-sky-500/30 rounded-2xl flex items-center gap-3.5 shadow-glow-sky self-start">
            <div className="p-2.5 bg-sky-500/10 rounded-xl text-sky-400">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-gray-400 block">ยอด Point ปัจจุบันของคุณ</span>
              <span className="text-xl font-black text-white">
                {user.balance.toLocaleString()} <span className="text-xs text-sky-400 font-medium">Points</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Tabs (Topup vs History) */}
      <div className="flex items-center gap-3 border-b border-gray-800 pb-3">
        <button
          onClick={() => setActiveMainTab('TOPUP')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
            activeMainTab === 'TOPUP'
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          เติมเงิน Point
        </button>
        <button
          onClick={() => {
            setActiveMainTab('HISTORY');
            if (user) loadHistory();
          }}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-1.5 ${
            activeMainTab === 'HISTORY'
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <span>ประวัติการทำรายการ</span>
          {history.length > 0 && (
            <span className="px-1.5 py-0.2 bg-gray-800 text-gray-300 rounded text-xs font-mono">
              {history.length}
            </span>
          )}
        </button>
      </div>

      {activeMainTab === 'TOPUP' ? (
        <div className="space-y-8">
          {/* Payment Method Selector (3 Cards) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              1. เลือกช่องทางการชำระเงิน:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Method 1: PromptPay */}
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('PROMPTPAY');
                  setPromptpayData(null);
                  setResultMessage(null);
                }}
                className={`p-4 rounded-2xl border text-left transition flex items-center gap-3.5 ${
                  paymentMethod === 'PROMPTPAY'
                    ? 'bg-[#152338] border-sky-400 shadow-glow-sky'
                    : 'bg-[#121927] hover:bg-[#162033] border-gray-800'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-sm">พร้อมเพย์ (PromptPay)</span>
                    <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[9px] font-bold">
                      QR CODE
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">สแกนจ่ายผ่านทุกแอปธนาคาร ฟรีค่าธรรมเนียม</p>
                </div>
              </button>

              {/* Method 2: TrueMoney Wallet */}
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('TRUEMONEY');
                  setPromptpayData(null);
                  setResultMessage(null);
                }}
                className={`p-4 rounded-2xl border text-left transition flex items-center gap-3.5 ${
                  paymentMethod === 'TRUEMONEY'
                    ? 'bg-[#211d17] border-amber-400 shadow-glow-gold'
                    : 'bg-[#121927] hover:bg-[#1a1714] border-gray-800'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <Coins className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-sm">TrueMoney Wallet</span>
                    <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[9px] font-bold">
                      ซองของขวัญ
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">กรอกลิงก์ซองของขวัญทรูมันนี่ โอนเข้าทันที</p>
                </div>
              </button>

              {/* Method 3: Test Topup Sandbox */}
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('TEST_MODE');
                  setPromptpayData(null);
                  setResultMessage(null);
                }}
                className={`p-4 rounded-2xl border text-left transition flex items-center gap-3.5 ${
                  paymentMethod === 'TEST_MODE'
                    ? 'bg-[#1d162e] border-purple-400 shadow-glow-purple'
                    : 'bg-[#121927] hover:bg-[#181326] border-gray-800'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                  <FlaskConical className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-sm">เติมเงินทดสอบ (Test Mode)</span>
                    <span className="px-1.5 py-0.2 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-[9px] font-bold">
                      SANDBOX
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">ทดลองเติม Point ฟรีทันที ไม่ต้องใช้เงินจริง</p>
                </div>
              </button>
            </div>
          </div>

          {/* Alert Message Banner */}
          {resultMessage && (
            <div
              className={`p-4 rounded-2xl flex items-center gap-3 text-sm shadow-md animate-fadeIn ${
                resultMessage.success
                  ? 'bg-sky-500/10 border border-sky-500/30 text-sky-400'
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

          {/* MODE 1: PROMPTPAY QR */}
          {paymentMethod === 'PROMPTPAY' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Package Selector */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                    2. เลือกแพ็กเกจที่ต้องการเติมเงิน:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    {packages.map((pkg) => {
                      const isSelected = selectedPackage?.amount === pkg.amount;
                      return (
                        <div
                          key={pkg.amount}
                          onClick={() => {
                            setSelectedPackage(pkg);
                            setPromptpayData(null);
                          }}
                          className={`relative p-4 rounded-2xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#152338] border-sky-400 shadow-glow-sky scale-[1.02]'
                              : 'bg-[#121927] hover:bg-[#162033] border-gray-800'
                          }`}
                        >
                          {pkg.popular && (
                            <div className="absolute -top-2.5 right-3 px-2 py-0.5 bg-gradient-to-r from-sky-400 to-cyan-300 text-black text-[10px] font-black uppercase rounded-full shadow-sm">
                              {pkg.tag}
                            </div>
                          )}
                          {!pkg.popular && pkg.bonusPoints > 0 && (
                            <div className="absolute -top-2.5 right-3 px-2 py-0.5 bg-sky-500 text-black text-[10px] font-bold rounded-full">
                              {pkg.tag}
                            </div>
                          )}

                          <div className="text-xl sm:text-2xl font-black text-white">
                            ฿{pkg.amount.toLocaleString()}
                          </div>
                          <div className="mt-1 text-sm font-bold text-sky-400 flex items-center gap-1">
                            <span>{pkg.totalPoints.toLocaleString()}</span>
                            <span className="text-xs text-gray-400 font-normal">Points</span>
                          </div>
                          {pkg.bonusPoints > 0 && (
                            <div className="text-[11px] text-cyan-300 mt-0.5">
                              (โบนัส +{pkg.bonusPoints} P)
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* PromptPay Action Card */}
                {!promptpayData ? (
                  <div className="p-6 bg-[#121927] border border-gray-800 rounded-2xl shadow-lg space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
                      <div>
                        <span className="text-xs text-gray-400 block">ยอดเงินที่ต้องชำระ:</span>
                        <span className="text-2xl font-black text-white">
                          ฿{selectedPackage?.amount.toLocaleString() || 100}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-400 block">Point ที่จะได้รับ:</span>
                        <span className="text-lg font-black text-sky-400">
                          +{selectedPackage?.totalPoints.toLocaleString() || 110} Points
                        </span>
                      </div>
                    </div>

                    {!user ? (
                      <button
                        type="button"
                        onClick={openLinkModal}
                        className="w-full py-4 bg-gradient-to-r from-sky-500 to-cyan-500 text-black font-black rounded-xl shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 hover:scale-[1.01] transition"
                      >
                        <span>เข้าสู่ระบบก่อนสร้าง QR Code</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleGeneratePromptPay}
                        disabled={isGeneratingQr}
                        className="w-full py-4 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 disabled:opacity-50 text-black font-black rounded-xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 hover:scale-[1.01] transition text-base"
                      >
                        {isGeneratingQr ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            กำลังสร้าง QR Code พร้อมเพย์...
                          </>
                        ) : (
                          <>
                            <QrCode className="w-5 h-5" />
                            สร้าง QR Code ชำระเงิน (฿{selectedPackage?.amount || 100})
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  /* Thai QR PromptPay Payment Display */
                  <div className="p-6 bg-[#121927] border-2 border-sky-400 rounded-3xl shadow-2xl space-y-6 animate-fadeIn">
                    <div className="bg-[#002f6c] p-4 rounded-2xl flex items-center justify-between text-white shadow-md">
                      <div className="flex items-center gap-2">
                        <div className="bg-white p-1 rounded-lg">
                          <QrCode className="w-6 h-6 text-[#002f6c]" />
                        </div>
                        <div>
                          <span className="font-black text-sm tracking-wider uppercase block">Thai QR Payment</span>
                          <span className="text-[10px] text-blue-200">พร้อมเพย์ (PromptPay)</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-blue-200 block">ยอดชำระ:</span>
                        <span className="text-xl font-black text-amber-300">฿{promptpayData.amount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
                      {/* QR Code Image */}
                      <div className="p-3 bg-white rounded-2xl shadow-xl flex-shrink-0">
                        <img
                          src={promptpayData.qrImageUrl}
                          alt="PromptPay QR Code"
                          className="w-56 h-56 sm:w-60 sm:h-60 object-contain rounded-lg"
                        />
                      </div>

                      {/* Recipient Details & Actions */}
                      <div className="space-y-3.5 text-xs text-left w-full sm:w-auto">
                        <div className="p-3 bg-[#0d131f] border border-gray-800 rounded-xl space-y-1">
                          <span className="text-gray-400 block text-[11px]">ชื่อบัญชีผู้รับเงิน:</span>
                          <span className="font-bold text-white text-sm block">{promptpayData.recipient.name}</span>
                        </div>

                        <div className="p-3 bg-[#0d131f] border border-gray-800 rounded-xl space-y-1">
                          <span className="text-gray-400 block text-[11px]">หมายเลขพร้อมเพย์:</span>
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-mono font-bold text-sky-400 text-sm">
                              {promptpayData.recipient.number}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(promptpayData.recipient.number)}
                              className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded flex items-center gap-1 text-[10px] transition"
                            >
                              {copiedNumber ? <Check className="w-3 h-3 text-sky-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedNumber ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                            </button>
                          </div>
                        </div>

                        <div className="p-3 bg-[#0d131f] border border-gray-800 rounded-xl space-y-1">
                          <span className="text-gray-400 block text-[11px]">Point ที่จะได้รับ:</span>
                          <span className="font-black text-amber-400 text-base">
                            +{promptpayData.pointsData.totalPoints.toLocaleString()} Points
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Confirmation Actions */}
                    <div className="pt-4 border-t border-gray-800 space-y-3">
                      <button
                        type="button"
                        onClick={handleConfirmPromptPay}
                        disabled={isConfirmingPromptpay}
                        className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 disabled:opacity-50 text-black font-black rounded-xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition hover:scale-[1.01]"
                      >
                        {isConfirmingPromptpay ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            กำลังตรวจสอบและเพิ่ม Point...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            ฉันโอนเงินแล้ว (ยืนยันและรับ Point ทันที)
                          </>
                        )}
                      </button>

                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setPromptpayData(null)}
                          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl text-xs transition"
                        >
                          ยกเลิก / เลือกยอดใหม่
                        </button>

                        <button
                          type="button"
                          onClick={handleConfirmPromptPay}
                          className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                          title="จำลองว่าสแกนจ่ายสำเร็จ สำหรับการทดสอบโดยไม่ต้องโอนจริง"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>จำลองการโอนสำเร็จ (Test)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: PromptPay Guide */}
              <div className="space-y-4">
                <div className="p-6 bg-[#121927] border border-gray-800 rounded-2xl shadow-lg space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-sky-400" />
                    วิธีสแกนจ่ายผ่านพร้อมเพย์
                  </h3>

                  <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
                    <div className="flex items-start gap-2.5 p-2.5 bg-[#0e1422] rounded-xl border border-gray-850">
                      <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center flex-shrink-0">
                        1
                      </span>
                      <div>
                        <span className="font-bold text-white">เลือกแพ็กเกจแล้วกดสร้าง QR</span>
                        <p className="text-gray-400 mt-0.5">ระบบจะสร้าง QR Code พร้อมเพย์ตามยอดที่ท่านเลือก</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 bg-[#0e1422] rounded-xl border border-gray-850">
                      <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center flex-shrink-0">
                        2
                      </span>
                      <div>
                        <span className="font-bold text-white">เปิดแอปธนาคารใดก็ได้</span>
                        <p className="text-gray-400 mt-0.5">เช่น K PLUS, SCB EASY, Krungthai NEXT หรือแอปธนาคารทุกแห่ง</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 bg-[#0e1422] rounded-xl border border-gray-850">
                      <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center flex-shrink-0">
                        3
                      </span>
                      <div>
                        <span className="font-bold text-white">สแกน QR Code แล้วกดยืนยัน</span>
                        <p className="text-gray-400 mt-0.5">ตรวจสอบยอดเงินและชื่อบัญชีให้ถูกต้องก่อนโอน</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 bg-[#0e1422] rounded-xl border border-gray-850">
                      <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center flex-shrink-0">
                        4
                      </span>
                      <div>
                        <span className="font-bold text-white">กดปุ่ม "ฉันโอนเงินแล้ว"</span>
                        <p className="text-gray-400 mt-0.5">ระบบจะเพิ่ม Point เข้าบัญชีเกมทันที!</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 text-[11px] text-gray-500 border-t border-gray-800">
                    🔒 ปลอดภัยสูงสุดด้วยมาตรฐาน Thai QR Payment EMVCo ยอด Point เข้าทันทีตลอด 24 ชม.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: TRUEMONEY WALLET */}
          {paymentMethod === 'TRUEMONEY' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Packages & Voucher Input */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                    2. เลือกแพ็กเกจที่ต้องการเติม:
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
                      3. กรอกลิงก์ซองของขวัญ TrueMoney Wallet:
                    </label>
                    <form onSubmit={handleRedeemVoucher} className="space-y-4">
                      <div className="relative">
                        <input
                          type="text"
                          value={voucherUrl}
                          onChange={(e) => setVoucherUrl(e.target.value)}
                          placeholder="https://gift.truemoney.com/campaign/?v=xxxxxx"
                          className="w-full px-4 py-3.5 bg-[#0d131f] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono text-sm transition"
                        />
                      </div>

                      {!user ? (
                        <button
                          type="button"
                          onClick={openLinkModal}
                          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 hover:scale-[1.01] transition"
                        >
                          <span>เข้าสู่ระบบเพื่อเติมเงิน</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={isSubmittingVoucher || !voucherUrl.trim()}
                          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-black font-black rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 hover:scale-[1.01] transition"
                        >
                          {isSubmittingVoucher ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              กำลังตรวจสอบซองของขวัญ...
                            </>
                          ) : (
                            <>
                              <Coins className="w-5 h-5" />
                              ยืนยันการเติมเงิน TrueMoney
                            </>
                          )}
                        </button>
                      )}
                    </form>
                  </div>
                </div>
              </div>

              {/* Right Column: TrueMoney Tutorial Guide */}
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
                </div>
              </div>
            </div>
          )}

          {/* MODE 3: DEDICATED TEST TOPUP SANDBOX */}
          {paymentMethod === 'TEST_MODE' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
              <div className="p-6 sm:p-8 bg-[#151224] border-2 border-purple-500/40 rounded-3xl shadow-glow-purple space-y-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto">
                  <FlaskConical className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white">
                    ระบบเติมเงินทดสอบ (Test Top-up Sandbox)
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                    ใช้สำหรับทดสอบระบบซื้อของและเติม Point โดยไม่ต้องโอนเงินจริง เมื่อกดยืนยัน ระบบจะคำนวณ Point พร้อมโบนัสและเพิ่มเข้าบัญชีของคุณทันที!
                  </p>
                </div>

                {/* Preset Quick Buttons */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 block uppercase tracking-wider">
                    เลือกจำนวนเงินจำลองที่ต้องการเติม:
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[50, 100, 300, 500, 1000, 2000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTestAmount(amt)}
                        className={`py-2 px-3 rounded-xl font-mono font-bold text-xs transition ${
                          testAmount === amt
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-[#0d0a18] hover:bg-[#1a1430] text-gray-300 border border-purple-500/20'
                        }`}
                      >
                        ฿{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount Input */}
                <div className="max-w-xs mx-auto">
                  <label className="text-xs text-gray-400 mb-1 block">หรือระบุจำนวนเงินเอง (บาท):</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={testAmount}
                      onChange={(e) => setTestAmount(Math.max(1, parseInt(e.target.value, 10) || 0))}
                      min={1}
                      max={100000}
                      className="w-full px-4 py-3 bg-[#0d0a18] border-2 border-purple-500/40 rounded-xl text-center text-xl font-black text-purple-300 focus:outline-none focus:border-purple-400 font-mono"
                    />
                  </div>
                </div>

                {/* Instant Submit Button */}
                {!user ? (
                  <button
                    type="button"
                    onClick={openLinkModal}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 hover:scale-[1.01] transition"
                  >
                    <span>เข้าสู่ระบบเพื่อเติมเงินทดสอบ</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleInstantTestTopup(testAmount)}
                    disabled={isSubmittingTest}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black rounded-xl shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 hover:scale-[1.01] transition text-base"
                  >
                    {isSubmittingTest ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        กำลังเติม Point ทดสอบ...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        เติม Point ทดสอบทันที (฿{testAmount.toLocaleString()})
                      </>
                    )}
                  </button>
                )}

                <div className="text-[11px] text-gray-500 border-t border-purple-500/20 pt-3">
                  💡 รายการเติมเงินนี้จะถูกบันทึกด้วยประเภท <code className="text-purple-300 font-mono">TEST_SANDBOX</code> ในฐานข้อมูล
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Topup History Table */
        <div className="bg-[#121927] border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">ประวัติการทำรายการเติมเงินของคุณ</h3>
            <button
              onClick={loadHistory}
              className="text-xs text-sky-400 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>รีเฟรชข้อมูล</span>
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
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.method === 'PROMPTPAY_QR'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : tx.method === 'TEST_SANDBOX'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {tx.method === 'PROMPTPAY_QR'
                            ? 'พร้อมเพย์ QR'
                            : tx.method === 'TEST_SANDBOX'
                            ? 'เติมทดสอบ (Sandbox)'
                            : 'TrueMoney'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-white">฿{tx.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 font-bold text-sky-400">+{tx.pointsCredited.toLocaleString()} P</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.status === 'SUCCESS'
                              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
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
