import React, { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, Gamepad2, ShieldAlert, ArrowRight, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { getMinecraftHeadUrl } from '../utils/minecraftSkin';

export const LinkModal: React.FC = () => {
  const { isLinkModalOpen, closeLinkModal, loginWithToken } = useAuth();

  const [step, setStep] = useState<'INPUT' | 'WAITING' | 'SUCCESS'>('INPUT');
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes in seconds
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const pollIntervalRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  // Reset modal state when closed or opened
  useEffect(() => {
    if (isLinkModalOpen) {
      setStep('INPUT');
      setError(null);
      setCopied(false);
    } else {
      clearInterval(pollIntervalRef.current);
      clearInterval(timerIntervalRef.current);
    }
  }, [isLinkModalOpen]);

  // Countdown Timer
  useEffect(() => {
    if (step === 'WAITING' && expiresAt) {
      timerIntervalRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
        setTimeLeft(remaining);

        if (remaining <= 0) {
          clearInterval(timerIntervalRef.current);
          clearInterval(pollIntervalRef.current);
          setError('รหัสยืนยันหมดอายุแล้ว กรุณาสร้างรหัสใหม่');
          setStep('INPUT');
        }
      }, 1000);
    }

    return () => clearInterval(timerIntervalRef.current);
  }, [step, expiresAt]);

  // Polling link status
  useEffect(() => {
    if (step === 'WAITING' && code) {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const res = await api.checkLinkStatus(code);
          if (res.status === 'LINKED' && res.token && res.user) {
            clearInterval(pollIntervalRef.current);
            clearInterval(timerIntervalRef.current);
            setStep('SUCCESS');

            // Trigger festive celebration
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });

            setTimeout(() => {
              loginWithToken(res.token!, res.user);
            }, 1800);
          } else if (res.status === 'EXPIRED') {
            clearInterval(pollIntervalRef.current);
            setError('รหัสยืนยันหมดอายุแล้ว กรุณาสร้างใหม่');
            setStep('INPUT');
          }
        } catch (err: any) {
          console.error('Polling error:', err);
        }
      }, 2000);
    }

    return () => clearInterval(pollIntervalRef.current);
  }, [step, code, loginWithToken]);

  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || username.length < 3) {
      setError('กรุณากรอกชื่อผู้เล่น Minecraft อย่างน้อย 3 ตัวอักษร');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await api.requestLink(username.trim());
      setCode(res.code);
      const expDate = new Date(res.expiresAt);
      setExpiresAt(expDate);
      setTimeLeft(Math.floor((expDate.getTime() - Date.now()) / 1000));
      setStep('WAITING');
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถสร้างรหัสยืนยันได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(`/link ${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Simulation for testing in dev without live Minecraft server
  const handleSimulateInGame = async () => {
    setIsSimulating(true);
    try {
      await api.simulateLink(code);
      // Wait for next poll or trigger immediately
    } catch (err: any) {
      setError(err.message || 'จำลองการผูกบัญชีไม่สำเร็จ');
    } finally {
      setIsSimulating(false);
    }
  };

  if (!isLinkModalOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#141b27] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Glow Top Border */}
        <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-cyan-400 to-sky-400"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-xl">
              <Gamepad2 className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                ผูกบัญชีเกม Minecraft
                <span className="text-xs px-2 py-0.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-full font-normal">
                  ไร้รหัสผ่าน
                </span>
              </h3>
              <p className="text-xs text-gray-400">เข้าสู่ระบบด้วยคำสั่งยืนยันตัวตนในเกม ปลอดภัย 100%</p>
            </div>
          </div>
          <button
            onClick={closeLinkModal}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-sm">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'INPUT' && (
            <form onSubmit={handleRequestLink} className="space-y-5">
              <div className="text-center py-2">
                <div className="relative inline-block mb-3">
                  <img
                    src={getMinecraftHeadUrl(username || 'Steve', 64)}
                    alt="Skin Preview"
                    className="w-16 h-16 rounded-xl border-2 border-sky-500/50 shadow-glow-sky bg-[#0d121c] pixelated transition-all"
                  />
                  <div className="absolute -bottom-1 -right-1 p-1 bg-sky-500 rounded-full text-black">
                    <Sparkles className="w-3 h-3" />
                  </div>
                </div>
                <p className="text-sm text-gray-300">
                  กรอกชื่อตัวละคร Minecraft ของคุณเพื่อรับรหัสยืนยัน
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Minecraft Username (ชื่อในเกม)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="เช่น Notch, Steve, CorarePlayer"
                    className="w-full px-4 py-3 bg-[#0d131f] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition text-base font-medium"
                    autoFocus
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-gray-400 flex items-center gap-1">
                  <span>💡 ไม่ต้องใช้รหัสผ่าน ระบบจะให้คุณยืนยันคำสั่งในเกมโดยตรง</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !username.trim()}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black rounded-xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    กำลังสร้างรหัสยืนยัน...
                  </>
                ) : (
                  <>
                    ขอรหัสยืนยันตัวตน
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {step === 'WAITING' && (
            <div className="space-y-5 text-center">
              {/* Countdown badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                รหัสหมดอายุใน: <span className="font-bold">{timeFormatted}</span>
              </div>

              {/* Big Code Display */}
              <div className="p-5 bg-[#0d131f] border-2 border-sky-500/40 rounded-2xl shadow-glow-sky">
                <div className="text-xs text-gray-400 mb-1 font-mono uppercase tracking-wider">
                  รหัสยืนยันสำหรับ: <span className="text-sky-400 font-bold">{username}</span>
                </div>
                <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-200 to-cyan-300 tracking-widest my-2 select-all font-mono">
                  {code}
                </div>

                {/* Copy Command Button */}
                <button
                  type="button"
                  onClick={handleCopyCommand}
                  className="mt-3 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sky-400 text-sm font-semibold rounded-xl inline-flex items-center gap-2 transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-sky-400" />
                      คัดลอกคำสั่งแล้ว!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      คัดลอก: <span className="font-mono text-white">/link {code}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Instructions */}
              <div className="bg-[#0b1322] border border-gray-800 rounded-xl p-4 text-left text-xs space-y-2 text-gray-300">
                <div className="font-bold text-white flex items-center gap-1.5 mb-1 text-sm">
                  <Gamepad2 className="w-4 h-4 text-sky-400" />
                  ขั้นตอนการยืนยันในเกม:
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </span>
                  <span>เข้าสู่เซิร์ฟเวอร์ <b className="text-sky-300">corarevanilla.xyz</b> ด้วยตัวละคร <b>{username}</b></span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </span>
                  <span>เปิดช่องแชทในเกมแล้วพิมพ์คำสั่ง: <code className="bg-black/50 px-1.5 py-0.5 rounded text-sky-300 font-mono">/link {code}</code></span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </span>
                  <span>เมื่อปลั๊กอินในเกมตอบรับ หน้าเว็บนี้จะเข้าสู่ระบบให้อัตโนมัติทันที</span>
                </div>
              </div>

              {/* Live Polling Status */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                </span>
                <span>กำลังรอคำสั่งจากในเกม...</span>
              </div>

              {/* Dev Simulation Button */}
              <div className="pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={handleSimulateInGame}
                  disabled={isSimulating}
                  className="text-xs text-gray-400 hover:text-sky-400 underline underline-offset-4 flex items-center justify-center gap-1 mx-auto transition"
                >
                  {isSimulating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      กำลังส่งคำสั่งจำลอง...
                    </>
                  ) : (
                    '⚡ จำลองการพิมพ์ในเกม (สำหรับทดสอบระบบ)'
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-20 h-20 bg-sky-500/20 border-2 border-sky-500 rounded-full flex items-center justify-center mx-auto text-sky-400 animate-bounce">
                <Check className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-2xl font-bold text-white">ผูกบัญชีสำเร็จ!</h4>
                <p className="text-sm text-gray-400 mt-1">
                  ยินดีต้อนรับคุณ <span className="text-sky-400 font-bold">{username}</span> เข้าสู่ corarevanilla Store
                </p>
              </div>
              <div className="text-xs text-gray-500">กำลังนำคุณเข้าสู่หน้าเว็บ...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
