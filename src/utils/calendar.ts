import { isHoliday } from "@holiday-jp/holiday_jp";

export type Term = "first" | "second"; // 前期 / 後期

export interface MonthRef {
  year: number;
  month: number; // 1-12
}

export function getCurrentAcademicYear(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 4 ? year : year - 1;
}

export function getCurrentTerm(): Term {
  const month = new Date().getMonth() + 1;
  return month >= 4 && month <= 9 ? "first" : "second";
}

export function getMonthsForTerm(
  academicYear: number,
  term: Term
): MonthRef[] {
  if (term === "first") {
    return [4, 5, 6, 7, 8, 9].map((month) => ({ year: academicYear, month }));
  }
  return [
    { year: academicYear, month: 10 },
    { year: academicYear, month: 11 },
    { year: academicYear, month: 12 },
    { year: academicYear + 1, month: 1 },
    { year: academicYear + 1, month: 2 },
    { year: academicYear + 1, month: 3 },
  ];
}

export function getMonthGrid(
  year: number,
  month: number
): (Date | null)[][] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, month - 1, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

export function isJapaneseHoliday(date: Date): boolean {
  return isHoliday(date);
}

export function getTermLabel(term: Term): string {
  return term === "first" ? "前期" : "後期";
}
