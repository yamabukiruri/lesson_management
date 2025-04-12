"use client";

import Panel from "@/components/panel";
import {
  Box,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { db } from "../firebase";
import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { CardTitle } from "@/components/title";
import { MainBtn } from "@/components/button";
import { theme } from "@/library/theme";
import { useAuth } from "./context/authContext";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const [students, setStudents] = useState<{ [x: string]: any }[]>([]);
  const [forgottenStudents, setForgottenStudents] = useState<
    { [x: string]: any }[]
  >([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    //リアルタイムでデータ更新
    const unsubscribe = onSnapshot(
      collection(db, "students"),
      (querySnapshot) => {
        try {
          // 今日の開始と終了時間を作成
          const today = new Date();
          const startOfToday = new Date(today.setHours(0, 0, 0, 0)); // 今日の00:00:00
          const endOfToday = new Date(today.setHours(23, 59, 59, 999)); // 今日の23:59:59

          // データ整形
          const formattedStudents = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            const schedule = data?.schedule || [];
            const attendedDate = data?.attendedDate || [];
            const absentDate = data?.absentDate || [];

            // 本日出欠登録済みか判定
            const isAttendedToday =
              attendedDate.length > 0 &&
              new Date(attendedDate[attendedDate.length - 1]) >= startOfToday &&
              new Date(attendedDate[attendedDate.length - 1]) <= endOfToday;

            const isAbsentToday =
              absentDate.length > 0 &&
              new Date(absentDate[absentDate.length - 1]) >= startOfToday &&
              new Date(absentDate[absentDate.length - 1]) <= endOfToday;

            // 本日出席予定で、まだ出席登録をしていない生徒か判定
            const isToday =
              schedule.length > 0 &&
              new Date(schedule[0]) >= startOfToday &&
              new Date(schedule[0]) <= endOfToday;

            // 昨日以前の出席登録を忘れていないか判定
            const isForgotten =
              schedule.length > 0 && new Date(schedule[0]) < startOfToday;

            return {
              docId: doc.id,
              docData: {
                ...data,
                isToday: isToday,
                date: schedule[0] ? schedule[0] : "未設定",
                isAttendedToday: isAttendedToday,
                isAbsentToday: isAbsentToday,
                isForgotten: isForgotten,
              },
            };
          });

          // 状態を更新
          setStudents(
            formattedStudents.filter(
              (data) =>
                data.docData.isToday === true ||
                data.docData.isAttendedToday === true ||
                data.docData.isAbsentToday === true
            )
          );
          setForgottenStudents(
            formattedStudents.filter(
              (data) => data.docData.isForgotten === true
            )
          );
        } catch (error) {
          console.error("Error processing snapshot data:", error);
        }
      }
    );

    // クリーンアップ関数
    return () => unsubscribe();
  }, []);
  // console.log(students.map(student => student.docData));

  //出席登録
  const updateAttendance = async (
    id: string,
    attendedDate: string[],
    schedule: string[]
  ) => {
    const docRef = doc(db, "students", id);
    await updateDoc(docRef, {
      attendedDate: [...attendedDate, schedule[0]],
      schedule: schedule.slice(1),
    });
  };

  //欠席登録
  const updateAbsence = async (
    id: string,
    absentDate: string[],
    schedule: string[]
  ) => {
    const docRef = doc(db, "students", id);
    await updateDoc(docRef, {
      absentDate: [...absentDate, schedule[0]],
      schedule: schedule.slice(1),
    });
  };

  if (loading) {
    return <Box>読み込み中...</Box>;
  }

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ width: "100%" }}>
      {forgottenStudents.length === 0 ? (
        <Panel>
          <CardTitle label="本日の生徒" />
          <TableContainer sx={{ width: "100%" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ textAlign: "center" }}>時間</TableCell>
                  <TableCell sx={{ textAlign: "center" }}>名前</TableCell>
                  <TableCell sx={{ textAlign: "center" }}>出席登録</TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    登録レッスン回数
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ textAlign: "center" }}>
                      {student.docData.date.split(" ")[1]}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      <Link
                        href={"/student/" + student.docId}
                        sx={{
                          color: theme.palette.primary.main,
                          fontWeight: "bold",
                        }}
                      >
                        {student.docData.lastName +
                          " " +
                          student.docData.firstName}
                      </Link>
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      {student.docData.isAttendedToday ? (
                        "出席"
                      ) : student.docData.isAbsentToday ? (
                        "欠席"
                      ) : (
                        <>
                          <MainBtn
                            label="出席"
                            onClick={() => {
                              updateAttendance(
                                student.docId,
                                student.docData.attendedDate,
                                student.docData.schedule
                              );
                            }}
                          />
                          <MainBtn
                            label="欠席"
                            sx={{ ml: 2 }}
                            onClick={() => {
                              updateAbsence(
                                student.docId,
                                student.docData.absentDate,
                                student.docData.schedule
                              );
                            }}
                          />
                        </>
                      )}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      {student.docData.attendedDate.length +
                        student.docData.absentDate.length +
                        " / " +
                        student.docData.maxCount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Panel>
      ) : (
        <Panel>
          <CardTitle label="出席登録忘れ" />
          <Typography>以下の生徒の出席登録を行ってください。</Typography>
          <TableContainer sx={{ width: "100%" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ textAlign: "center" }}>対象日時</TableCell>
                  <TableCell sx={{ textAlign: "center" }}>名前</TableCell>
                  <TableCell sx={{ textAlign: "center" }}>出席登録</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {forgottenStudents.map((forgottenStudent, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ textAlign: "center" }}>
                      {forgottenStudent.docData.date}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      <Link
                        href={"/student/" + forgottenStudent.docId}
                        sx={{
                          color: theme.palette.primary.main,
                          fontWeight: "bold",
                        }}
                      >
                        {forgottenStudent.docData.lastName +
                          " " +
                          forgottenStudent.docData.firstName}
                      </Link>
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      <MainBtn
                        label="出席"
                        onClick={() => {
                          updateAttendance(
                            forgottenStudent.docId,
                            forgottenStudent.docData.attendedDate,
                            forgottenStudent.docData.schedule
                          );
                        }}
                      />
                      <MainBtn
                        label="欠席"
                        sx={{ ml: 2 }}
                        onClick={() => {
                          updateAbsence(
                            forgottenStudent.docId,
                            forgottenStudent.docData.absentDate,
                            forgottenStudent.docData.schedule
                          );
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Panel>
      )}
    </Box>
  );
}
