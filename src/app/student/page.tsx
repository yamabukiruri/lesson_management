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
  TableSortLabel,
  Typography,
} from "@mui/material";
import { db } from "../../firebase";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { CardTitle } from "@/components/title";
import { MainBtn } from "@/components/button";
import { useRouter } from "next/navigation";
import { theme } from "@/library/theme";
import { useAuth } from "../context/authContext";
import Loading from "@/components/loading";
import CustomTableCell from "@/components/tableCell";
import { CustomTextField } from "@/components/input";

type SortKey = "name" | "age" | "count";
type SortOrder = "asc" | "desc";

export interface Student {
  absentDate: string[];
  age: number;
  attendedDate: string[];
  building: string;
  city: string;
  firstName: string;
  firstNameKana: string;
  gender: number;
  hour: string;
  lastName: string;
  lastNameKana: string;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const displayStudents = useMemo(() => {
    const query = searchQuery.trim();
    const filtered = query
      ? students.filter((s) =>
          `${s.lastName}${s.firstName} ${s.lastName} ${s.firstName}`.includes(
            query
          )
        )
      : students;

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "age":
          cmp = Number(a.age) - Number(b.age);
          break;
        case "count":
          cmp =
            a.attendedDate.length +
            a.absentDate.length -
            (b.attendedDate.length + b.absentDate.length);
          break;
        default: {
          const keyA =
            `${a.lastNameKana}${a.firstNameKana}` ||
            `${a.lastName}${a.firstName}`;
          const keyB =
            `${b.lastNameKana}${b.firstNameKana}` ||
            `${b.lastName}${b.firstName}`;
          cmp = keyA.localeCompare(keyB, "ja");
        }
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [students, searchQuery, sortKey, sortOrder]);

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
              firstNameKana: data.firstNameKana || "",
              gender: data.gender || 0,
              hour: data.hour || "",
              lastName: data.lastName || "",
              lastNameKana: data.lastNameKana || "",
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
      <Panel sx={{ display: "grid" }}>
        <CardTitle label="生徒一覧" />
        <Box sx={{ mb: 2 }}>
          <CustomTextField
            label="名前で検索"
            name="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Box>
        <TableContainer sx={{ width: "100%" }}>
          <Table>
            <TableHead>
              <TableRow>
                <CustomTableCell>
                  <TableSortLabel
                    active={sortKey === "name"}
                    direction={sortKey === "name" ? sortOrder : "desc"}
                    onClick={() => handleSort("name")}
                    sx={{
                      fontFamily: theme.typography.fontFamily,
                      fontWeight: 600,
                    }}
                  >
                    名前
                  </TableSortLabel>
                </CustomTableCell>
                <CustomTableCell>
                  <TableSortLabel
                    active={sortKey === "age"}
                    direction={sortKey === "age" ? sortOrder : "desc"}
                    onClick={() => handleSort("age")}
                    sx={{
                      fontFamily: theme.typography.fontFamily,
                      fontWeight: 600,
                    }}
                  >
                    年齢
                  </TableSortLabel>
                </CustomTableCell>
                <CustomTableCell>
                  <TableSortLabel
                    active={sortKey === "count"}
                    direction={sortKey === "count" ? sortOrder : "desc"}
                    onClick={() => handleSort("count")}
                    sx={{
                      fontFamily: theme.typography.fontFamily,
                      fontWeight: 600,
                    }}
                  >
                    登録レッスン回数
                  </TableSortLabel>
                </CustomTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayStudents.map((student) => (
                <TableRow key={student.docId}>
                  <CustomTableCell>
                    <Link
                      href={"/student/" + student.docId}
                      sx={{
                        color: theme.palette.primary.main,
                        fontWeight: "bold",
                      }}
                    >
                      {student.lastName + " " + student.firstName}
                    </Link>
                  </CustomTableCell>
                  <CustomTableCell>{student.age}</CustomTableCell>
                  <CustomTableCell>
                    {student.attendedDate.length +
                      student.absentDate.length +
                      " / " +
                      student.maxCount}
                  </CustomTableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {displayStudents.length === 0 && (
          <Typography
            sx={{
              textAlign: "center",
              color: "#888",
              py: 3,
              fontFamily: theme.typography.fontFamily,
            }}
          >
            {students.length === 0
              ? "生徒が登録されていません"
              : "該当する生徒がいません"}
          </Typography>
        )}
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
