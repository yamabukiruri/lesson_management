"use client";

import {
  Document,
  Page,
  View,
  Text,
  Image as PdfImage,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import {
  getMonthsForTerm,
  getMonthGrid,
  isJapaneseHoliday,
  getTermLabel,
  type Term,
} from "@/utils/calendar";

Font.register({
  family: "ZenMaruGothic",
  fonts: [
    { src: "/fonts/ZenMaruGothic-Regular.woff", fontWeight: 400 },
    { src: "/fonts/ZenMaruGothic-Bold.woff", fontWeight: 700 },
  ],
});

// 月ごとのテーマカラー
const MONTH_COLORS: Record<number, string> = {
  1: "#5a9bd4",
  2: "#7b6ba8",
  3: "#a386b8",
  4: "#e89aa3",
  5: "#a8c97f",
  6: "#82a8d4",
  7: "#e5c97f",
  8: "#e3a87f",
  9: "#b8a3c4",
  10: "#c97f5f",
  11: "#8b8b5a",
  12: "#7d9a6f",
};

// 色 + 40 (alpha) のヘキサ
const withAlpha = (hex: string, alphaHex: string) => `${hex}${alphaHex}`;

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    fontFamily: "ZenMaruGothic",
    padding: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 16,
    color: "#333",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    flex: 1,
  },
  monthCell: {
    width: "32%",
    marginBottom: 10,
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dddddd",
    borderStyle: "solid",
  },
  monthNumber: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 4,
    paddingLeft: 4,
  },
  dowRow: {
    flexDirection: "row",
    borderRadius: 4,
    marginBottom: 2,
  },
  dowCell: {
    flex: 1,
    textAlign: "center",
    fontSize: 8,
    paddingVertical: 3,
    color: "#444",
  },
  weekRow: {
    flexDirection: "row",
    minHeight: 25,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: "#dddddd",
    borderStyle: "dashed",
    paddingVertical: 2,
  },
  dayCellFirst: {
    borderLeftWidth: 0.5,
  },
  dayText: {
    fontSize: 9,
    color: "#333",
  },
  sunday: {
    color: "#d44a4a",
  },
  saturday: {
    color: "#3a78c9",
  },
  holiday: {
    color: "#d44a4a",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 8,
    gap: 8,
  },
  classroomName: {
    fontSize: 11,
    color: "#333",
  },
  logo: {
    width: 40,
    height: 40,
    objectFit: "contain",
  },
});

interface LessonCalendarPdfProps {
  academicYear: number;
  term: Term;
  classroomName?: string;
  logoDataUrl?: string;
}

export function LessonCalendarPdf({
  academicYear,
  term,
  classroomName,
  logoDataUrl,
}: LessonCalendarPdfProps) {
  const months = getMonthsForTerm(academicYear, term);
  const hasFooter = Boolean(classroomName || logoDataUrl);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>
          {`${academicYear}年度${getTermLabel(term)}　レッスンカレンダー`}
        </Text>
        <View style={styles.grid}>
          {months.map(({ year, month }) => (
            <MonthCell key={`${year}-${month}`} year={year} month={month} />
          ))}
        </View>
        {hasFooter && (
          <View style={styles.footer}>
            {classroomName && (
              <Text style={styles.classroomName}>{classroomName}</Text>
            )}
            {logoDataUrl && <PdfImage src={logoDataUrl} style={styles.logo} />}
          </View>
        )}
      </Page>
    </Document>
  );
}

function MonthCell({ year, month }: { year: number; month: number }) {
  const weeks = getMonthGrid(year, month);
  const color = MONTH_COLORS[month];

  return (
    <View style={styles.monthCell}>
      <Text style={[styles.monthNumber, { color }]}>{month}</Text>
      <View
        style={[styles.dowRow, { backgroundColor: withAlpha(color, "33") }]}
      >
        {DAY_LABELS.map((label, idx) => (
          <Text
            key={label}
            style={{
              ...styles.dowCell,
              ...(idx === 0 ? styles.sunday : {}),
              ...(idx === 6 ? styles.saturday : {}),
            }}
          >
            {label}
          </Text>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((date, di) => {
            const isFirst = di === 0;
            let dayTextOverride = {};
            if (date) {
              if (date.getDay() === 0 || isJapaneseHoliday(date)) {
                dayTextOverride = styles.holiday;
              } else if (date.getDay() === 6) {
                dayTextOverride = styles.saturday;
              }
            }
            return (
              <View
                key={di}
                style={{
                  ...styles.dayCell,
                  ...(isFirst ? styles.dayCellFirst : {}),
                }}
              >
                {date && (
                  <Text style={{ ...styles.dayText, ...dayTextOverride }}>
                    {date.getDate()}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
