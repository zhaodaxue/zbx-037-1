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
  loading: boolean;

  setRecords: (records: AttendanceRecord[]) => void;
  setLoading: (loading: boolean) => void;
  setTimeWindow: (w: TimeWindow) => void;
  setSelectedCoach: (c: string) => void;

  overallStats: OverallStats;
  coachWeeklyRates: CoachWeeklyAttendance[];
  coachSummaries: CoachSummary[];
  studentTrends: StudentWeeklyTrend[];
  lowAttendanceList: LowAttendanceItem[];
}

function recompute(
  records: AttendanceRecord[],
  timeWindow: TimeWindow,
  selectedCoach: string
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

  const studentTrends = selectedCoach
    ? calcStudentWeeklyTrends(windowRecords, selectedCoach, weeks, TOP_STUDENT_COUNT)
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
  const emptyDerived = recompute([], '4weeks', '');

  return {
    records: [],
    timeWindow: '4weeks',
    selectedCoach: '',
    loading: true,
    ...emptyDerived,

    setRecords: (records) => {
      const { timeWindow, selectedCoach } = get();
      let coach = selectedCoach;

      if (records.length > 0) {
        const coachNames = Array.from(new Set(records.map((r) => r.coachName))).sort();
        if (!coachNames.includes(coach)) {
          coach = coachNames[0] ?? '';
        }
      } else {
        coach = '';
      }

      const derived = recompute(records, timeWindow, coach);
      set({ records, selectedCoach: coach, ...derived });
    },

    setLoading: (loading) => set({ loading }),

    setTimeWindow: (w) => {
      const { records, selectedCoach } = get();
      const derived = recompute(records, w, selectedCoach);
      set({ timeWindow: w, ...derived });
    },

    setSelectedCoach: (c) => {
      const { records, timeWindow } = get();
      const derived = recompute(records, timeWindow, c);
      set({ selectedCoach: c, ...derived });
    },
  };
});
