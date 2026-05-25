"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Box,
  CircularProgress,
  FormControlLabel,
  Switch,
  Typography,
} from "@mui/material";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../context/authContext";
import Loading from "@/components/loading";
import Panel from "@/components/panel";
import { CardTitle, SectionTitle } from "@/components/title";
import { MainBtn, SubBtn } from "@/components/button";
import { CustomPulldown } from "@/components/input";
import { LessonCalendarPdf } from "@/components/lessonCalendarPdf";
import { theme } from "@/library/theme";
import {
  getCurrentAcademicYear,
  getCurrentTerm,
  getTermLabel,
  type Term,
} from "@/utils/calendar";

function PreviewOverlay({ message }: { message: string }) {
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(2px)",
        zIndex: 1,
      }}
    >
      <CircularProgress
        size={36}
        sx={{ color: theme.palette.primary.main }}
      />
      <Typography
        sx={{
          fontSize: "0.9rem",
          color: "#555",
          fontFamily: theme.typography.fontFamily,
        }}
      >
        {message}
      </Typography>
    </Box>
  );
}

const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  { ssr: false }
);

const PREVIEW_INITIAL_LOADING_MS = 3000;

interface PreviewProps {
  academicYear: number;
  term: Term;
  classroomName: string | undefined;
  logoDataUrl: string | undefined;
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);
  return debounced;
}

export default function CalendarPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [academicYear, setAcademicYear] = useState<number>(
    getCurrentAcademicYear()
  );
  const [term, setTerm] = useState<Term>(getCurrentTerm());
  const [includeClassroomName, setIncludeClassroomName] = useState(true);
  const [includeLogo, setIncludeLogo] = useState(true);
  const [classroomName, setClassroomName] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [previewShown, setPreviewShown] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

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

  const previewProps = useMemo<PreviewProps>(
    () => ({
      academicYear,
      term,
      classroomName:
        includeClassroomName && classroomName ? classroomName : undefined,
      logoDataUrl: includeLogo && logoDataUrl ? logoDataUrl : undefined,
    }),
    [
      academicYear,
      term,
      includeClassroomName,
      classroomName,
      includeLogo,
      logoDataUrl,
    ]
  );

  const debouncedPreviewProps = useDebouncedValue(previewProps, 500);
  const isDebouncing = previewProps !== debouncedPreviewProps;

  useEffect(() => {
    if (!initialLoading) return;
    const handle = setTimeout(
      () => setInitialLoading(false),
      PREVIEW_INITIAL_LOADING_MS
    );
    return () => clearTimeout(handle);
  }, [initialLoading]);

  const handleShowPreview = () => {
    setInitialLoading(true);
    setPreviewShown(true);
  };

  const overlayMessage = initialLoading
    ? "プレビューを準備中..."
    : "更新中...";
  const showOverlay = previewShown && (initialLoading || isDebouncing);
  const inputsDisabled = showOverlay || downloading;

  const previewPdfDoc = useMemo(
    () => <LessonCalendarPdf {...debouncedPreviewProps} />,
    [debouncedPreviewProps]
  );

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const blob = await pdf(<LessonCalendarPdf {...previewProps} />).toBlob();
      const url = URL.createObjectURL(blob);
      const fileName = `${academicYear}年度${getTermLabel(
        term
      )}_レッスンカレンダー.pdf`;
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ width: "100%" }}>
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
            disabled={inputsDisabled}
            onChange={(v) => setAcademicYear(v)}
          />
          <CustomPulldown
            label="期間"
            name="term"
            value={term === "first" ? 0 : 1}
            options={termOptions}
            disabled={inputsDisabled}
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
                disabled={!classroomName || inputsDisabled}
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
                disabled={!logoDataUrl || inputsDisabled}
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
        {previewShown ? (
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: { xs: 400, sm: 600 },
              border: `1px solid ${theme.palette.secondary.main}`,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <PDFViewer width="100%" height="100%" showToolbar={false}>
              {previewPdfDoc}
            </PDFViewer>
            {showOverlay && <PreviewOverlay message={overlayMessage} />}
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              width: "100%",
              height: { xs: 200, sm: 240 },
              backgroundColor: theme.palette.secondary.light,
              border: `1px dashed ${theme.palette.secondary.main}`,
              borderRadius: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.9rem",
                color: "#666",
                fontFamily: theme.typography.fontFamily,
              }}
            >
              プレビューを表示するには下のボタンを押してください
            </Typography>
            <SubBtn label="プレビューを表示" onClick={handleShowPreview} />
          </Box>
        )}
      </Panel>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <MainBtn
          label={downloading ? "生成中..." : "PDFをダウンロード"}
          sx={{ width: 240 }}
          disabled={inputsDisabled}
          onClick={handleDownload}
        />
      </Box>
    </Box>
  );
}
