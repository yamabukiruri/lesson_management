import dayjs, { Dayjs } from "dayjs";
import { Timestamp } from "firebase/firestore";

export type LessonStatus = "scheduled" | "attended" | "absent" | "cancelled";

export interface Lesson {
  id: string;
  studentId: string;
  date: Dayjs;
  status: LessonStatus;
}

// 上限にカウントする状態（出席・当日欠席）
export const COUNTED_STATUSES: LessonStatus[] = ["attended", "absent"];

export interface ContractYearRange {
  start: Dayjs;
  end: Dayjs;
}

// 入学日を起点とした「現在の契約年」の範囲 [start, end)
export function getContractYearRange(
  startDate: Dayjs,
  now: Dayjs = dayjs()
): ContractYearRange {
  const anniversary = startDate.year(now.year()).startOf("day");
  const start = anniversary.isAfter(now, "day")
    ? anniversary.subtract(1, "year")
    : anniversary;
  return { start, end: start.add(1, "year") };
}

// 指定範囲内でカウント対象のレッスン数（消化数）
export function countConsumed(
  lessons: Lesson[],
  range: ContractYearRange
): number {
  return lessons.filter(
    (l) =>
      COUNTED_STATUSES.includes(l.status) &&
      !l.date.isBefore(range.start, "day") &&
      l.date.isBefore(range.end, "day")
  ).length;
}

// Firestore ドキュメントから Lesson へ整形（欠損に強い既定値付き）
export function toLesson(
  id: string,
  data: { studentId?: string; date?: Timestamp; status?: LessonStatus }
): Lesson {
  return {
    id,
    studentId: data.studentId ?? "",
    date: data.date ? dayjs(data.date.toDate()) : dayjs(0),
    status: data.status ?? "scheduled",
  };
}
