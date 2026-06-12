import { useEffect, useRef, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { CoachWeeklyAttendance } from '@/lib/attendanceCalc';
import { buildCoachBarOption } from '@/lib/chartConfigs';

interface Props {
  data: CoachWeeklyAttendance[];
}

export default function CoachAttendanceBar({ data }: Props) {
  const chartRef = useRef<ReactECharts>(null);

  const chartOption = useMemo(() => buildCoachBarOption(data), [data]);

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
