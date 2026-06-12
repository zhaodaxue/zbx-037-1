import { create } from 'zustand';
import type { AttendanceRecord } from '@/lib/dataLoader';
import {
  calcOverallStats,
  calcCoachWeeklyRates,
  calcCoachSummaries,
  calcStudentWeeklyTrends,
  calcLowAttendanceList,
  getWeeksForWindow,
  filterRecordsByWindow,
  hasCoachStudentPair,
  type OverallStats,
  type CoachWeeklyAttendance,
  type CoachSummary,
  type StudentWeeklyTrend,
  type LowAttendanceItem,
} from '@/lib/attendanceCalc';

export type TimeWindow = '4weeks' | '8weeks' | 'all';

const LOW_ATTENDANCE_THRESHOLD = 0.6;
const TOP_STUDENT_COUNT = 5;

interface DerivedData {
  windowRecords: AttendanceRecord[];
  weeks: Date[];
  overallStats: OverallStats;
  coachWeeklyRates: CoachWeeklyAttendance[];
  coachSummaries: CoachSummary[];
  studentTrends: StudentWeeklyTrend[];
  lowAttendanceList: LowAttendanceItem[];
}

interface DashboardState {
  records: AttendanceRecord[];
  timeWindow: TimeWindow;
  selectedCoach: string;
  focusStudent: string;
  loading: boolean;

  setRecords: (records: AttendanceRecord[]) => void;
  setLoading: (loading: boolean) => void;
  setTimeWindow: (w: TimeWindow) => void;
  setSelectedCoach: (c: string) => void;
  focusOnStudent: (coachName: string, studentName: string) => void;
  clearFocus: () => void;
  handleCoachClick: (coachName: string) => void;

  overallStats: OverallStats;
  coachWeeklyRates: CoachWeeklyAttendance[];
  coachSummaries: CoachSummary[];
  studentTrends: StudentWeeklyTrend[];
  lowAttendanceList: LowAttendanceItem[];
}

function recompute(
  records: AttendanceRecord[],
  timeWindow: TimeWindow,
  selectedCoach: string,
  focusStudent: string
): DerivedData {
  if (records.length === 0) {
    return {
      windowRecords: [],
      weeks: [],
      overallStats: {
        totalShould: 0,
        totalActual: 0,
        attendanceRate: 0,
        coachCount: 0,
        studentCount: 0,
        recordCount: 0,
      },
      coachWeeklyRates: [],
      coachSummaries: [],
      studentTrends: [],
      lowAttendanceList: [],
    };
  }

  const weeks = getWeeksForWindow(records, timeWindow);
  const windowRecords = filterRecordsByWindow(records, timeWindow);
  const overallStats = calcOverallStats(windowRecords);
  const coachWeeklyRates = calcCoachWeeklyRates(windowRecords, weeks);
  const coachSummaries = calcCoachSummaries(windowRecords, weeks);

  const forceStudent = focusStudent || undefined;
  const studentTrends = selectedCoach
    ? calcStudentWeeklyTrends(
        windowRecords,
        selectedCoach,
        weeks,
        TOP_STUDENT_COUNT,
        forceStudent
      )
    : [];

  const lowAttendanceList = calcLowAttendanceList(
    windowRecords,
    LOW_ATTENDANCE_THRESHOLD
  );

  return {
    windowRecords,
    weeks,
    overallStats,
    coachWeeklyRates,
    coachSummaries,
    studentTrends,
    lowAttendanceList,
  };
}

export const useDashboardStore = create<DashboardState>((set, get) => {
  const emptyDerived = recompute([], '4weeks', '', '');

  return {
    records: [],
    timeWindow: '4weeks',
    selectedCoach: '',
    focusStudent: '',
    loading: true,
    ...emptyDerived,

    setRecords: (records) => {
      const { timeWindow, selectedCoach: prevCoach, focusStudent: prevFocus } = get();
      let coach = prevCoach;
      let focus = prevFocus;

      if (records.length > 0) {
        const coachNames = Array.from(new Set(records.map((r) => r.coachName))).sort();
        if (!coachNames.includes(coach)) {
          coach = coachNames[0] ?? '';
        }

        const windowRecords = filterRecordsByWindow(records, timeWindow);
        if (focus && !hasCoachStudentPair(windowRecords, coach, focus)) {
          focus = '';
        }
      } else {
        coach = '';
        focus = '';
      }

      const derived = recompute(records, timeWindow, coach, focus);
      set({ records, selectedCoach: coach, focusStudent: focus, ...derived });
    },

    setLoading: (loading) => set({ loading }),

    setTimeWindow: (w) => {
      const { records, selectedCoach, focusStudent: prevFocus } = get();
      let focus = prevFocus;

      if (focus && records.length > 0 && selectedCoach) {
        const windowRecords = filterRecordsByWindow(records, w);
        if (!hasCoachStudentPair(windowRecords, selectedCoach, focus)) {
          focus = '';
        }
      }

      const derived = recompute(records, w, selectedCoach, focus);
      set({ timeWindow: w, focusStudent: focus, ...derived });
    },

    setSelectedCoach: (c) => {
      const { records, timeWindow, focusStudent: prevFocus } = get();
      let focus = prevFocus;

      if (focus && records.length > 0 && c) {
        const windowRecords = filterRecordsByWindow(records, timeWindow);
        if (!hasCoachStudentPair(windowRecords, c, focus)) {
          focus = '';
        }
      } else if (!c) {
        focus = '';
      }

      const derived = recompute(records, timeWindow, c, focus);
      set({ selectedCoach: c, focusStudent: focus, ...derived });
    },

    focusOnStudent: (coachName, studentName) => {
      const { records, timeWindow } = get();
      const windowRecords = filterRecordsByWindow(records, timeWindow);
      if (!hasCoachStudentPair(windowRecords, coachName, studentName)) return;

      const derived = recompute(records, timeWindow, coachName, studentName);
      set({ selectedCoach: coachName, focusStudent: studentName, ...derived });
    },

    clearFocus: () => {
      const { records, timeWindow, selectedCoach } = get();
      const derived = recompute(records, timeWindow, selectedCoach, '');
      set({ focusStudent: '', ...derived });
    },

    handleCoachClick: (coachName) => {
      const { records, timeWindow } = get();
      const coachNames = Array.from(new Set(records.map((r) => r.coachName)));
      if (!coachNames.includes(coachName)) return;

      const derived = recompute(records, timeWindow, coachName, '');
      set({ selectedCoach: coachName, focusStudent: '', ...derived });
    },
  };
});
