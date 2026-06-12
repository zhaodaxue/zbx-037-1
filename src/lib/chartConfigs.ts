import type { EChartsOption } from 'echarts';
import type { CoachWeeklyAttendance, StudentWeeklyTrend } from './attendanceCalc';

const COACH_COLORS = [
  '#e74c3c',
  '#3498db',
  '#2ecc71',
  '#f39c12',
  '#9b59b6',
  '#1abc9c',
  '#e67e22',
  '#34495e',
];

const STUDENT_COLORS = [
  '#e74c3c',
  '#3498db',
  '#2ecc71',
  '#f39c12',
  '#9b59b6',
  '#1abc9c',
  '#e67e22',
  '#34495e',
];

export function buildCoachBarOption(
  data: CoachWeeklyAttendance[],
  windowLabel: string = '近4周'
): EChartsOption {
  const weekLabels = Array.from(new Set(data.map((d) => d.weekLabel)));
  const coachNames = Array.from(new Set(data.map((d) => d.coachName)));

  const series = coachNames.map((coachName, idx) => {
    const coachData = weekLabels.map((week) => {
      const item = data.find((d) => d.coachName === coachName && d.weekLabel === week);
      return item ? Math.round(item.attendanceRate * 1000) / 10 : 0;
    });

    return {
      name: coachName,
      type: 'bar' as const,
      data: coachData,
      itemStyle: {
        color: COACH_COLORS[idx % COACH_COLORS.length],
        borderRadius: [4, 4, 0, 0],
      },
      barMaxWidth: 36,
      emphasis: {
        focus: 'series' as const,
      },
    };
  });

  return {
    title: {
      text: `各教练${windowLabel}出勤率`,
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 18,
        fontWeight: 600,
        color: '#1f2937',
      },
    },
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: {
        type: 'shadow' as const,
      },
      formatter: (params: any) => {
        const week = params[0].axisValue;
        let html = `<div style="font-weight:600;margin-bottom:6px;">${week}</div>`;
        params.forEach((p: any) => {
          html += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${p.color};"></span>
            <span>${p.seriesName}：<b>${p.value}%</b></span>
          </div>`;
        });
        return html;
      },
    },
    legend: {
      top: 45,
      left: 'center',
      itemWidth: 14,
      itemHeight: 14,
      textStyle: {
        color: '#4b5563',
      },
    },
    grid: {
      left: 50,
      right: 30,
      top: 90,
      bottom: 40,
      containLabel: true,
    },
    xAxis: {
      type: 'category' as const,
      data: weekLabels,
      axisLine: {
        lineStyle: { color: '#d1d5db' },
      },
      axisLabel: {
        color: '#4b5563',
        fontSize: 12,
      },
    },
    yAxis: {
      type: 'value' as const,
      min: 0,
      max: 100,
      axisLabel: {
        color: '#4b5563',
        formatter: '{value}%',
      },
      splitLine: {
        lineStyle: { color: '#f3f4f6' },
      },
    },
    series,
  };
}

export function buildStudentLineOption(
  data: StudentWeeklyTrend[],
  coachName: string,
  highlightStudent?: string
): EChartsOption {
  if (data.length === 0) {
    return {
      title: {
        text: `【${coachName}】学员出勤率趋势${highlightStudent ? ' · 聚焦' : ''}`,
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 18,
          fontWeight: 600,
          color: '#1f2937',
        },
      },
      grid: { left: 50, right: 30, top: 60, bottom: 40, containLabel: true },
      xAxis: { type: 'category' as const, data: [] },
      yAxis: {
        type: 'value' as const,
        min: 0,
        max: 100,
        axisLabel: { formatter: '{value}%' },
      },
      series: [],
      graphic: {
        type: 'text' as const,
        left: 'center',
        top: 'middle',
        style: {
          text: '暂无数据',
          fontSize: 16,
          fill: '#9ca3af',
        },
      },
    };
  }

  const weekLabels = data[0].weekLabels;
  const HIGHLIGHT_COLOR = '#dc2626';

  const series = data.map((trend, idx) => {
    const isHighlight = highlightStudent && trend.studentName === highlightStudent;
    const displayName = isHighlight ? `★ ${trend.studentName}` : trend.studentName;
    const color = isHighlight ? HIGHLIGHT_COLOR : STUDENT_COLORS[idx % STUDENT_COLORS.length];

    return {
      name: displayName,
      type: 'line' as const,
      data: trend.rates.map((r) => Math.round(r * 1000) / 10),
      smooth: true,
      symbol: 'circle' as const,
      symbolSize: isHighlight ? 12 : 8,
      z: isHighlight ? 10 : 1,
      lineStyle: {
        width: isHighlight ? 5 : 3,
        color,
        shadowBlur: isHighlight ? 8 : 0,
        shadowColor: isHighlight ? 'rgba(220, 38, 38, 0.35)' : 'transparent',
      },
      itemStyle: {
        color,
        borderWidth: isHighlight ? 3 : 2,
        borderColor: '#fff',
      },
      emphasis: {
        focus: 'series' as const,
        scale: isHighlight ? true : true,
      },
    };
  });

  return {
    title: {
      text: `【${coachName}】学员出勤率趋势${highlightStudent ? ' · 聚焦' : ''}`,
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 18,
        fontWeight: 600,
        color: '#1f2937',
      },
    },
    tooltip: {
      trigger: 'axis' as const,
      formatter: (params: any) => {
        const week = params[0].axisValue;
        let html = `<div style="font-weight:600;margin-bottom:6px;">${week}</div>`;
        params.forEach((p: any) => {
          const isFocus = p.seriesName.startsWith('★ ');
          const name = isFocus ? p.seriesName.slice(2) : p.seriesName;
          html += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};${isFocus ? 'box-shadow:0 0 0 2px #fff,0 0 0 3px ' + p.color : ''}"></span>
            <span>${isFocus ? '★ <b>' : ''}${name}${isFocus ? '</b>' : ''}：<b style="color:${p.color};">${p.value}%</b></span>
          </div>`;
        });
        return html;
      },
    },
    legend: {
      top: 45,
      left: 'center',
      itemWidth: 14,
      itemHeight: 14,
      textStyle: {
        color: '#4b5563',
      },
    },
    grid: {
      left: 50,
      right: 30,
      top: 90,
      bottom: 40,
      containLabel: true,
    },
    xAxis: {
      type: 'category' as const,
      boundaryGap: false,
      data: weekLabels,
      axisLine: {
        lineStyle: { color: '#d1d5db' },
      },
      axisLabel: {
        color: '#4b5563',
        fontSize: 12,
      },
    },
    yAxis: {
      type: 'value' as const,
      min: 0,
      max: 100,
      axisLabel: {
        color: '#4b5563',
        formatter: '{value}%',
      },
      splitLine: {
        lineStyle: { color: '#f3f4f6' },
      },
    },
    series,
  };
}
