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
} from "@mui/material";
import { db } from "../../firebase";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { CardTitle } from "@/components/title";
import { MainBtn } from "@/components/button";
import { useRouter } from "next/navigation";
import { theme } from "@/library/theme";
import { useAuth } from "../context/authContext";
import Loading from "@/components/loading";

export interface Student {
  absentDate: string[];
  age: number;
  attendedDate: string[];
  building: string;
  city: string;
  firstName: string;
  gender: number;
  hour: string;
  lastName: string;
  maxCount: string;
  minute: string;
  pref: string;
  schedule: string[];
  startDate: string;
  street: string;
}

interface Doc extends Student {
  docId: string;
}

export default function Student() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Doc[]>([]);

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
          // データ整形
          const fetchedStudents = querySnapshot.docs.map((doc) => {
            const data = doc.data() as Student; // 型アサーション
            return {
              docId: doc.id,
              absentDate: data.absentDate || [],
              age: data.age || 0,
              attendedDate: data.attendedDate || [],
              building: data.building || "",
              city: data.city || "",
              firstName: data.firstName || "",
              gender: data.gender || 0,
              hour: data.hour || "",
              lastName: data.lastName || "",
              maxCount: data.maxCount || "",
              minute: data.minute || "",
              pref: data.pref || "",
              schedule: data.schedule || [],
              startDate: data.startDate || "",
              street: data.street || "",
            };
          });

          // 状態を更新
          setStudents(fetchedStudents);
        } catch (error) {
          console.error("Error processing snapshot data:", error);
        }
      }
    );

    // クリーンアップ関数
    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Panel>
        <CardTitle label="生徒一覧" />
        <TableContainer sx={{ width: "100%" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ textAlign: "center" }}>名前</TableCell>
                <TableCell sx={{ textAlign: "center" }}>年齢</TableCell>
                <TableCell sx={{ textAlign: "center" }}>
                  登録レッスン回数
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student, index) => (
                <TableRow key={index}>
                  <TableCell sx={{ textAlign: "center" }}>
                    <Link
                      href={"/student/" + student.docId}
                      sx={{
                        color: theme.palette.primary.main,
                        fontWeight: "bold",
                      }}
                    >
                      {student.lastName + " " + student.firstName}
                    </Link>
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    {student.age}
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    {student.attendedDate.length +
                      student.absentDate.length +
                      " / " +
                      student.maxCount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Panel>
      <Box sx={{ display: "flex", alignItems: "", justifyContent: "center" }}>
        <MainBtn
          label="新規生徒登録"
          sx={{ width: 160 }}
          onClick={() => {
            router.push("student/0");
          }}
        />
      </Box>
    </Box>
  );
}
