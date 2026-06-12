import type { AttendanceRecord } from './dataLoader';

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
}

export interface LowAttendanceItem {
  coachName: string;
  studentName: string;
  attendanceRate: number;
  shouldCount: number;
  actualCount: number;
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

export function getRecentWeeks(referenceDate: Date, weekCount: number): Date[] {
  const weeks: Date[] = [];
  const refWeekStart = getWeekStart(referenceDate);
  for (let i = weekCount - 1; i >= 0; i--) {
    const weekStart = new Date(refWeekStart);
    weekStart.setDate(weekStart.getDate() - i * 7);
    weeks.push(weekStart);
  }
  return weeks;
}

export function isInWeek(dateStr: string, weekStart: Date): boolean {
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
  const coachNames = Array.from(new Set(records.map((r) => r.coachName)));

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

export function calcStudentWeeklyTrends(
  records: AttendanceRecord[],
  coachName: string,
  weeks: Date[]
): StudentWeeklyTrend[] {
  const coachRecords = records.filter((r) => r.coachName === coachName);
  const studentNames = Array.from(new Set(coachRecords.map((r) => r.studentName)));

  const studentStats = studentNames.map((name) => {
    const studentRecords = coachRecords.filter((r) => r.studentName === name);
    const totalShould = studentRecords.reduce((sum, r) => sum + r.shouldAttend, 0);
    const totalActual = studentRecords.reduce((sum, r) => sum + r.actualAttend, 0);
    return { name, totalShould, totalActual };
  });

  const topStudents = studentStats
    .filter((s) => s.totalShould > 0)
    .sort((a, b) => b.totalShould - a.totalShould)
    .slice(0, 5)
    .map((s) => s.name);

  const trends: StudentWeeklyTrend[] = [];

  for (const studentName of topStudents) {
    const studentRecords = coachRecords.filter((r) => r.studentName === studentName);
    const weekLabels: string[] = [];
    const rates: number[] = [];

    for (const week of weeks) {
      const weekRecords = studentRecords.filter((r) => isInWeek(r.classDate, week));
      const shouldCount = weekRecords.reduce((sum, r) => sum + r.shouldAttend, 0);
      const actualCount = weekRecords.reduce((sum, r) => sum + r.actualAttend, 0);
      weekLabels.push(formatWeekLabel(week));
      rates.push(shouldCount === 0 ? 0 : actualCount / shouldCount);
    }

    trends.push({ studentName, weekLabels, rates });
  }

  return trends;
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

export function getCoachList(records: AttendanceRecord[]): string[] {
  return Array.from(new Set(records.map((r) => r.coachName))).sort();
}

export function formatPercent(rate: number): string {
  return (rate * 100).toFixed(1) + '%';
}

export function getLatestRecordDate(records: AttendanceRecord[]): Date {
  if (records.length === 0) return new Date();
  const dates = records.map((r) => new Date(r.classDate).getTime());
  return new Date(Math.max(...dates));
}
