import { useEffect, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

type Server = {
  id: string;
  name: string;
  identifier: string;
  host: string | null;
  port: number;
  isActive: boolean;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  serverId: string;
  description: string | null;
};

export default function ServerCategoryAdmin() {
  const [servers, setServers] = useState<Server[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string>('');

  const [serverForm, setServerForm] = useState({
    name: '', identifier: '', host: '', port: 25575, rconPassword: '', isActive: true,
  });
  const [catForm, setCatForm] = useState({ name: '', slug: '', description: '' });

  const [msg, setMsg] = useState('');

  const token = localStorage.getItem('adminToken');
  const headers = { Authorization: `Bearer ${token}` };

  const loadServers = async () => {
    const r = await axios.get(`${API}/api/admin/servers`, { headers });
    setServers(r.data.servers);
    if (!selectedServerId && r.data.servers.length > 0) {
      setSelectedServerId(r.data.servers[0].id);
    }
  };

  const loadCategories = async (serverId?: string) => {
    const r = await axios.get(`${API}/api/admin/categories`, {
      headers,
      params: serverId ? { serverId } : {},
    });
    setCategories(r.data.categories);
  };

  useEffect(() => { loadServers(); }, []);
  useEffect(() => {
    if (selectedServerId) loadCategories(selectedServerId);
    else loadCategories();
  }, [selectedServerId]);

  // ---------- Servers ----------
  const createServer = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      await axios.post(`${API}/api/admin/servers`, serverForm, { headers });
      setMsg('✅ เพิ่มเซิร์ฟเวอร์สำเร็จ');
      setServerForm({ name: '', identifier: '', host: '', port: 25575, rconPassword: '', isActive: true });
      loadServers();
    } catch (err: any) {
      setMsg('❌ ' + (err.response?.data?.error || err.message));
    }
  };

  // ---------- Categories ----------
  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServerId) {
      setMsg('❌ กรุณาเลือกเซิร์ฟเวอร์ก่อนสร้างหมวดหมู่');
      return;
    }
    setMsg('');
    try {
      await axios.post(
        `${API}/api/admin/categories`,
        { ...catForm, serverId: selectedServerId },
        { headers }
      );
      setMsg('✅ เพิ่มหมวดหมู่สำเร็จ');
      setCatForm({ name: '', slug: '', description: '' });
      loadCategories(selectedServerId);
    } catch (err: any) {
      setMsg('❌ ' + (err.response?.data?.error || err.message));
    }
  };

  const removeServer = async (id: string) => {
    if (!confirm('ลบเซิร์ฟเวอร์นี้?')) return;
    try {
      await axios.delete(`${API}/api/admin/servers/${id}`, { headers });
      loadServers();
      loadCategories(selectedServerId);
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const removeCategory = async (id: string) => {
    if (!confirm('ลบหมวดหมู่นี้?')) return;
    try {
      await axios.delete(`${API}/api/admin/categories/${id}`, { headers });
      loadCategories(selectedServerId);
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">🖥️ จัดการเซิร์ฟเวอร์ & หมวดหมู่ (Firebase)</h1>

      {msg && <div className="bg-gray-800 p-3 rounded">{msg}</div>}

      {/* ---------- Servers ---------- */}
      <section>
        <h2 className="text-xl font-bold mb-3">เซิร์ฟเวอร์</h2>

        <form onSubmit={createServer} className="bg-gray-800 p-4 rounded space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="ชื่อ (เช่น smp)" value={serverForm.name}
              onChange={e => setServerForm({ ...serverForm, name: e.target.value })}
              className="p-2 rounded bg-gray-900" required />
            <input placeholder="identifier (เช่น smp)" value={serverForm.identifier}
              onChange={e => setServerForm({ ...serverForm, identifier: e.target.value })}
              className="p-2 rounded bg-gray-900" />
            <input placeholder="RCON Host" value={serverForm.host}
              onChange={e => setServerForm({ ...serverForm, host: e.target.value })}
              className="p-2 rounded bg-gray-900" />
            <input type="number" placeholder="Port" value={serverForm.port}
              onChange={e => setServerForm({ ...serverForm, port: Number(e.target.value) })}
              className="p-2 rounded bg-gray-900" />
          </div>
          <input placeholder="RCON Password" value={serverForm.rconPassword}
            onChange={e => setServerForm({ ...serverForm, rconPassword: e.target.value })}
            className="w-full p-2 rounded bg-gray-900" />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={serverForm.isActive}
              onChange={e => setServerForm({ ...serverForm, isActive: e.target.checked })} />
            เปิดใช้งาน
          </label>
          <button className="bg-green-600 px-4 py-2 rounded font-bold">➕ เพิ่มเซิร์ฟเวอร์</button>
        </form>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="p-2">ชื่อ</th>
              <th className="p-2">Identifier</th>
              <th className="p-2">Host:Port</th>
              <th className="p-2">สถานะ</th>
              <th className="p-2">ลบ</th>
            </tr>
          </thead>
          <tbody>
            {servers.map(s => (
              <tr key={s.id} className="border-b border-gray-800">
                <td className="p-2">{s.name}</td>
                <td className="p-2 font-mono text-sm">{s.identifier}</td>
                <td className="p-2 font-mono text-sm">{s.host}:{s.port}</td>
                <td className="p-2">{s.isActive ? '🟢' : '⚪'}</td>
                <td className="p-2">
                  <button onClick={() => removeServer(s.id)} className="text-red-500">ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ---------- Categories ---------- */}
      <section>
        <h2 className="text-xl font-bold mb-3">หมวดหมู่</h2>

        <div className="mb-3">
          <label className="block mb-1 text-sm">เลือกเซิร์ฟเวอร์เป้าหมาย:</label>
          <select
            value={selectedServerId}
            onChange={e => setSelectedServerId(e.target.value)}
            className="p-2 rounded bg-gray-900"
          >
            <option value="">-- ทั้งหมด --</option>
            {servers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <form onSubmit={createCategory} className="bg-gray-800 p-4 rounded space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="ชื่อหมวดหมู่ (เช่น smp)" value={catForm.name}
              onChange={e => setCatForm({ ...catForm, name: e.target.value })}
              className="p-2 rounded bg-gray-900" required />
            <input placeholder="slug (เว้นว่าง = อิงจากชื่อ)" value={catForm.slug}
              onChange={e => setCatForm({ ...catForm, slug: e.target.value })}
              className="p-2 rounded bg-gray-900" />
          </div>
          <input placeholder="คำอธิบาย (ไม่บังคับ)" value={catForm.description}
            onChange={e => setCatForm({ ...catForm, description: e.target.value })}
            className="w-full p-2 rounded bg-gray-900" />
          <button className="bg-green-600 px-4 py-2 rounded font-bold">➕ เพิ่มหมวดหมู่</button>
        </form>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="p-2">ชื่อ</th>
              <th className="p-2">Slug</th>
              <th className="p-2">Server ID</th>
              <th className="p-2">ลบ</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.id} className="border-b border-gray-800">
                <td className="p-2">{c.name}</td>
                <td className="p-2 font-mono text-sm">{c.slug}</td>
                <td className="p-2 font-mono text-xs">{c.serverId}</td>
                <td className="p-2">
                  <button onClick={() => removeCategory(c.id)} className="text-red-500">ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
