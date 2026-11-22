import React, { useState, useEffect } from 'react';
import { Terminal, Send, Server, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { GameServer } from '../../types';

export const AdminRcon: React.FC = () => {
  const [servers, setServers] = useState<GameServer[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [command, setCommand] = useState('list');
  const [output, setOutput] = useState<string[]>(['ยินดีต้อนรับสู่ corarevanilla RCON Console', 'พิมพ์คำสั่งเช่น "list", "say hello", หรือ "weather clear"']);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    api.getServers().then((res) => {
      if (res?.servers && res.servers.length > 0) {
        setServers(res.servers);
        setSelectedServerId(res.servers[0].id);
      }
    });
  }, []);

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    const cmd = command.trim();
    setOutput((prev) => [...prev, `> ${cmd}`]);
    setIsExecuting(true);

    try {
      const res = await api.admin.testRcon(cmd, selectedServerId);
      setOutput((prev) => [...prev, res.output || (res.success ? 'Command executed successfully.' : 'No response from server.')]);
    } catch (err: any) {
      setOutput((prev) => [...prev, `[ERROR] ${err.message}`]);
    } finally {
      setIsExecuting(false);
      setCommand('');
    }
  };

  const sampleCommands = ['list', 'say [Store] ทดสอบการส่งคำสั่ง RCON จากหน้าเว็บ', 'time set day', 'weather clear'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">RCON & คิวคำสั่งเซิร์ฟเวอร์</h1>
        <p className="text-xs text-gray-400 mt-1">
          ทดสอบส่งคำสั่ง Minecraft Console ไปยังเซิร์ฟเวอร์เกมผ่าน RCON ได้โดยตรงแบบ Real-time
        </p>
      </div>

      {/* Target Server Switcher */}
      <div className="flex items-center gap-3 p-4 bg-[#121927] border border-gray-800 rounded-2xl">
        <Server className="w-5 h-5 text-purple-400" />
        <span className="text-xs font-bold text-gray-300">เลือกเซิร์ฟเวอร์เป้าหมาย:</span>
        <select
          value={selectedServerId}
          onChange={(e) => setSelectedServerId(e.target.value)}
          className="px-3 py-1.5 bg-[#0e1422] border border-gray-700 rounded-xl text-xs text-white"
        >
          {servers.map((s) => (
            <option key={s.id} value={s.id}>{s.name} ({s.slug})</option>
          ))}
        </select>
      </div>

      {/* Terminal Output Window */}
      <div className="bg-[#090d16] border border-gray-800 rounded-2xl p-5 shadow-2xl space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-gray-850 pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
            <span className="text-gray-400 text-[11px] ml-2">Console Terminal</span>
          </div>
          <button
            onClick={() => setOutput(['Console cleared.'])}
            className="text-[10px] text-gray-500 hover:text-gray-300"
          >
            ล้างหน้าจอ
          </button>
        </div>

        {/* Output lines */}
        <div className="h-64 overflow-y-auto space-y-1.5 text-gray-300 scrollbar-thin">
          {output.map((line, idx) => (
            <div
              key={idx}
              className={`${
                line.startsWith('>')
                  ? 'text-cyan-400 font-bold'
                  : line.startsWith('[ERROR]')
                  ? 'text-red-400'
                  : 'text-gray-300'
              }`}
            >
              {line}
            </div>
          ))}
        </div>

        {/* Command Input */}
        <form onSubmit={handleSendCommand} className="flex gap-2 pt-2 border-t border-gray-850">
          <span className="text-cyan-400 font-bold self-center">&gt;</span>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="พิมพ์คำสั่ง Minecraft... (เช่น list, lp user Notch parent add vip)"
            className="flex-1 bg-transparent border-0 focus:outline-none text-white text-xs font-mono"
            disabled={isExecuting}
            autoFocus
          />
          <button
            type="submit"
            disabled={isExecuting || !command.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center gap-1.5 text-xs font-sans"
          >
            {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            ส่งคำสั่ง
          </button>
        </form>
      </div>

      {/* Quick shortcuts */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500">คำสั่งด่วน:</span>
        {sampleCommands.map((cmd) => (
          <button
            key={cmd}
            type="button"
            onClick={() => setCommand(cmd)}
            className="px-2.5 py-1 bg-[#121927] hover:bg-[#182235] border border-gray-800 text-gray-300 rounded-lg text-xs font-mono transition"
          >
            {cmd}
          </button>
        ))}
      </div>
    </div>
  );
};
