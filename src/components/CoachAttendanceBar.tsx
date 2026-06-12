import { useEffect, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { AttendanceRecord } from '@/lib/dataLoader';
import {
  calcCoachWeeklyRates,
  getRecentWeeks,
  getLatestRecordDate,
} from '@/lib/attendanceCalc';
import { buildCoachBarOption } from '@/lib/chartConfigs';

interface Props {
  records: AttendanceRecord[];
}

export default function CoachAttendanceBar({ records }: Props) {
  const chartRef = useRef<ReactECharts>(null);

  const chartOption = useMemo(() => {
    if (records.length === 0) {
      return {
        title: {
          text: '各教练近4周出勤率',
          left: 'center',
          top: 10,
          textStyle: { fontSize: 18, fontWeight: 600, color: '#1f2937' },
        },
        graphic: {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: { text: '暂无数据', fontSize: 16, fill: '#9ca3af' },
        },
      };
    }
    const refDate = getLatestRecordDate(records);
    const weeks = getRecentWeeks(refDate, 4);
    const data = calcCoachWeeklyRates(records, weeks);
    return buildCoachBarOption(data);
  }, [records]);

  useEffect(() => {
    const handleResize = () => {
      const inst = chartRef.current?.getEchartsInstance();
      inst?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-full">
      <ReactECharts
        ref={chartRef}
        option={chartOption}
        style={{ height: '100%', minHeight: 320, width: '100%' }}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
}
