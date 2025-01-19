"use client";

import Panel from "@/components/panel";
import { Box, Link, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import db from '../firebase'
import { useEffect, useState } from "react";
import { Timestamp, collection, getDocs, onSnapshot, query, where } from "firebase/firestore"; 
import { CardTitle } from "@/components/title";

export default function Home() {
  const [students, setStudents] = useState<{ [x: string]: any; }[]>([]);
  const [forgottenStudents, setForgottenStudents] = useState<{ [x: string]: any; }[]>([]);

  useEffect(() => {
    //リアルタイムでデータ更新
    const unsubscribe = onSnapshot(collection(db, "students"), (querySnapshot) => {
      try {
        // 今日の開始と終了時間を作成
        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0)); // 今日の00:00:00
        const endOfToday = new Date(today.setHours(23, 59, 59, 999)); // 今日の23:59:59
  
        // データ整形
        const formattedStudents = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const schedule = data?.schedule || [];
          const attendedDate = data?.attendedDate || [];
  
          // 出席登録済みか判定
          const isRegisteredAttendance =
            attendedDate.length > 0 &&
            new Date(attendedDate[attendedDate.length - 1]) >= startOfToday &&
            new Date(attendedDate[attendedDate.length - 1]) <= endOfToday;
  
          // 本日出席予定で、まだ出席登録をしていない生徒か判定
          const isToday =
            schedule.length > 0 &&
            new Date(schedule[0]) >= startOfToday &&
            new Date(schedule[0]) <= endOfToday;
  
          // 昨日以前の出席登録を忘れていないか判定
          const isForgotten =
            schedule.length > 0 &&
            new Date(schedule[0]) < startOfToday;
  
          return {
            docId: doc.id,
            docData: {
              ...data,
              isToday: isToday,
              date: schedule[0]
                ? schedule[0]
                : "未設定",
              isRegisteredAttendance: isRegisteredAttendance,
              isForgotten: isForgotten,
            },
          };
        });
  
        // 状態を更新
        setStudents(
          formattedStudents.filter(
            data => data.docData.isToday === true || data.docData.isRegisteredAttendance === true
          )
        );
        setForgottenStudents(
          formattedStudents.filter(data => data.docData.isForgotten === true)
        );
      } catch (error) {
        console.error("Error processing snapshot data:", error);
      }
    });
  
    // クリーンアップ関数
    return () => unsubscribe();
  }, []);
  // console.log(students.map(student => student.docData));

  return (
    <Box sx={{ width: '100%' }}>
      {forgottenStudents.length === 0 ? (
        <Panel>
          <CardTitle label='本日出席予定の生徒' />
          <TableContainer sx={{width: '100%'}}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{textAlign: 'center'}}>時間</TableCell>
                  <TableCell sx={{textAlign: 'center'}}>名前</TableCell>
                  <TableCell sx={{textAlign: 'center'}}>出席登録</TableCell>
                  <TableCell sx={{textAlign: 'center'}}>出席回数</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{textAlign: 'center'}}>{student.docData.date.split(' ')[1]}</TableCell>
                    <TableCell sx={{textAlign: 'center'}}><Link href={"/" + student.docId}>{student.docData.name}</Link></TableCell>
                    <TableCell sx={{textAlign: 'center'}}>{student.docData.isRegisteredAttendance ? '出席' : '未登録'}</TableCell>
                    <TableCell sx={{textAlign: 'center'}}>{student.docData.attendedDate.length + ' / ' + student.docData.maxCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Panel>
      ) : (
        <Panel>
        <CardTitle label='出席登録忘れ' />
        <Typography>以下の生徒の出席登録を行ってください。</Typography>
        <TableContainer sx={{width: '100%'}}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{textAlign: 'center'}}>日時</TableCell>
                <TableCell sx={{textAlign: 'center'}}>名前</TableCell>
                <TableCell sx={{textAlign: 'center'}}>出席登録</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {forgottenStudents.map((forgottenStudent, index) => (
                <TableRow key={index}>
                  <TableCell sx={{textAlign: 'center'}}>{forgottenStudent.docData.date}</TableCell>
                  <TableCell sx={{textAlign: 'center'}}><Link href={"/" + forgottenStudent.docId}>{forgottenStudent.docData.name}</Link></TableCell>
                  <TableCell sx={{textAlign: 'center'}}></TableCell>
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
