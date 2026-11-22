import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, User, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.adminLogin({ username, password });
      loginWithToken(res.token, res.admin);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'ชื่อผู้ใช้หรือรหัสผ่านแอดมินไม่ถูกต้อง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121927] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-center justify-center text-purple-400 mx-auto shadow-sm">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white">เข้าสู่ระบบหลังบ้านแอดมิน</h1>
          <p className="text-xs text-gray-400">สำหรับผู้ดูแลระบบ corarevanilla Network เท่านั้น</p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5">ชื่อผู้ดูแลระบบ (Username)</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#0d131f] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm font-medium transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5">รหัสผ่าน (Password)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#0d131f] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm font-medium transition"
                required
              />
            </div>
          </div>



          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition hover:scale-[1.01]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                กำลังตรวจสอบสิทธิ์...
              </>
            ) : (
              'เข้าสู่ระบบแอดมิน'
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-800">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            กลับสู่หน้าร้านค้า
          </Link>
        </div>
      </div>
    </div>
  );
};
