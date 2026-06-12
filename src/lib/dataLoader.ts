export interface AttendanceRecord {
  coachName: string;
  studentName: string;
  classDate: string;
  shouldAttend: number;
  actualAttend: number;
}

export function parseCSV(csvText: string): AttendanceRecord[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const headers = headerLine.split(',').map((h) => h.trim());

  const idxMap: Record<string, number> = {};
  headers.forEach((h, i) => {
    idxMap[h] = i;
  });

  const records: AttendanceRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());
    if (cols.length < 5) continue;

    records.push({
      coachName: cols[idxMap['教练名'] ?? 0],
      studentName: cols[idxMap['学员昵称'] ?? 1],
      classDate: cols[idxMap['课次日期'] ?? 2],
      shouldAttend: parseInt(cols[idxMap['应到标记'] ?? 3], 10) || 0,
      actualAttend: parseInt(cols[idxMap['实到标记'] ?? 4], 10) || 0,
    });
  }

  return records;
}

export async function loadCSVFromFile(file: File): Promise<AttendanceRecord[]> {
  const text = await file.text();
  return parseCSV(text);
}

export async function loadSampleCSV(): Promise<AttendanceRecord[]> {
  const resp = await fetch('/attendance_sample.csv');
  const text = await resp.text();
  return parseCSV(text);
}
