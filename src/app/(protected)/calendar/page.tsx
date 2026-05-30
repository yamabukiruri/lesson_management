"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, FormControlLabel, Switch, Typography } from "@mui/material";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/app/context/auth-context";
import Panel from "@/components/panel";
import { CardTitle, SectionTitle } from "@/components/title";
import { MainBtn } from "@/components/button";
import { CustomPulldown } from "@/components/input";
import { LessonCalendarHtml } from "@/components/lesson-calendar-html";
import { theme } from "@/library/theme";
import {
  getCurrentAcademicYear,
  getCurrentTerm,
  getTermLabel,
  type Term,
} from "@/utils/calendar";

const PRINT_CSS = `
@media print {
  @page {
    size: A4 landscape;
    margin: 0;
  }
  body * {
    visibility: hidden;
  }
  .lesson-calendar,
  .lesson-calendar * {
    visibility: visible;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .lesson-calendar {
    position: absolute;
    top: 0;
    left: 0;
    width: 297mm;
    height: 210mm;
    padding: 8mm !important;
    margin: 0 !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    border: none !important;
    overflow: hidden;
    page-break-after: avoid;
    page-break-inside: avoid;
  }
}
`;

export default function CalendarPage() {
  const { user } = useAuth();

  const [academicYear, setAcademicYear] = useState<number>(
    getCurrentAcademicYear()
  );
  const [term, setTerm] = useState<Term>(getCurrentTerm());
  const [includeClassroomName, setIncludeClassroomName] = useState(true);
  const [includeLogo, setIncludeLogo] = useState(true);
  const [classroomName, setClassroomName] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setClassroomName(data.classroomName ?? "");
        setLogoDataUrl(data.logoDataUrl ?? "");
      }
    };
    fetchSettings();
  }, [user]);

  const yearOptions = useMemo(() => {
    const currentYear = getCurrentAcademicYear();
    return [-2, -1, 0, 1, 2].map((offset) => {
      const y = currentYear + offset;
      return { id: y, name: `${y}年度` };
    });
  }, []);

  const termOptions = useMemo(
    () => [
      { id: 0, name: "前期 (4〜9月)" },
      { id: 1, name: "後期 (10〜3月)" },
    ],
    []
  );

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `${academicYear}年度${getTermLabel(term)}_レッスンカレンダー`;
    window.print();
    document.title = originalTitle;
  };

  return (
    <Box sx={{ width: "100%" }}>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <Panel sx={{ display: "grid" }}>
        <CardTitle label="カレンダー作成" />
        <SectionTitle label="設定" />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            rowGap: 2,
            columnGap: 3,
            marginBottom: 2,
          }}
        >
          <CustomPulldown
            label="年度"
            name="year"
            value={academicYear}
            options={yearOptions}
            onChange={(v) => setAcademicYear(v)}
          />
          <CustomPulldown
            label="期間"
            name="term"
            value={term === "first" ? 0 : 1}
            options={termOptions}
            onChange={(v) => setTerm(v === 0 ? "first" : "second")}
          />
        </Box>
        <Box
          sx={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 2 }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={includeClassroomName && !!classroomName}
                onChange={(e) => setIncludeClassroomName(e.target.checked)}
                disabled={!classroomName}
              />
            }
            label="教室名を掲載"
            sx={{ fontFamily: theme.typography.fontFamily }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={includeLogo && !!logoDataUrl}
                onChange={(e) => setIncludeLogo(e.target.checked)}
                disabled={!logoDataUrl}
              />
            }
            label="ロゴを掲載"
            sx={{ fontFamily: theme.typography.fontFamily }}
          />
        </Box>
        {(!classroomName || !logoDataUrl) && (
          <Typography
            sx={{
              fontSize: "0.85rem",
              color: "#888",
              fontFamily: theme.typography.fontFamily,
              marginBottom: 2,
            }}
          >
            {!classroomName && "教室名"}
            {!classroomName && !logoDataUrl && "・"}
            {!logoDataUrl && "ロゴ"}
            は教室設定ページで登録できます。
          </Typography>
        )}
        <SectionTitle label="プレビュー" sx={{ marginTop: 2 }} />
        <Box
          sx={{
            width: { xs: "100%", sm: "60%" },
            margin: "0 auto",
            border: `1px solid ${theme.palette.secondary.main}`,
            borderRadius: 2,
            overflow: "hidden",
            backgroundColor: "#ffffff",
          }}
        >
          <LessonCalendarHtml
            academicYear={academicYear}
            term={term}
            classroomName={
              includeClassroomName && classroomName ? classroomName : undefined
            }
            logoDataUrl={includeLogo && logoDataUrl ? logoDataUrl : undefined}
          />
        </Box>
        <Typography
          sx={{
            fontSize: "0.8rem",
            color: "#888",
            fontFamily: theme.typography.fontFamily,
            marginTop: 1,
            lineHeight: 1.6,
          }}
        >
          ※ ダウンロードボタンを押すと印刷ダイアログが開きます。「PDFとして保存」を選んでください。
          <br />
          ※ 日付やURLがPDFに入る場合は、印刷ダイアログの「ヘッダーとフッター」をオフにしてください。
        </Typography>
      </Panel>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <MainBtn
          label="PDFをダウンロード"
          sx={{ width: 240 }}
          onClick={handlePrint}
        />
      </Box>
    </Box>
  );
}
