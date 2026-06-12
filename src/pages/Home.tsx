import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, BarChart3, Users, Table2, FileText, Dumbbell } from 'lucide-react';
import type { AttendanceRecord } from '@/lib/dataLoader';
import { loadSampleCSV, loadCSVFromFile } from '@/lib/dataLoader';
import {
  getCoachList,
  formatPercent,
  calcCoachWeeklyRates,
  getRecentWeeks,
  getLatestRecordDate,
} from '@/lib/attendanceCalc';
import CoachAttendanceBar from '@/components/CoachAttendanceBar';
import StudentTrendLine from '@/components/StudentTrendLine';
import LowAttendanceTable from '@/components/LowAttendanceTable';

export default function Home() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoach, setSelectedCoach] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSampleCSV()
      .then((data) => {
        setRecords(data);
        if (data.length > 0) {
          const coaches = getCoachList(data);
          setSelectedCoach(coaches[0] ?? '');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const coachList = useMemo(() => getCoachList(records), [records]);

  useEffect(() => {
    if (coachList.length > 0 && !coachList.includes(selectedCoach)) {
      setSelectedCoach(coachList[0]);
    }
  }, [coachList, selectedCoach]);

  const stats = useMemo(() => {
    if (records.length === 0) {
      return {
        totalShould: 0,
        totalActual: 0,
        overallRate: 0,
        coachCount: 0,
        studentCount: 0,
      };
    }
    const totalShould = records.reduce((s, r) => s + r.shouldAttend, 0);
    const totalActual = records.reduce((s, r) => s + r.actualAttend, 0);
    const studentCount = new Set(records.map((r) => r.studentName)).size;
    return {
      totalShould,
      totalActual,
      overallRate: totalShould === 0 ? 0 : totalActual / totalShould,
      coachCount: coachList.length,
      studentCount,
    };
  }, [records, coachList]);

  const coachLatestRates = useMemo(() => {
    if (records.length === 0) return new Map<string, number>();
    const refDate = getLatestRecordDate(records);
    const weeks = getRecentWeeks(refDate, 4);
    const data = calcCoachWeeklyRates(records, weeks);
    const map = new Map<string, { sum: number; count: number }>();
    for (const d of data) {
      if (!map.has(d.coachName)) map.set(d.coachName, { sum: 0, count: 0 });
      const acc = map.get(d.coachName)!;
      if (d.shouldCount > 0) {
        acc.sum += d.attendanceRate;
        acc.count += 1;
      }
    }
    const result = new Map<string, number>();
    for (const [name, { sum, count }] of map) {
      result.set(name, count === 0 ? 0 : sum / count);
    }
    return result;
  }, [records]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const data = await loadCSVFromFile(file);
      setRecords(data);
      if (data.length > 0) {
        const coaches = getCoachList(data);
        setSelectedCoach(coaches[0] ?? '');
      }
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUseSample = async () => {
    setLoading(true);
    try {
      const data = await loadSampleCSV();
      setRecords(data);
      if (data.length > 0) {
        const coaches = getCoachList(data);
        setSelectedCoach(coaches[0] ?? '');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-200">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 leading-tight">
                武馆私教课出勤看板
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Private Martial Arts Attendance Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleUseSample}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            >
              <FileText className="w-4 h-4" />
              加载样例
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-md shadow-orange-200/60 hover:shadow-lg hover:shadow-orange-200 transition-all"
            >
              <Upload className="w-4 h-4" />
              上传 CSV
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<BarChart3 className="w-5 h-5" />}
            label="整体出勤率"
            value={formatPercent(stats.overallRate)}
            sub={`${stats.totalActual} / ${stats.totalShould} 节课`}
            accent="from-emerald-500 to-teal-600"
            loading={loading}
          />
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="教练数"
            value={`${stats.coachCount}`}
            sub="位在职教练"
            accent="from-sky-500 to-blue-600"
            loading={loading}
          />
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="学员数"
            value={`${stats.studentCount}`}
            sub="名注册学员"
            accent="from-violet-500 to-purple-600"
            loading={loading}
          />
          <StatCard
            icon={<Table2 className="w-5 h-5" />}
            label="总记录数"
            value={`${records.length}`}
            sub="条出勤记录"
            accent="from-rose-500 to-pink-600"
            loading={loading}
          />
        </section>

        {loading ? (
          <div className="h-[600px] flex items-center justify-center text-gray-400">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
              <p className="text-sm">正在加载数据...</p>
            </div>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 xl:grid-cols-5 gap-5">
              <div className="xl:col-span-3 min-h-[380px] flex flex-col">
                <CoachAttendanceBar records={records} />
              </div>
              <div className="xl:col-span-2 min-h-[380px] flex flex-col">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700">
                        选择教练查看学员趋势
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        展示该教练下学员每周出勤率变化
                      </p>
                    </div>
                    <select
                      value={selectedCoach}
                      onChange={(e) => setSelectedCoach(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
                    >
                      {coachList.map((c) => {
                        const rate = coachLatestRates.get(c) ?? 0;
                        return (
                          <option key={c} value={c}>
                            {c}（近4周均 {formatPercent(rate)}）
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                <StudentTrendLine records={records} selectedCoach={selectedCoach} />
              </div>
            </section>

            <section className="min-h-[380px]">
              <LowAttendanceTable records={records} threshold={0.6} />
            </section>
          </>
        )}

        <footer className="pt-4 pb-6 text-center text-xs text-gray-400">
          私教课出勤分析 · CSV 字段：教练名 / 学员昵称 / 课次日期 / 应到标记(1/0) / 实到标记(1/0)
        </footer>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 relative overflow-hidden group hover:shadow-md transition-shadow">
      <div
        className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${accent} opacity-[0.08] group-hover:scale-125 transition-transform duration-500`}
      />
      {loading ? (
        <div className="space-y-2">
          <div className="h-5 w-3/5 bg-gray-100 rounded animate-pulse" />
          <div className="h-8 w-2/3 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-4/5 bg-gray-100 rounded animate-pulse" />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <span
              className={`inline-flex p-1.5 rounded-md bg-gradient-to-br ${accent} text-white shadow-sm`}
            >
              {icon}
            </span>
            <span className="text-xs font-medium">{label}</span>
          </div>
          <div className="text-3xl font-bold text-gray-800 tabular-nums tracking-tight">
            {value}
          </div>
          <div className="text-xs text-gray-400 mt-1">{sub}</div>
        </>
      )}
    </div>
  );
}
