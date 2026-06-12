import { useEffect, useRef, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { CoachWeeklyAttendance } from '@/lib/attendanceCalc';
import { buildCoachBarOption } from '@/lib/chartConfigs';

interface Props {
  data: CoachWeeklyAttendance[];
  windowLabel?: string;
  onCoachClick?: (coachName: string) => void;
}

export default function CoachAttendanceBar({ data, windowLabel, onCoachClick }: Props) {
  const chartRef = useRef<ReactECharts>(null);

  const chartOption = useMemo<EChartsOption>(
    () => buildCoachBarOption(data, windowLabel),
    [data, windowLabel]
  );

  const events = useMemo(() => {
    if (!onCoachClick) return undefined;
    return {
      click: (params: any) => {
        if (params?.seriesName && typeof params.seriesName === 'string') {
          onCoachClick(params.seriesName);
        }
      },
    };
  }, [onCoachClick]);

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
        style={{ height: '100%', minHeight: 320, width: '100%', cursor: onCoachClick ? 'pointer' : 'default' }}
        notMerge={true}
        lazyUpdate={true}
        onEvents={events}
      />
    </div>
  );
}
