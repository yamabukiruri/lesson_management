"use client";

import Panel from "@/components/panel";
import {
  Box,
  Link,
  Table,
  TableBody,
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
import Loading from "@/components/loading";
import { Student } from "./student/page";
import CustomTableCell from "@/components/tableCell";

interface FormattedStudent extends Student {
  isToday: boolean | string;
  date: string;
  isAttendedToday: boolean | string;
  isAbsentToday: boolean | string;
  isForgotten: boolean | string;
}

interface Doc {
  docId: string;
  docData: FormattedStudent;
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [students, setStudents] = useState<Doc[]>([]);
  const [forgottenStudents, setForgottenStudents] = useState<Doc[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    //リアルタイムでデータ更新
    const unsubscribe = onSnapshot(
      collection(db, "users", user.uid, "students"),
      (querySnapshot) => {
        try {
          // 今日の開始と終了時間を作成
          const today = new Date();
          const startOfToday = new Date(today.setHours(0, 0, 0, 0)); // 今日の00:00:00
          const endOfToday = new Date(today.setHours(23, 59, 59, 999)); // 今日の23:59:59

          // データ整形
          const formattedStudents = querySnapshot.docs.map((doc) => {
            const data = doc.data() as Student; // 型アサーション
            const schedule = data?.schedule || [];
            const attendedDate = data?.attendedDate || [];
            const absentDate = data?.absentDate || [];

            // 本日出欠登録済みか判定
            const isAttendedToday =
              attendedDate.length > 0 &&
              attendedDate[attendedDate.length - 1] && // 配列の要素が存在するか確認
              new Date(attendedDate[attendedDate.length - 1]) >= startOfToday &&
              new Date(attendedDate[attendedDate.length - 1]) <= endOfToday;

            const isAbsentToday =
              absentDate.length > 0 &&
              absentDate[absentDate.length - 1] && // 配列の要素が存在するか確認
              new Date(absentDate[absentDate.length - 1]) >= startOfToday &&
              new Date(absentDate[absentDate.length - 1]) <= endOfToday;

            // 本日出席予定で、まだ出席登録をしていない生徒か判定
            const isToday =
              schedule.length > 0 &&
              schedule[0] && // 配列の要素が存在するか確認
              new Date(schedule[0]) >= startOfToday &&
              new Date(schedule[0]) <= endOfToday;

            // 昨日以前の出席登録を忘れていないか判定
            const isForgotten =
              schedule.length > 0 &&
              schedule[0] && // 配列の要素が存在するか確認
              new Date(schedule[0]) < startOfToday;

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
  }, [user]);
  // console.log(students.map(student => student.docData));

  //出席登録
  const updateAttendance = async (
    id: string,
    attendedDate: string[],
    schedule: string[]
  ) => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid, "students", id);
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
    if (!user) return;
    const docRef = doc(db, "users", user.uid, "students", id);
    await updateDoc(docRef, {
      absentDate: [...absentDate, schedule[0]],
      schedule: schedule.slice(1),
    });
  };

  //カウントリセット
  const resetCount = async (id: string) => {
    if (!user) return;
    if (
      !confirm(
        "出欠登録をしたレッスン日を全て削除し、カウントを0にリセットします。よろしいですか？"
      )
    )
      return;
    const docRef = doc(db, "users", user.uid, "students", id);
    await updateDoc(docRef, {
      absentDate: [],
      attendedDate: [],
    });
  };

  if (loading) {
    return <Loading />;
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
                  <CustomTableCell>時間</CustomTableCell>
                  <CustomTableCell>名前</CustomTableCell>
                  <CustomTableCell>出席登録</CustomTableCell>
                  <CustomTableCell>登録レッスン回数</CustomTableCell>
                  <CustomTableCell>カウントリセット</CustomTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student, index) => {
                  const isFullCount =
                    student.docData.attendedDate.length +
                      student.docData.absentDate.length >=
                    Number(student.docData.maxCount);

                  return (
                    <TableRow
                      key={index}
                      sx={{
                        backgroundColor: isFullCount
                          ? theme.palette.tertiary.light
                          : undefined,
                      }}
                    >
                      <CustomTableCell>
                        {student.docData.date.split(" ")[1]}
                      </CustomTableCell>
                      <CustomTableCell>
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
                      </CustomTableCell>
                      <CustomTableCell>
                        {student.docData.isAttendedToday ? (
                          "出席"
                        ) : student.docData.isAbsentToday ? (
                          "欠席"
                        ) : isFullCount ? (
                          "レッスン回数が上限に達しています"
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
                      </CustomTableCell>
                      <CustomTableCell>
                        {student.docData.attendedDate.length +
                          student.docData.absentDate.length +
                          " / " +
                          student.docData.maxCount}
                      </CustomTableCell>
                      <CustomTableCell>
                        {isFullCount ? (
                          <MainBtn
                            label="リセット"
                            onClick={() => {
                              resetCount(student.docId);
                            }}
                          />
                        ) : (
                          "-"
                        )}
                      </CustomTableCell>
                    </TableRow>
                  );
                })}
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
                  <CustomTableCell>対象日時</CustomTableCell>
                  <CustomTableCell>名前</CustomTableCell>
                  <CustomTableCell>出席登録</CustomTableCell>
                  <CustomTableCell>登録レッスン回数</CustomTableCell>
                  <CustomTableCell>カウントリセット</CustomTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {forgottenStudents.map((forgottenStudent, index) => {
                  const isFullCount =
                    forgottenStudent.docData.attendedDate.length +
                      forgottenStudent.docData.absentDate.length >=
                    Number(forgottenStudent.docData.maxCount);

                  return (
                    <TableRow
                      key={index}
                      sx={{
                        backgroundColor: isFullCount
                          ? theme.palette.tertiary.light
                          : undefined,
                      }}
                    >
                      <CustomTableCell>
                        {forgottenStudent.docData.date}
                      </CustomTableCell>
                      <CustomTableCell>
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
                      </CustomTableCell>
                      <CustomTableCell>
                        {!isFullCount ? (
                          <>
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
                          </>
                        ) : (
                          "レッスン回数が上限に達しています"
                        )}
                      </CustomTableCell>
                      <CustomTableCell>
                        {forgottenStudent.docData.attendedDate.length +
                          forgottenStudent.docData.absentDate.length +
                          " / " +
                          forgottenStudent.docData.maxCount}
                      </CustomTableCell>
                      <CustomTableCell>
                        {isFullCount ? (
                          <MainBtn
                            label="リセット"
                            onClick={() => {
                              resetCount(forgottenStudent.docId);
                            }}
                          />
                        ) : (
                          "-"
                        )}
                      </CustomTableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Panel>
      )}
    </Box>
  );
}
