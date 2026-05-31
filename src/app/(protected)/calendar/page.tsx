"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  /* プレビュー用の縮小ラッパーは印刷時に等倍へ戻す（縮小・クリップを防ぐ） */
  .calendar-preview-frame,
  .calendar-preview-scale {
    transform: none !important;
    width: auto !important;
    height: auto !important;
    overflow: visible !important;
    border: none !important;
  }
}
`;

// A4 横長(297mm)を 96dpi で px 換算した基準キャンバス幅
const PREVIEW_DESIGN_WIDTH = 1123;
const A4_LANDSCAPE_RATIO = 210 / 297;

// 印刷時と同じ比率・レイアウトのまま、コンテナ幅に合わせて等倍縮小して表示する
function ScaledPreview({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = width > 0 ? width / PREVIEW_DESIGN_WIDTH : 0;
  const designHeight = PREVIEW_DESIGN_WIDTH * A4_LANDSCAPE_RATIO;

  return (
    <Box
      ref={ref}
      className="calendar-preview-frame"
      sx={{
        width: "100%",
        height: width > 0 ? designHeight * scale : "auto",
        overflow: "hidden",
      }}
    >
      <Box
        className="calendar-preview-scale"
        sx={{
          width: PREVIEW_DESIGN_WIDTH,
          height: designHeight,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          visibility: width > 0 ? "visible" : "hidden",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

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
    document.title = `${academicYear}年度${getTermLabel(
      term
    )}_レッスンカレンダー`;
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
            sx={{
              fontFamily: theme.typography.fontFamily,
            }}
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
            border: `1.5px solid ${theme.palette.primary.main}`,
            overflow: "hidden",
            backgroundColor: "#ffffff",
          }}
        >
          <ScaledPreview>
            <LessonCalendarHtml
              academicYear={academicYear}
              term={term}
              classroomName={
                includeClassroomName && classroomName
                  ? classroomName
                  : undefined
              }
              logoDataUrl={includeLogo && logoDataUrl ? logoDataUrl : undefined}
            />
          </ScaledPreview>
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
          ※
          ダウンロードボタンを押すと印刷ダイアログが開きます。「PDFとして保存」を選んでください。
          <br />※
          日付やURLがPDFに入る場合は、印刷ダイアログの「ヘッダーとフッター」をオフにしてください。
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
