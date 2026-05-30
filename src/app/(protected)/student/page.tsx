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
import { db } from "@/firebase";
import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { CardTitle } from "@/components/title";
import { MainBtn, SubBtn } from "@/components/button";
import { useRouter } from "next/navigation";
import dayjs, { Dayjs } from "dayjs";
import { theme } from "@/library/theme";
import { useAuth } from "@/app/context/auth-context";
import CustomTableCell from "@/components/table-cell";
import { CustomTextField } from "@/components/input";
import {
  countConsumed,
  getContractYearRange,
  toLesson,
  type Lesson,
} from "@/utils/lesson";
import {
  RosterPrint,
  ROSTER_PRINT_CSS,
  formatRosterDate,
} from "./roster-print";

type SortKey = "name" | "age" | "count";
type SortOrder = "asc" | "desc";

interface Doc {
  docId: string;
  age: number;
  building: string;
  city: string;
  firstName: string;
  firstNameKana: string;
  isWithdrawn: boolean;
  lastName: string;
  lastNameKana: string;
  maxCount: number;
  pref: string;
  startDate: Dayjs | null;
  street: string;
}

export default function Student() {
  const { user } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Doc[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [classroomName, setClassroomName] = useState("");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  // 生徒ごとの現契約年の消化数
  const consumedMap = useMemo(() => {
    const m = new Map<string, number>();
    students.forEach((s) => {
      if (!s.startDate) {
        m.set(s.docId, 0);
        return;
      }
      const range = getContractYearRange(s.startDate);
      const own = lessons.filter((l) => l.studentId === s.docId);
      m.set(s.docId, countConsumed(own, range));
    });
    return m;
  }, [students, lessons]);

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
            (consumedMap.get(a.docId) ?? 0) - (consumedMap.get(b.docId) ?? 0);
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
  }, [students, searchQuery, sortKey, sortOrder, consumedMap]);

  // 退会済みを除外したアクティブ生徒 (名簿印刷用)
  const activeStudents = useMemo(
    () => displayStudents.filter((s) => !s.isWithdrawn),
    [displayStudents]
  );

  useEffect(() => {
    if (!user) return;
    //リアルタイムでデータ更新
    const unsubscribe = onSnapshot(
      collection(db, "users", user.uid, "students"),
      (querySnapshot) => {
        const fetchedStudents = querySnapshot.docs.map((d) => {
          const data = d.data();
          return {
            docId: d.id,
            age: Number(data.age ?? 0),
            building: data.building ?? "",
            city: data.city ?? "",
            firstName: data.firstName ?? "",
            firstNameKana: data.firstNameKana ?? "",
            isWithdrawn: data.isWithdrawn ?? false,
            lastName: data.lastName ?? "",
            lastNameKana: data.lastNameKana ?? "",
            maxCount: Number(data.maxCount ?? 0),
            pref: data.pref ?? "",
            startDate: data.startDate ? dayjs(data.startDate.toDate()) : null,
            street: data.street ?? "",
          };
        });
        setStudents(fetchedStudents);
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(
      collection(db, "users", user.uid, "lessons"),
      (snap) => {
        setLessons(snap.docs.map((d) => toLesson(d.id, d.data())));
      }
    );
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchClassroom = async () => {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setClassroomName(docSnap.data().classroomName ?? "");
      }
    };
    fetchClassroom();
  }, [user]);

  const handlePrint = () => {
    if (activeStudents.length === 0) return;
    const originalTitle = document.title;
    const titlePrefix = classroomName ? `${classroomName}_` : "";
    document.title = `${titlePrefix}生徒名簿_${formatRosterDate().replace(
      /\//g,
      ""
    )}`;
    window.print();
    document.title = originalTitle;
  };

  return (
    <Box sx={{ width: "100%" }}>
      <style dangerouslySetInnerHTML={{ __html: ROSTER_PRINT_CSS }} />
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
                    消化レッスン回数
                  </TableSortLabel>
                </CustomTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayStudents.map((student) => (
                <TableRow
                  key={student.docId}
                  sx={{ opacity: student.isWithdrawn ? 0.55 : 1 }}
                >
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
                    {student.isWithdrawn && (
                      <Box
                        component="span"
                        sx={{
                          marginLeft: 1,
                          fontSize: "0.75rem",
                          color: "#888",
                        }}
                      >
                        (退会済み)
                      </Box>
                    )}
                  </CustomTableCell>
                  <CustomTableCell>{student.age}</CustomTableCell>
                  <CustomTableCell>
                    {`${consumedMap.get(student.docId) ?? 0} / ${
                      student.maxCount
                    }`}
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
      <Box
        sx={{
          display: "flex",
          alignItems: "",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <MainBtn
          label="新規生徒登録"
          sx={{ width: 160 }}
          onClick={() => {
            router.push("student/0");
          }}
        />
        <SubBtn
          label="名簿を印刷"
          sx={{ width: 160 }}
          onClick={handlePrint}
          disabled={activeStudents.length === 0}
        />
      </Box>

      <RosterPrint students={activeStudents} classroomName={classroomName} />
    </Box>
  );
}
