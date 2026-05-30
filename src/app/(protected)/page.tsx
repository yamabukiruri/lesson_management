"use client";

import Panel from "@/components/panel";
import {
  Box,
  Link,
  Stack,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { db } from "@/firebase";
import { useEffect, useState, useCallback } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { CardTitle } from "@/components/title";
import { MainBtn } from "@/components/button";
import { theme } from "@/library/theme";
import { useAuth } from "@/app/context/auth-context";
import { Student } from "./student/page";
import CustomTableCell from "@/components/table-cell";

// 修正された型定義
interface FormattedStudent extends Student {
  isToday: boolean;
  date: string;
  isAttendedToday: boolean;
  isAbsentToday: boolean;
  isForgotten: boolean;
}

interface Doc {
  docId: string;
  docData: FormattedStudent;
}

export default function Home() {
  const { user } = useAuth();

  const [students, setStudents] = useState<Doc[]>([]);
  const [forgottenStudents, setForgottenStudents] = useState<Doc[]>([]);

  // 日付境界を作成するヘルパー関数
  const createDateBoundaries = useCallback(() => {
    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    return { startOfToday, endOfToday };
  }, []);

  // 日付範囲チェック関数
  const isDateInRange = useCallback(
    (dateStr: string, start: Date, end: Date): boolean => {
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return date >= start && date <= end;
    },
    []
  );

  // 最新の日付を取得する関数
  const getLatestDate = useCallback((dates: string[]): string | null => {
    return dates.length > 0 ? dates[dates.length - 1] : null;
  }, []);

  // 学生データを処理する関数
  const processStudentData = useCallback(
    (rawDoc: QueryDocumentSnapshot<DocumentData>) => {
      const { startOfToday, endOfToday } = createDateBoundaries();
      const data = rawDoc.data() as Student;
      const schedule = data?.schedule || [];
      const attendedDate = data?.attendedDate || [];
      const absentDate = data?.absentDate || [];

      const nextScheduleDate = schedule[0] || null;
      const latestAttendedDate = getLatestDate(attendedDate);
      const latestAbsentDate = getLatestDate(absentDate);

      const isAttendedToday = latestAttendedDate
        ? isDateInRange(latestAttendedDate, startOfToday, endOfToday)
        : false;

      const isAbsentToday = latestAbsentDate
        ? isDateInRange(latestAbsentDate, startOfToday, endOfToday)
        : false;

      const isToday = nextScheduleDate
        ? isDateInRange(nextScheduleDate, startOfToday, endOfToday)
        : false;

      const isForgotten = nextScheduleDate
        ? new Date(nextScheduleDate) < startOfToday
        : false;

      return {
        docId: rawDoc.id,
        docData: {
          ...data,
          isToday,
          date: nextScheduleDate || "未設定",
          isAttendedToday,
          isAbsentToday,
          isForgotten,
        },
      };
    },
    [createDateBoundaries, isDateInRange, getLatestDate]
  );

  useEffect(() => {
    if (!user) return;
    //リアルタイムでデータ更新
    const unsubscribe = onSnapshot(
      collection(db, "users", user.uid, "students"),
      (querySnapshot) => {
        try {
          const formattedStudents = querySnapshot.docs.map(processStudentData);

          // 時間順にソート
          formattedStudents.sort((a, b) => {
            const timeA = new Date(a.docData.date).getTime();
            const timeB = new Date(b.docData.date).getTime();
            return timeA - timeB;
          });

          // 退会済みを除外
          const activeStudents = formattedStudents.filter(
            ({ docData }) => !docData.isWithdrawn
          );

          // 今日の生徒と忘れた生徒を分ける
          const todayStudents = activeStudents.filter(
            ({ docData }) =>
              docData.isToday ||
              docData.isAttendedToday ||
              docData.isAbsentToday
          );

          const forgottenStudents = activeStudents.filter(
            ({ docData }) => docData.isForgotten
          );

          setStudents(todayStudents);
          setForgottenStudents(forgottenStudents);
        } catch (error) {
          console.error("Error processing snapshot data:", error);
        }
      }
    );

    // クリーンアップ関数
    return () => unsubscribe();
  }, [user, processStudentData]);

  // 出席登録
  const updateAttendance = useCallback(
    async (id: string, attendedDate: string[], schedule: string[]) => {
      if (!user || !schedule[0]) return;

      const docRef = doc(db, "users", user.uid, "students", id);
      const updated = [...attendedDate, schedule[0]].sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      );

      await updateDoc(docRef, {
        attendedDate: updated,
        schedule: schedule.slice(1),
      });
    },
    [user]
  );

  // 欠席登録
  const updateAbsence = useCallback(
    async (id: string, absentDate: string[], schedule: string[]) => {
      if (!user || !schedule[0]) return;

      const docRef = doc(db, "users", user.uid, "students", id);
      const updated = [...absentDate, schedule[0]].sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      );

      await updateDoc(docRef, {
        absentDate: updated,
        schedule: schedule.slice(1),
      });
    },
    [user]
  );

  // 出欠登録の取り消し(直近の登録を schedule に戻す)
  const undoAttendance = useCallback(
    async (id: string, attendedDate: string[], schedule: string[]) => {
      if (!user || attendedDate.length === 0) return;

      const confirmed = window.confirm(
        "出席登録を取り消します。よろしいですか？"
      );
      if (!confirmed) return;

      const restored = attendedDate[attendedDate.length - 1];
      const newSchedule = [...schedule, restored].sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      );

      const docRef = doc(db, "users", user.uid, "students", id);
      await updateDoc(docRef, {
        attendedDate: attendedDate.slice(0, -1),
        schedule: newSchedule,
      });
    },
    [user]
  );

  const undoAbsence = useCallback(
    async (id: string, absentDate: string[], schedule: string[]) => {
      if (!user || absentDate.length === 0) return;

      const confirmed = window.confirm(
        "欠席登録を取り消します。よろしいですか？"
      );
      if (!confirmed) return;

      const restored = absentDate[absentDate.length - 1];
      const newSchedule = [...schedule, restored].sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      );

      const docRef = doc(db, "users", user.uid, "students", id);
      await updateDoc(docRef, {
        absentDate: absentDate.slice(0, -1),
        schedule: newSchedule,
      });
    },
    [user]
  );

  // カウントリセット
  const resetCount = useCallback(
    async (id: string) => {
      if (!user) return;

      const confirmed = window.confirm(
        "出欠登録をしたレッスン日を全て削除し、カウントを0にリセットします。よろしいですか？"
      );

      if (!confirmed) return;

      const docRef = doc(db, "users", user.uid, "students", id);
      await updateDoc(docRef, {
        absentDate: [],
        attendedDate: [],
      });
    },
    [user]
  );

  // 共通テーブル行コンポーネント
  const StudentTableRow = useCallback(
    ({
      student,
      showFullDateTime = false,
    }: {
      student: Doc;
      showFullDateTime?: boolean;
    }) => {
      const isFullCount =
        student.docData.attendedDate.length +
          student.docData.absentDate.length >=
        Number(student.docData.maxCount);

      const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return showFullDateTime
          ? date.toLocaleTimeString("ja-JP", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
          : date.toLocaleTimeString("ja-JP", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });
      };

      const renderAttendanceStatus = () => {
        if (student.docData.isAttendedToday) {
          return (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems="center"
              justifyContent="center"
            >
              <Typography
                sx={{ fontWeight: 700, color: theme.palette.primary.dark }}
              >
                出席
              </Typography>
              <MainBtn
                label="取り消し"
                sx={{
                  backgroundColor: "transparent",
                  color: theme.palette.primary.main,
                  border: `1px solid ${theme.palette.primary.main}`,
                  padding: "6px 12px",
                  fontSize: "0.85rem",
                  "&:hover": {
                    backgroundColor: theme.palette.secondary.light,
                  },
                }}
                onClick={() =>
                  undoAttendance(
                    student.docId,
                    student.docData.attendedDate,
                    student.docData.schedule
                  )
                }
              />
            </Stack>
          );
        }
        if (student.docData.isAbsentToday) {
          return (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems="center"
              justifyContent="center"
            >
              <Typography
                sx={{ fontWeight: 700, color: theme.palette.primary.dark }}
              >
                欠席
              </Typography>
              <MainBtn
                label="取り消し"
                sx={{
                  backgroundColor: "transparent",
                  color: theme.palette.primary.main,
                  border: `1px solid ${theme.palette.primary.main}`,
                  padding: "6px 12px",
                  fontSize: "0.85rem",
                  "&:hover": {
                    backgroundColor: theme.palette.secondary.light,
                  },
                }}
                onClick={() =>
                  undoAbsence(
                    student.docId,
                    student.docData.absentDate,
                    student.docData.schedule
                  )
                }
              />
            </Stack>
          );
        }
        if (isFullCount) return "レッスン回数が上限に達しています";

        return (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems="center"
            justifyContent="center"
          >
            <MainBtn
              label="出席"
              onClick={() =>
                updateAttendance(
                  student.docId,
                  student.docData.attendedDate,
                  student.docData.schedule
                )
              }
            />
            <MainBtn
              label="欠席"
              onClick={() =>
                updateAbsence(
                  student.docId,
                  student.docData.absentDate,
                  student.docData.schedule
                )
              }
            />
          </Stack>
        );
      };

      return (
        <TableRow
          key={student.docId}
          sx={{
            backgroundColor: isFullCount
              ? theme.palette.tertiary.light
              : undefined,
          }}
        >
          <CustomTableCell>{formatTime(student.docData.date)}</CustomTableCell>
          <CustomTableCell>
            <Link
              href={`/student/${student.docId}`}
              sx={{
                color: theme.palette.primary.main,
                fontWeight: "bold",
              }}
            >
              {`${student.docData.lastName} ${student.docData.firstName}`}
            </Link>
          </CustomTableCell>
          <CustomTableCell>{renderAttendanceStatus()}</CustomTableCell>
          <CustomTableCell>
            {`${
              student.docData.attendedDate.length +
              student.docData.absentDate.length
            } / ${student.docData.maxCount}`}
          </CustomTableCell>
          <CustomTableCell>
            {isFullCount ? (
              <MainBtn
                label="リセット"
                onClick={() => resetCount(student.docId)}
              />
            ) : (
              "-"
            )}
          </CustomTableCell>
        </TableRow>
      );
    },
    [updateAttendance, updateAbsence, undoAttendance, undoAbsence, resetCount]
  );

  // 共通テーブルコンポーネント
  const StudentTable = useCallback(
    ({
      students,
      showFullDateTime = false,
      timeColumnLabel = "時間",
    }: {
      students: Doc[];
      showFullDateTime?: boolean;
      timeColumnLabel?: string;
    }) => (
      <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
        <Table sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow>
              <CustomTableCell>{timeColumnLabel}</CustomTableCell>
              <CustomTableCell>名前</CustomTableCell>
              <CustomTableCell>出席登録</CustomTableCell>
              <CustomTableCell>登録レッスン回数</CustomTableCell>
              <CustomTableCell>カウントリセット</CustomTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <StudentTableRow
                key={student.docId}
                student={student}
                showFullDateTime={showFullDateTime}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    ),
    [StudentTableRow]
  );

  return (
    <Box sx={{ width: "100%" }}>
      {forgottenStudents.length > 0 ? (
        <Panel sx={{ display: "grid" }}>
          <CardTitle label="出席登録忘れ" />
          <Typography>以下の生徒の出席登録を行ってください。</Typography>
          <StudentTable
            students={forgottenStudents}
            showFullDateTime={true}
            timeColumnLabel="対象日時"
          />
        </Panel>
      ) : (
        <Panel sx={{ display: "grid" }}>
          <CardTitle label="本日の生徒" />
          <StudentTable
            students={students}
            showFullDateTime={false}
            timeColumnLabel="時間"
          />
        </Panel>
      )}
    </Box>
  );
}
