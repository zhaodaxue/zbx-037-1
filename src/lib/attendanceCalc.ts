import type { AttendanceRecord } from './dataLoader';
import type { TimeWindow } from '@/store/dashboardStore';

export interface CoachWeeklyAttendance {
  coachName: string;
  weekLabel: string;
  attendanceRate: number;
  shouldCount: number;
  actualCount: number;
}

export interface StudentWeeklyTrend {
  studentName: string;
  weekLabels: string[];
  rates: number[];
  totalShould: number;
  totalActual: number;
}

export interface LowAttendanceItem {
  coachName: string;
  studentName: string;
  attendanceRate: number;
  shouldCount: number;
  actualCount: number;
}

export interface OverallStats {
  totalShould: number;
  totalActual: number;
  attendanceRate: number;
  coachCount: number;
  studentCount: number;
  recordCount: number;
}

export interface CoachSummary {
  coachName: string;
  avgAttendanceRate: number;
  totalShould: number;
  totalActual: number;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(date: Date): string {
  const d = getWeekStart(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}月${day}日起`;
}

export function getLatestRecordDate(records: AttendanceRecord[]): Date {
  if (records.length === 0) return new Date();
  const dates = records.map((r) => new Date(r.classDate).getTime());
  return new Date(Math.max(...dates));
}

export function getWeeksForWindow(
  records: AttendanceRecord[],
  window: TimeWindow
): Date[] {
  if (records.length === 0) return [];

  const refDate = getLatestRecordDate(records);

  if (window === 'all') {
    const allDates = records.map((r) => new Date(r.classDate));
    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

    const startWeek = getWeekStart(minDate);
    const endWeek = getWeekStart(maxDate);

    const weeks: Date[] = [];
    let current = new Date(startWeek);
    while (current <= endWeek) {
      weeks.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }
    return weeks;
  }

  const weekCount = window === '4weeks' ? 4 : 8;
  const weeks: Date[] = [];
  const refWeekStart = getWeekStart(refDate);
  for (let i = weekCount - 1; i >= 0; i--) {
    const weekStart = new Date(refWeekStart);
    weekStart.setDate(weekStart.getDate() - i * 7);
    weeks.push(weekStart);
  }
  return weeks;
}

function isInWeek(dateStr: string, weekStart: Date): boolean {
  const date = new Date(dateStr);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return date >= weekStart && date < weekEnd;
}

export function calcCoachWeeklyRates(
  records: AttendanceRecord[],
  weeks: Date[]
): CoachWeeklyAttendance[] {
  const result: CoachWeeklyAttendance[] = [];
  const coachNames = Array.from(new Set(records.map((r) => r.coachName))).sort();

  for (const coachName of coachNames) {
    for (const week of weeks) {
      const weekRecords = records.filter(
        (r) => r.coachName === coachName && isInWeek(r.classDate, week)
      );
      const shouldCount = weekRecords.reduce((sum, r) => sum + r.shouldAttend, 0);
      const actualCount = weekRecords.reduce((sum, r) => sum + r.actualAttend, 0);
      const attendanceRate = shouldCount === 0 ? 0 : actualCount / shouldCount;

      result.push({
        coachName,
        weekLabel: formatWeekLabel(week),
        attendanceRate,
        shouldCount,
        actualCount,
      });
    }
  }

  return result;
}

export function calcCoachSummaries(
  records: AttendanceRecord[],
  weeks: Date[]
): CoachSummary[] {
  const coachNames = Array.from(new Set(records.map((r) => r.coachName))).sort();
  const weeklyData = calcCoachWeeklyRates(records, weeks);

  return coachNames.map((coachName) => {
    const coachWeeks = weeklyData.filter((w) => w.coachName === coachName);
    const activeWeeks = coachWeeks.filter((w) => w.shouldCount > 0);
    const totalShould = coachWeeks.reduce((s, w) => s + w.shouldCount, 0);
    const totalActual = coachWeeks.reduce((s, w) => s + w.actualCount, 0);
    const avgRate =
      activeWeeks.length === 0
        ? 0
        : activeWeeks.reduce((s, w) => s + w.attendanceRate, 0) / activeWeeks.length;

    return {
      coachName,
      avgAttendanceRate: avgRate,
      totalShould,
      totalActual,
    };
  });
}

export function calcStudentWeeklyTrends(
  records: AttendanceRecord[],
  coachName: string,
  weeks: Date[],
  topCount: number = 5,
  forceStudent?: string
): StudentWeeklyTrend[] {
  const coachRecords = records.filter((r) => r.coachName === coachName);
  const studentNames = Array.from(new Set(coachRecords.map((r) => r.studentName)));

  const studentStats = studentNames.map((name) => {
    const studentRecords = coachRecords.filter((r) => r.studentName === name);
    const totalShould = studentRecords.reduce((sum, r) => sum + r.shouldAttend, 0);
    const totalActual = studentRecords.reduce((sum, r) => sum + r.actualAttend, 0);
    return { name, totalShould, totalActual };
  });

  const sortedStats = studentStats
    .filter((s) => s.totalShould > 0)
    .sort((a, b) => b.totalShould - a.totalShould);

  let topStudents: string[];
  if (forceStudent) {
    const forceStat = sortedStats.find((s) => s.name === forceStudent);
    if (forceStat) {
      const rest = sortedStats.filter((s) => s.name !== forceStudent);
      const restCount = Math.max(0, topCount - 1);
      topStudents = [forceStudent, ...rest.slice(0, restCount).map((s) => s.name)];
    } else {
      topStudents = sortedStats.slice(0, topCount).map((s) => s.name);
    }
  } else {
    topStudents = sortedStats.slice(0, topCount).map((s) => s.name);
  }

  const trends: StudentWeeklyTrend[] = [];

  for (const studentName of topStudents) {
    const studentRecords = coachRecords.filter((r) => r.studentName === studentName);
    const weekLabels: string[] = [];
    const rates: number[] = [];
    let totalShould = 0;
    let totalActual = 0;

    for (const week of weeks) {
      const weekRecords = studentRecords.filter((r) => isInWeek(r.classDate, week));
      const shouldCount = weekRecords.reduce((sum, r) => sum + r.shouldAttend, 0);
      const actualCount = weekRecords.reduce((sum, r) => sum + r.actualAttend, 0);
      weekLabels.push(formatWeekLabel(week));
      rates.push(shouldCount === 0 ? 0 : actualCount / shouldCount);
      totalShould += shouldCount;
      totalActual += actualCount;
    }

    trends.push({
      studentName,
      weekLabels,
      rates,
      totalShould,
      totalActual,
    });
  }

  return trends;
}

export function hasCoachStudentPair(
  records: AttendanceRecord[],
  coachName: string,
  studentName: string
): boolean {
  if (!coachName || !studentName) return false;
  const pair = records.find(
    (r) => r.coachName === coachName && r.studentName === studentName
  );
  if (!pair) return false;
  return pair.shouldAttend > 0;
}

export function calcLowAttendanceList(
  records: AttendanceRecord[],
  threshold: number = 0.6
): LowAttendanceItem[] {
  const pairMap = new Map<string, LowAttendanceItem>();

  for (const r of records) {
    const key = `${r.coachName}||${r.studentName}`;
    if (!pairMap.has(key)) {
      pairMap.set(key, {
        coachName: r.coachName,
        studentName: r.studentName,
        attendanceRate: 0,
        shouldCount: 0,
        actualCount: 0,
      });
    }
    const item = pairMap.get(key)!;
    item.shouldCount += r.shouldAttend;
    item.actualCount += r.actualAttend;
  }

  const list: LowAttendanceItem[] = [];
  for (const item of pairMap.values()) {
    if (item.shouldCount > 0) {
      item.attendanceRate = item.actualCount / item.shouldCount;
      if (item.attendanceRate < threshold) {
        list.push(item);
      }
    }
  }

  list.sort((a, b) => a.attendanceRate - b.attendanceRate);
  return list;
}

export function calcOverallStats(records: AttendanceRecord[]): OverallStats {
  if (records.length === 0) {
    return {
      totalShould: 0,
      totalActual: 0,
      attendanceRate: 0,
      coachCount: 0,
      studentCount: 0,
      recordCount: 0,
    };
  }
  const totalShould = records.reduce((s, r) => s + r.shouldAttend, 0);
  const totalActual = records.reduce((s, r) => s + r.actualAttend, 0);
  const coachCount = new Set(records.map((r) => r.coachName)).size;
  const studentCount = new Set(records.map((r) => r.studentName)).size;

  return {
    totalShould,
    totalActual,
    attendanceRate: totalShould === 0 ? 0 : totalActual / totalShould,
    coachCount,
    studentCount,
    recordCount: records.length,
  };
}

export function getCoachList(records: AttendanceRecord[]): string[] {
  return Array.from(new Set(records.map((r) => r.coachName))).sort();
}

export function formatPercent(rate: number): string {
  return (rate * 100).toFixed(1) + '%';
}

export function filterRecordsByWindow(
  records: AttendanceRecord[],
  window: TimeWindow
): AttendanceRecord[] {
  if (window === 'all') return records;
  const weeks = getWeeksForWindow(records, window);
  if (weeks.length === 0) return [];
  const startDate = weeks[0];
  const endDate = new Date(weeks[weeks.length - 1]);
  endDate.setDate(endDate.getDate() + 7);
  return records.filter((r) => {
    const d = new Date(r.classDate);
    return d >= startDate && d < endDate;
  });
}
