import React, { useEffect, useState } from 'react';
import { BookOpen, ShieldAlert, CheckCircle, Info } from 'lucide-react';
import { Rule } from '../types';
import { api } from '../services/api';

export const RulesPage: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRules()
      .then((res) => {
        if (res && res.rules) {
          setRules(res.rules);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Group rules by category
  const categoriesMap: { [cat: string]: Rule[] } = {};
  rules.forEach((r) => {
    if (!categoriesMap[r.category]) {
      categoriesMap[r.category] = [];
    }
    categoriesMap[r.category].push(r);
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4" />
          <span>ข้อบังคับและการอยู่ร่วมกัน</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">
          กฎกติกาเซิร์ฟเวอร์
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          เพื่อความสงบเรียบร้อยและสังคมที่น่าอยู่ กรุณาปฏิบัติตามกฎกติกาดังต่อไปนี้อย่างเคร่งครัด
        </p>
      </div>

      {/* Warning Box */}
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3 text-red-400 text-xs sm:text-sm">
        <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">บทลงโทษ:</span> การฝ่าฝืนกฎอาจได้รับโทษตั้งแต่การตักเตือน, ปิดเสียงแชท (Mute), แบนชั่วคราว, จนถึงการแบนถาวร (Ban IP/UUID) และริบคืนสิทธิ์การสนับสนุนโดยไม่คืนเงิน
        </div>
      </div>

      {/* Rules categorized */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-[#121927] rounded-2xl animate-pulse border border-gray-800"></div>
          ))}
        </div>
      ) : Object.keys(categoriesMap).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(categoriesMap).map(([catName, catRules]) => (
            <div key={catName} className="p-6 bg-[#121927] border border-gray-800 rounded-2xl shadow-lg space-y-4">
              <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2 border-b border-gray-800 pb-3">
                <CheckCircle className="w-5 h-5" />
                {catName}
              </h2>

              <div className="divide-y divide-gray-850">
                {catRules.map((rule, index) => (
                  <div key={rule.id} className="py-3.5 first:pt-1 last:pb-1">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="text-gray-500 font-mono text-xs">#{index + 1}</span>
                      {rule.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-400 leading-relaxed pl-6">
                      {rule.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-[#101724] border border-gray-800 rounded-2xl p-8">
          <Info className="w-16 h-16 text-gray-600 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-white">ยังไม่มีข้อมูลกฎในระบบ</h3>
        </div>
      )}
    </div>
  );
};
