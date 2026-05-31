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
import { useEffect, useState, useMemo, useCallback } from "react";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import dayjs, { Dayjs } from "dayjs";
import { CardTitle } from "@/components/title";
import { MainBtn, SubBtn } from "@/components/button";
import { theme } from "@/library/theme";
import { useAuth } from "@/app/context/auth-context";
import CustomTableCell from "@/components/table-cell";
import {
  countConsumed,
  getContractYearRange,
  toLesson,
  type Lesson,
  type LessonStatus,
} from "@/utils/lesson";

interface StudentInfo {
  id: string;
  lastName: string;
  firstName: string;
  countStartDate: Dayjs | null;
  maxCount: number;
  isWithdrawn: boolean;
}

export default function Home() {
  const { user } = useAuth();

  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      collection(db, "users", user.uid, "students"),
      (snap) => {
        setStudents(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              lastName: data.lastName ?? "",
              firstName: data.firstName ?? "",
              countStartDate: data.countStartDate
                ? dayjs(data.countStartDate.toDate())
                : data.startDate
                ? dayjs(data.startDate.toDate())
                : null,
              maxCount: Number(data.maxCount ?? 0),
              isWithdrawn: data.isWithdrawn ?? false,
            };
          })
        );
      }
    );
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      collection(db, "users", user.uid, "lessons"),
      (snap) => {
        setLessons(snap.docs.map((d) => toLesson(d.id, d.data())));
      }
    );
    return () => unsub();
  }, [user]);

  const studentMap = useMemo(() => {
    const m = new Map<string, StudentInfo>();
    students.forEach((s) => m.set(s.id, s));
    return m;
  }, [students]);

  // 生徒ごとの現契約年の消化数
  const consumedMap = useMemo(() => {
    const m = new Map<string, number>();
    students.forEach((s) => {
      if (!s.countStartDate) {
        m.set(s.id, 0);
        return;
      }
      const range = getContractYearRange(s.countStartDate);
      const own = lessons.filter((l) => l.studentId === s.id);
      m.set(s.id, countConsumed(own, range));
    });
    return m;
  }, [students, lessons]);

  // 退会していない生徒のレッスンのみ対象
  const activeLessons = useMemo(() => {
    return lessons
      .filter((l) => {
        const s = studentMap.get(l.studentId);
        return s && !s.isWithdrawn;
      })
      .sort((a, b) => a.date.valueOf() - b.date.valueOf());
  }, [lessons, studentMap]);

  const todayLessons = useMemo(() => {
    const start = dayjs().startOf("day");
    const end = dayjs().endOf("day");
    return activeLessons.filter(
      (l) => !l.date.isBefore(start) && !l.date.isAfter(end)
    );
  }, [activeLessons]);

  const forgottenLessons = useMemo(() => {
    const start = dayjs().startOf("day");
    return activeLessons.filter(
      (l) => l.status === "scheduled" && l.date.isBefore(start)
    );
  }, [activeLessons]);

  const updateStatus = useCallback(
    async (lessonId: string, status: LessonStatus, confirmMessage?: string) => {
      if (!user) return;
      if (confirmMessage && !window.confirm(confirmMessage)) return;
      await updateDoc(doc(db, "users", user.uid, "lessons", lessonId), {
        status,
      });
    },
    [user]
  );

  const LessonRow = useCallback(
    ({
      lesson,
      showFullDateTime,
    }: {
      lesson: Lesson;
      showFullDateTime: boolean;
    }) => {
      const student = studentMap.get(lesson.studentId);
      if (!student) return null;

      const consumed = consumedMap.get(lesson.studentId) ?? 0;
      const isOverCap = consumed >= student.maxCount;

      const timeLabel = showFullDateTime
        ? lesson.date.format("YYYY/MM/DD HH:mm")
        : lesson.date.format("HH:mm");

      const renderAction = () => {
        if (lesson.status === "attended" || lesson.status === "absent") {
          const label = lesson.status === "attended" ? "出席" : "欠席";
          return (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems="center"
              justifyContent="center"
            >
              <Typography sx={{ color: theme.palette.primary.dark }}>
                {label}
              </Typography>
              <SubBtn
                label="取り消し"
                onClick={() =>
                  updateStatus(
                    lesson.id,
                    "scheduled",
                    `${label}登録を取り消します。よろしいですか？`
                  )
                }
              />
            </Stack>
          );
        }

        return (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems="center"
            justifyContent="center"
          >
            <MainBtn
              label="出席"
              onClick={() => updateStatus(lesson.id, "attended")}
            />
            <MainBtn
              label="欠席"
              onClick={() => updateStatus(lesson.id, "absent")}
            />
          </Stack>
        );
      };

      return (
        <TableRow
          sx={{
            backgroundColor: isOverCap
              ? theme.palette.secondary.light
              : undefined,
          }}
        >
          <CustomTableCell>{timeLabel}</CustomTableCell>
          <CustomTableCell>
            <Link
              href={`/student/${student.id}`}
              sx={{ color: theme.palette.secondary.dark, fontWeight: "bold" }}
            >
              {`${student.lastName} ${student.firstName}`}
            </Link>
          </CustomTableCell>
          <CustomTableCell>{renderAction()}</CustomTableCell>
          <CustomTableCell>
            <Box
              component="span"
              sx={{
                color: isOverCap ? theme.palette.primary.dark : "inherit",
                fontWeight: isOverCap ? 700 : 400,
              }}
            >
              {`${consumed} / ${student.maxCount}`}
              {isOverCap && "（上限到達）"}
            </Box>
          </CustomTableCell>
        </TableRow>
      );
    },
    [studentMap, consumedMap, updateStatus]
  );

  const LessonTable = useCallback(
    ({
      rows,
      showFullDateTime = false,
      timeColumnLabel = "時間",
    }: {
      rows: Lesson[];
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
              <CustomTableCell>消化レッスン回数</CustomTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((lesson) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                showFullDateTime={showFullDateTime}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    ),
    [LessonRow]
  );

  return (
    <Box sx={{ width: "100%" }}>
      {forgottenLessons.length > 0 ? (
        <Panel sx={{ display: "grid" }}>
          <CardTitle label="出席登録忘れ" />
          <Typography>以下のレッスンの出欠登録を行ってください。</Typography>
          <LessonTable
            rows={forgottenLessons}
            showFullDateTime={true}
            timeColumnLabel="対象日時"
          />
        </Panel>
      ) : (
        <Panel sx={{ display: "grid" }}>
          <CardTitle label="本日のレッスン" />
          {todayLessons.length === 0 ? (
            <Typography
              sx={{
                textAlign: "center",
                color: "#888",
                py: 3,
                fontFamily: theme.typography.fontFamily,
              }}
            >
              本日のレッスンはありません
            </Typography>
          ) : (
            <LessonTable rows={todayLessons} timeColumnLabel="時間" />
          )}
        </Panel>
      )}
    </Box>
  );
}
