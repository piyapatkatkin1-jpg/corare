import React, { useEffect, useState } from 'react';
import {
  Settings,
  Server,
  Terminal,
  Shield,
  Coins,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  Palette,
  ExternalLink,
  Flame,
  Database,
  FileJson,
  Image as ImageIcon,
  QrCode,
} from 'lucide-react';
import { api } from '../../services/api';

export const AdminSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingRcon, setTestingRcon] = useState(false);
  const [rconResult, setRconResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testingFirebase, setTestingFirebase] = useState(false);
  const [firebaseResult, setFirebaseResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showRconPass, setShowRconPass] = useState(false);
  const [showFirebaseKey, setShowFirebaseKey] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [showJsonHelper, setShowJsonHelper] = useState(false);

  const [form, setForm] = useState({
    storeName: 'corarevanilla',
    logoUrl: '',
    logoIcon: '💎',
    tagline: 'Official Web Store',
    serverIp: 'corarevanilla.xyz',
    discordUrl: 'https://discord.gg/corarevanilla',
    truemoneyPhone: '0812345678',
    promptpayEnabled: true,
    promptpayNumber: '0812345678',
    promptpayName: 'corarevanilla Store',
    serverSecretKey: 'corare_minecraft_secret_token_change_in_production',
    linkExpiryMinutes: 5,
    maxLinkAttempts: 5,
    rconEnabled: false,
    rconHost: 'corarevanilla.xyz',
    rconPort: 25575,
    rconPassword: '',
    announcement: 'ยินดีต้อนรับสู่ corarevanilla SMP - สังคมเอาชีวิตรอด คอมมูนิตี้มายคราฟแท้ IP: corarevanilla.xyz',
    themeColor: 'light-blue',
    useFirebase: false,
    firebaseProjectId: '',
    firebaseClientEmail: '',
    firebasePrivateKey: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getSettings();
      if (res?.settings) {
        setForm({
          storeName: res.settings.storeName || 'corarevanilla',
          logoUrl: res.settings.logoUrl || '',
          logoIcon: res.settings.logoIcon || '💎',
          tagline: res.settings.tagline || 'Official Web Store',
          serverIp: res.settings.serverIp || 'corarevanilla.xyz',
          discordUrl: res.settings.discordUrl || 'https://discord.gg/corarevanilla',
          truemoneyPhone: res.settings.truemoneyPhone || '0812345678',
          promptpayEnabled: res.settings.promptpayEnabled !== undefined ? Boolean(res.settings.promptpayEnabled) : true,
          promptpayNumber: res.settings.promptpayNumber || '0812345678',
          promptpayName: res.settings.promptpayName || 'corarevanilla Store',
          serverSecretKey: res.settings.serverSecretKey || 'corare_minecraft_secret_token_change_in_production',
          linkExpiryMinutes: res.settings.linkExpiryMinutes || 5,
          maxLinkAttempts: res.settings.maxLinkAttempts || 5,
          rconEnabled: Boolean(res.settings.rconEnabled),
          rconHost: res.settings.rconHost || 'corarevanilla.xyz',
          rconPort: res.settings.rconPort || 25575,
          rconPassword: res.settings.rconPassword || '',
          announcement: res.settings.announcement || '',
          themeColor: res.settings.themeColor || 'light-blue',
          useFirebase: Boolean(res.settings.useFirebase),
          firebaseProjectId: res.settings.firebaseProjectId || '',
          firebaseClientEmail: res.settings.firebaseClientEmail || '',
          firebasePrivateKey: res.settings.firebasePrivateKey || '',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      await api.admin.updateSettings(form);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
    } finally {
      setSaving(false);
    }
  };

  const handleTestRcon = async () => {
    setTestingRcon(true);
    setRconResult(null);

    try {
      const res = await api.admin.testRconConnection({
        host: form.rconHost,
        port: form.rconPort,
        password: form.rconPassword,
      });
      setRconResult(res);
    } catch (err: any) {
      setRconResult({ success: false, message: err.message || 'การเชื่อมต่อ RCON ล้มเหลว' });
    } finally {
      setTestingRcon(false);
    }
  };

  const handleTestFirebase = async () => {
    setTestingFirebase(true);
    setFirebaseResult(null);

    try {
      const res = await api.admin.testFirebaseConnection({
        projectId: form.firebaseProjectId,
        clientEmail: form.firebaseClientEmail,
        privateKey: form.firebasePrivateKey,
      });
      setFirebaseResult(res);
    } catch (err: any) {
      setFirebaseResult({ success: false, message: err.message || 'การเชื่อมต่อ Firebase ล้มเหลว' });
    } finally {
      setTestingFirebase(false);
    }
  };

  const handleParseJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (parsed.project_id && parsed.client_email && parsed.private_key) {
        setForm((prev) => ({
          ...prev,
          useFirebase: true,
          firebaseProjectId: parsed.project_id,
          firebaseClientEmail: parsed.client_email,
          firebasePrivateKey: parsed.private_key,
        }));
        setFirebaseResult({ success: true, message: 'ถอดรหัสไฟล์ Service Account JSON สำเร็จและกรอกข้อมูลให้อัตโนมัติแล้ว!' });
        setShowJsonHelper(false);
        setJsonInput('');
      } else {
        alert('ไฟล์ JSON ไม่ถูกต้อง: ขาด project_id, client_email หรือ private_key');
      }
    } catch (e: any) {
      alert(`JSON ไม่ถูกต้อง: ${e.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-400 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
        <span>กำลังโหลดการตั้งค่าระบบ...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
            <Settings className="w-4 h-4" />
            <span>CONFIGURATIONS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            ตั้งค่าระบบทั้งหมด (Configs & RCON)
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            กำหนดชื่อเซิร์ฟเวอร์, Server IP, การเชื่อมต่อ RCON, ช่องทางชำระเงิน และความปลอดภัย
          </p>
        </div>

        <button
          type="button"
          onClick={loadSettings}
          className="p-2.5 bg-[#121927] hover:bg-gray-800 border border-gray-800 rounded-xl text-gray-400 hover:text-white transition self-start"
          title="โหลดข้อมูลใหม่"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-sky-500/10 border border-sky-500/30 rounded-2xl flex items-center gap-3 text-sky-400 text-sm shadow-glow-sky animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>บันทึกการตั้งค่าระบบเรียบร้อยแล้ว! ข้อมูลจะถูกนำไปใช้อัตโนมัติ</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Server & Brand Information */}
        <div className="p-6 bg-[#121927] border border-gray-800 rounded-2xl shadow-xl space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-800">
            <Server className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="text-base font-bold text-white">ข้อมูลเซิร์ฟเวอร์ & แบรนด์ร้านค้า (Branding & Logo)</h2>
              <p className="text-[11px] text-gray-400">เปลี่ยนชื่อร้านค้า โลโก้รูปภาพ สโลแกน ไอพีเซิร์ฟเวอร์ และธีมสีได้ทั้งหมด</p>
            </div>
          </div>

          {/* Logo Live Preview Banner */}
          <div className="p-4 bg-[#0b121e] border border-gray-700/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-300 flex items-center justify-center shadow-glow-sky overflow-hidden p-1 flex-shrink-0">
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="Logo Preview"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <span className="text-2xl">{form.logoIcon || '💎'}</span>
                )}
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block">
                  ตัวอย่างการแสดงผลบน Navbar (Live Preview):
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-white tracking-tight uppercase">
                    {form.storeName || 'corarevanilla'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded font-bold">
                    SMP
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 block -mt-0.5">
                  {form.tagline || 'Official Web Store'}
                </span>
              </div>
            </div>

            <div className="text-right text-xs text-gray-400 hidden sm:block">
              <span className="text-[11px] text-sky-400 font-mono block">IP: {form.serverIp || 'corarevanilla.xyz'}</span>
              <span className="text-[10px] text-gray-500">อัปเดตแบบ Realtime หลังกดบันทึก</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-gray-300 mb-1.5">ชื่อเซิร์ฟเวอร์ / ร้านค้า (Store Name):</label>
              <input
                type="text"
                value={form.storeName}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                placeholder="เช่น corarevanilla"
                className="w-full px-3.5 py-2.5 bg-[#0b121e] border border-gray-700 rounded-xl text-white font-medium focus:border-sky-400 focus:outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-gray-300 mb-1.5">สโลแกน / ข้อความใต้โลโก้ (Tagline):</label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                placeholder="เช่น Official Web Store หรือ ชุมชนมายคราฟแท้"
                className="w-full px-3.5 py-2.5 bg-[#0b121e] border border-gray-700 rounded-xl text-white focus:border-sky-400 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-300 mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                <span>ลิงก์รูปภาพโลโก้ร้านค้า (Logo Image URL):</span>
              </label>
              <input
                type="text"
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                placeholder="เช่น https://example.com/logo.png (เว้นว่างได้)"
                className="w-full px-3.5 py-2.5 bg-[#0b121e] border border-gray-700 rounded-xl text-white font-mono focus:border-sky-400 focus:outline-none transition"
              />
              <p className="mt-1 text-[11px] text-gray-500">
                หากเว้นว่างไว้ ระบบจะใช้ไอคอน Emoji ด้านขวาแทนอัตโนมัติ
              </p>
            </div>

            <div>
              <label className="block font-bold text-gray-300 mb-1.5">ไอคอนสำรอง / Emoji Logo:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={form.logoIcon}
                  onChange={(e) => setForm({ ...form, logoIcon: e.target.value })}
                  placeholder="💎"
                  className="w-16 text-center text-lg px-3 py-2 bg-[#0b121e] border border-gray-700 rounded-xl text-white focus:border-sky-400 focus:outline-none transition"
                />
                <div className="flex items-center gap-1">
                  {['💎', '🌲', '⚔️', '🛡️', '👑', '🔥', '🚀'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setForm({ ...form, logoIcon: emoji })}
                      className="w-8 h-8 rounded-lg bg-[#0b121e] hover:bg-gray-800 border border-gray-700 text-sm flex items-center justify-center transition"
                      title={`เลือก ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-300 mb-1.5">Server IP (สำหรับคัดลอกในเว็บ):</label>
              <input
                type="text"
                value={form.serverIp}
                onChange={(e) => setForm({ ...form, serverIp: e.target.value })}
                placeholder="เช่น corarevanilla.xyz"
                className="w-full px-3.5 py-2.5 bg-[#0b121e] border border-gray-700 rounded-xl text-sky-400 font-mono font-bold focus:border-sky-400 focus:outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-gray-300 mb-1.5">ลิงก์กลุ่ม Discord Community:</label>
              <input
                type="text"
                value={form.discordUrl}
                onChange={(e) => setForm({ ...form, discordUrl: e.target.value })}
                placeholder="https://discord.gg/corarevanilla"
                className="w-full px-3.5 py-2.5 bg-[#0b121e] border border-gray-700 rounded-xl text-white font-mono focus:border-sky-400 focus:outline-none transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-gray-300 mb-1.5">ข้อความประกาศแถบด้านบน (Announcement):</label>
              <input
                type="text"
                value={form.announcement}
                onChange={(e) => setForm({ ...form, announcement: e.target.value })}
                placeholder="ข้อความประชาสัมพันธ์สั้นๆ ที่แสดงแถบบนสุดของเว็บ..."
                className="w-full px-3.5 py-2.5 bg-[#0b121e] border border-gray-700 rounded-xl text-white focus:border-sky-400 focus:outline-none transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-gray-300 mb-1.5">ธีมสีของหน้าเว็บ (Theme Accent):</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'light-blue', name: 'Light Blue (ฟ้าอ่อน)', color: 'bg-sky-400', border: 'border-sky-400' },
                  { id: 'emerald', name: 'Emerald (เขียวมรกต)', color: 'bg-emerald-400', border: 'border-emerald-400' },
                  { id: 'amber', name: 'Gold (ทอง / ส้ม)', color: 'bg-amber-400', border: 'border-amber-400' },
                  { id: 'purple', name: 'Neon Purple (ม่วง)', color: 'bg-purple-400', border: 'border-purple-400' },
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setForm({ ...form, themeColor: th.id })}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition ${
                      form.themeColor === th.id
                        ? 'bg-[#152033] border-sky-400 text-white'
                        : 'bg-[#0b121e] border-gray-700 text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${th.color}`}></span>
                    <span className="font-bold text-[11px] truncate">{th.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Minecraft RCON Settings */}
        <div className="p-6 bg-[#121927] border border-gray-800 rounded-2xl shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <div className="flex items-center gap-2.5">
              <Terminal className="w-5 h-5 text-sky-400" />
              <div>
                <h2 className="text-base font-bold text-white">การเชื่อมต่อ Minecraft RCON</h2>
                <p className="text-[11px] text-gray-400">
                  สำหรับส่งคำสั่ง Console เข้าเกมอัตโนมัติเมื่อผู้เล่นซื้อของในร้านค้า
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rconEnabled"
                checked={form.rconEnabled}
                onChange={(e) => setForm({ ...form, rconEnabled: e.target.checked })}
                className="w-4 h-4 text-sky-500 rounded bg-gray-900 border-gray-700 focus:ring-sky-400"
              />
              <label htmlFor="rconEnabled" className="text-xs text-gray-300 font-bold cursor-pointer">
                {form.rconEnabled ? (
                  <span className="text-sky-400">เปิดใช้งาน RCON</span>
                ) : (
                  <span className="text-gray-500">ปิดใช้งาน RCON (ใช้ Command Queue แทน)</span>
                )}
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-gray-300 mb-1.5">RCON Host / IP:</label>
              <input
                type="text"
                value={form.rconHost}
                onChange={(e) => setForm({ ...form, rconHost: e.target.value })}
                placeholder="corarevanilla.xyz หรือ 127.0.0.1"
                className="w-full px-3.5 py-2.5 bg-[#0b121e] border border-gray-700 rounded-xl text-white font-mono focus:border-sky-400 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-300 mb-1.5">RCON Port:</label>
              <input
                type="number"
                value={form.rconPort}
                onChange={(e) => setForm({ ...form, rconPort: parseInt(e.target.value, 10) || 25575 })}
                placeholder="25575"
                className="w-full px-3.5 py-2.5 bg-[#0b121e] border border-gray-700 rounded-xl text-white font-mono focus:border-sky-400 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-300 mb-1.5">RCON Password:</label>
              <div className="relative">
                <input
                  type={showRconPass ? 'text' : 'password'}
                  value={form.rconPassword}
                  onChange={(e) => setForm({ ...form, rconPassword: e.target.value })}
                  placeholder="รหัสผ่าน RCON ใน server.properties"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-[#0b121e] border border-gray-700 rounded-xl text-white font-mono focus:border-sky-400 focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowRconPass(!showRconPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showRconPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Test RCON Button & Status Box */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-800">
            <div className="text-[11px] text-gray-400">
              💡 แนะนำให้เปิดพอร์ต RCON ในไฟล์ <code className="text-sky-300 font-mono">server.properties</code> (enable-rcon=true)
            </div>

            <button
              type="button"
              onClick={handleTestRcon}
              disabled={testingRcon}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sky-400 font-bold rounded-xl text-xs transition self-start disabled:opacity-50"
            >
              {testingRcon ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังทดสอบการเชื่อมต่อ...
                </>
              ) : (
                <>
                  <Terminal className="w-4 h-4" />
                  ทดสอบการเชื่อมต่อ RCON
                </>
              )}
            </button>
          </div>

          {rconResult && (
            <div
              className={`p-3.5 rounded-xl flex items-center gap-2.5 text-xs ${
                rconResult.success
                  ? 'bg-sky-500/10 border border-sky-500/30 text-sky-400'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}
            >
              {rconResult.success ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{rconResult.message}</span>
            </div>
          )}
        </div>

        {/* Section 3: Payment (PromptPay & TrueMoney) Settings */}
        <div className="p-6 bg-[#121927] border border-gray-800 rounded-2xl shadow-xl space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-800">
            <Coins className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white">ระบบเติมเงิน (Payment Settings: พร้อมเพย์ & TrueMoney)</h2>
              <p className="text-[11px] text-gray-400">
                ตั้งค่าช่องทางชำระเงิน พร้อมเพย์ QR Code สแกนจ่าย และซองของขวัญ TrueMoney Wallet
              </p>
            </div>
          </div>

          {/* PromptPay Settings Box */}
          <div className="p-4 bg-[#0b121e] border border-blue-500/30 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white text-xs block">ระบบเติมเงิน พร้อมเพย์ (PromptPay QR Code)</span>
                  <span className="text-[10px] text-gray-400">ผู้เล่นสามารถสแกนจ่ายผ่านทุกแอปธนาคารได้ทันที</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="promptpayEnabled"
                  checked={form.promptpayEnabled}
                  onChange={(e) => setForm({ ...form, promptpayEnabled: e.target.checked })}
                  className="w-4 h-4 text-blue-500 rounded bg-gray-900 border-gray-700 focus:ring-blue-400"
                />
                <label htmlFor="promptpayEnabled" className="text-xs font-bold text-gray-300 cursor-pointer">
                  {form.promptpayEnabled ? <span className="text-blue-400">เปิดใช้งานพร้อมเพย์</span> : <span className="text-gray-500">ปิดใช้งาน</span>}
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-gray-300 mb-1.5">หมายเลขพร้อมเพย์ (เบอร์โทรศัพท์ / เลขบัตร ปชช / Tax ID):</label>
                <input
                  type="text"
                  value={form.promptpayNumber}
                  onChange={(e) => setForm({ ...form, promptpayNumber: e.target.value })}
                  placeholder="เช่น 0812345678 หรือ 1234567890123"
                  className="w-full px-3.5 py-2.5 bg-[#070b13] border border-gray-700 rounded-xl text-blue-300 font-mono font-bold focus:border-blue-400 focus:outline-none transition"
                />
                <p className="mt-1 text-[11px] text-gray-500">
                  ระบบจะใช้หมายเลขนี้ในการคำนวณและสร้าง QR Code ชำระเงินมาตรฐาน EMVCo
                </p>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1.5">ชื่อบัญชีผู้รับเงิน (Account Name):</label>
                <input
                  type="text"
                  value={form.promptpayName}
                  onChange={(e) => setForm({ ...form, promptpayName: e.target.value })}
                  placeholder="เช่น นาย สมชาย ใจดี หรือ corarevanilla Store"
                  className="w-full px-3.5 py-2.5 bg-[#070b13] border border-gray-700 rounded-xl text-white focus:border-blue-400 focus:outline-none transition"
                />
                <p className="mt-1 text-[11px] text-gray-500">
                  ชื่อนี้จะแสดงบนการ์ดใบแจ้งยอด PromptPay เพื่อให้ผู้เล่นตรวจสอบก่อนโอนเงิน
                </p>
              </div>
            </div>
          </div>

          {/* TrueMoney Settings Box */}
          <div className="p-4 bg-[#0b121e] border border-amber-500/30 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-800">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white text-xs">ระบบเติมเงิน TrueMoney Wallet (ซองของขวัญ)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-gray-300 mb-1.5">เบอร์โทรศัพท์รับเงิน TrueMoney:</label>
                <input
                  type="text"
                  value={form.truemoneyPhone}
                  onChange={(e) => setForm({ ...form, truemoneyPhone: e.target.value })}
                  placeholder="เช่น 0812345678"
                  className="w-full px-3.5 py-2.5 bg-[#070b13] border border-gray-700 rounded-xl text-amber-300 font-mono font-bold focus:border-amber-400 focus:outline-none transition"
                  required
                />
                <p className="mt-1 text-[11px] text-gray-500">
                  เงินจากซองของขวัญที่ผู้เล่นกรอกจะถูกโอนเข้าเบอร์นี้โดยอัตโนมัติ
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: In-Game Link Security Settings */}
        <div className="p-6 bg-[#121927] border border-gray-800 rounded-2xl shadow-xl space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-800">
            <Shield className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="text-base font-bold text-white">ความปลอดภัย & การผูกบัญชีเกม (/link)</h2>
              <p className="text-[11px] text-gray-400">
                Token ป้องกันการยิงสวมรอย และเงื่อนไขการหมดอายุของรหัสยืนยัน
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-bold text-gray-300 mb-1.5">Server Secret Key (Header X-Server-Secret):</label>
              <input
                type="text"
                value={form.serverSecretKey}
                onChange={(e) => setForm({ ...form, serverSecretKey: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#0b121e] border border-gray-700 rounded-xl text-purple-300 font-mono focus:border-purple-400 focus:outline-none transition"
                required
              />
              <p className="mt-1 text-[11px] text-gray-500">
                ⚠️ ต้องตรงกับค่า <code className="text-purple-300 font-mono">server-secret</code> ในไฟล์ <code className="text-purple-300 font-mono">game-scripts/link.sk</code>
              </p>
            </div>

            <div>
              <label className="block font-bold text-gray-300 mb-1.5">อายุของรหัสยืนยัน (นาที):</label>
              <input
                type="number"
                value={form.linkExpiryMinutes}
                onChange={(e) => setForm({ ...form, linkExpiryMinutes: parseInt(e.target.value, 10) || 5 })}
                min={1}
                max={30}
                className="w-full px-3.5 py-2.5 bg-[#0b121e] border border-gray-700 rounded-xl text-white font-mono focus:border-purple-400 focus:outline-none transition"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 5: Firebase Firestore Settings */}
        <div className="p-6 bg-[#121927] border border-gray-800 rounded-2xl shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Flame className="w-5 h-5 fill-amber-400/20" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">การเชื่อมต่อฐานข้อมูล Firebase (Firestore)</h2>
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold">
                    DATABASE
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  กำหนดค่า Firebase Service Account สำหรับเชื่อมต่อ Cloud Firestore เพื่อจัดเก็บข้อมูลร้านค้า
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowJsonHelper(!showJsonHelper)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0b121e] hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white rounded-xl text-xs font-semibold transition"
              >
                <FileJson className="w-3.5 h-3.5 text-amber-400" />
                <span>{showJsonHelper ? 'ปิดช่องวาง JSON' : 'วางไฟล์ JSON คีย์'}</span>
              </button>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useFirebase"
                  checked={form.useFirebase}
                  onChange={(e) => setForm({ ...form, useFirebase: e.target.checked })}
                  className="w-4 h-4 text-amber-500 rounded bg-gray-900 border-gray-700 focus:ring-amber-400"
                />
                <label htmlFor="useFirebase" className="text-xs text-gray-300 font-bold cursor-pointer">
                  {form.useFirebase ? (
                    <span className="text-amber-400">เปิดใช้งาน Firebase</span>
                  ) : (
                    <span className="text-gray-500">ปิดใช้งาน Firebase</span>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Quick Paste JSON Helper Modal/Box */}
          {showJsonHelper && (
            <div className="p-4 bg-[#0b121e] border border-amber-500/30 rounded-xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <FileJson className="w-4 h-4" />
                  วางข้อความจากไฟล์ serviceAccountKey.json เพื่อดึงค่าอัตโนมัติ:
                </span>
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='วางเนื้อหา JSON เช่น {"type": "service_account", "project_id": "...", "private_key": "...", "client_email": "..."}'
                rows={4}
                className="w-full px-3 py-2 bg-[#070b13] border border-gray-700 rounded-lg text-xs font-mono text-gray-300 focus:outline-none focus:border-amber-400"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleParseJson}
                  disabled={!jsonInput.trim()}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold rounded-lg text-xs transition"
                >
                  แปลงและนำเข้าข้อมูลทันที
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-gray-300 mb-1.5">Firebase Project ID:</label>
              <input
                type="text"
                value={form.firebaseProjectId}
                onChange={(e) => setForm({ ...form, firebaseProjectId: e.target.value })}
                placeholder="เช่น corarevanilla-store"
                className="w-full px-3.5 py-2.5 bg-[#0b121e] border border-gray-700 rounded-xl text-white font-mono focus:border-amber-400 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-300 mb-1.5">Firebase Client Email:</label>
              <input
                type="text"
                value={form.firebaseClientEmail}
                onChange={(e) => setForm({ ...form, firebaseClientEmail: e.target.value })}
                placeholder="firebase-adminsdk-...@your-project-id.iam.gserviceaccount.com"
                className="w-full px-3.5 py-2.5 bg-[#0b121e] border border-gray-700 rounded-xl text-white font-mono focus:border-amber-400 focus:outline-none transition"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-bold text-gray-300">Firebase Private Key:</label>
                <button
                  type="button"
                  onClick={() => setShowFirebaseKey(!showFirebaseKey)}
                  className="text-gray-400 hover:text-gray-200 flex items-center gap-1 text-[11px]"
                >
                  {showFirebaseKey ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>ซ่อนคีย์</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>แสดงคีย์</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={form.firebasePrivateKey}
                onChange={(e) => setForm({ ...form, firebasePrivateKey: e.target.value })}
                placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                rows={3}
                className={`w-full px-3.5 py-2.5 bg-[#0b121e] border border-gray-700 rounded-xl text-amber-200 font-mono text-[11px] focus:border-amber-400 focus:outline-none transition ${
                  !showFirebaseKey && form.firebasePrivateKey ? 'filter blur-sm select-none' : ''
                }`}
              />
              <p className="mt-1 text-[11px] text-gray-500">
                💡 รับได้จาก Firebase Console → Project Settings → Service accounts → Generate new private key
              </p>
            </div>
          </div>

          {/* Test Firebase Connection Button & Result Box */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-800">
            <div className="text-[11px] text-gray-400">
              🔥 ข้อมูลจะถูกบันทึกและซิงค์เข้าคอลเลกชัน <code className="text-amber-300 font-mono">settings/default</code> บน Cloud Firestore
            </div>

            <button
              type="button"
              onClick={handleTestFirebase}
              disabled={testingFirebase || !form.firebaseProjectId}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-amber-400 font-bold rounded-xl text-xs transition self-start disabled:opacity-50"
            >
              {testingFirebase ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังทดสอบเชื่อมต่อ Firestore...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  ทดสอบการเชื่อมต่อ Firebase
                </>
              )}
            </button>
          </div>

          {firebaseResult && (
            <div
              className={`p-3.5 rounded-xl flex items-center gap-2.5 text-xs ${
                firebaseResult.success
                  ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}
            >
              {firebaseResult.success ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{firebaseResult.message}</span>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-black font-black rounded-xl shadow-lg shadow-sky-500/25 flex items-center gap-2 transition hover:scale-105 disabled:opacity-50 text-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                กำลังบันทึกการตั้งค่า...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                บันทึกการตั้งค่าทั้งหมด
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
