import { AlertTriangle } from 'lucide-react';
import type { LowAttendanceItem } from '@/lib/attendanceCalc';
import { formatPercent } from '@/lib/attendanceCalc';

interface Props {
  data: LowAttendanceItem[];
  threshold?: number;
}

export default function LowAttendanceTable({ data, threshold = 0.6 }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-800">
            出勤率低于 {formatPercent(threshold)} 的学员
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            共 {data.length} 组需要关注的「教练-学员」组合
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto -mx-1">
        {data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-3">
              <svg
                className="w-7 h-7 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm">所有学员出勤率均达标！</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-gray-100 sticky top-0 bg-white">
                <th className="text-left py-2.5 px-2 font-medium">教练</th>
                <th className="text-left py-2.5 px-2 font-medium">学员</th>
                <th className="text-right py-2.5 px-2 font-medium">应到</th>
                <th className="text-right py-2.5 px-2 font-medium">实到</th>
                <th className="text-right py-2.5 px-2 font-medium">出勤率</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => {
                const rate = item.attendanceRate;
                let rateColor = 'text-red-600 bg-red-50';
                if (rate >= 0.5 && rate < threshold) {
                  rateColor = 'text-orange-600 bg-orange-50';
                }
                return (
                  <tr
                    key={`${item.coachName}-${item.studentName}`}
                    className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${
                      idx % 2 === 1 ? 'bg-gray-50/30' : ''
                    }`}
                  >
                    <td className="py-2.5 px-2 text-gray-700 font-medium">
                      {item.coachName}
                    </td>
                    <td className="py-2.5 px-2 text-gray-800">{item.studentName}</td>
                    <td className="py-2.5 px-2 text-right text-gray-600 tabular-nums">
                      {item.shouldCount}
                    </td>
                    <td className="py-2.5 px-2 text-right text-gray-600 tabular-nums">
                      {item.actualCount}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums ${rateColor}`}
                      >
                        {formatPercent(rate)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
