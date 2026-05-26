"use client";

import { Box, Typography } from "@mui/material";
import {
  getMonthsForTerm,
  getMonthGrid,
  isJapaneseHoliday,
  getTermLabel,
  type Term,
} from "@/utils/calendar";

// 月ごとのテーマカラー
const MONTH_COLORS: Record<number, string> = {
  1: "#7b6ba8",
  2: "#5a9bd4",
  3: "#d4b86b",
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

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const HOLIDAY_COLOR = "#d44a4a";
const SATURDAY_COLOR = "#3a78c9";

interface LessonCalendarHtmlProps {
  academicYear: number;
  term: Term;
  classroomName?: string;
  logoDataUrl?: string;
}

export function LessonCalendarHtml({
  academicYear,
  term,
  classroomName,
  logoDataUrl,
}: LessonCalendarHtmlProps) {
  const months = getMonthsForTerm(academicYear, term);
  const hasFooter = Boolean(classroomName || logoDataUrl);

  return (
    <Box
      className="lesson-calendar"
      sx={{
        backgroundColor: "#ffffff",
        padding: "16px",
        // A4 横長のアスペクト比 (297:210)
        aspectRatio: "297 / 210",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily: '"Zen Maru Gothic", "Helvetica", "Arial", sans-serif',
        color: "#333",
      }}
    >
      <Typography
        sx={{
          fontSize: "1.1rem",
          fontWeight: 700,
          textAlign: "center",
          marginBottom: "12px",
        }}
      >
        {`${academicYear}年度${getTermLabel(term)}　レッスンカレンダー`}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "1fr 1fr",
          gap: "8px",
          flex: 1,
        }}
      >
        {months.map(({ year, month }) => (
          <MonthCell key={`${year}-${month}`} year={year} month={month} />
        ))}
      </Box>
      {hasFooter && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 1,
            marginTop: 1,
          }}
        >
          {classroomName && (
            <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>
              {classroomName}
            </Typography>
          )}
          {logoDataUrl && (
            <Box
              component="img"
              src={logoDataUrl}
              alt=""
              sx={{
                width: 40,
                height: 40,
                objectFit: "contain",
              }}
            />
          )}
        </Box>
      )}
    </Box>
  );
}

// 全ての月で日付セルの高さを揃えるため、6週分にパディング
const WEEKS_PER_MONTH = 6;
const EMPTY_WEEK: (Date | null)[] = [null, null, null, null, null, null, null];

function padWeeksTo6(weeks: (Date | null)[][]): (Date | null)[][] {
  const padded = [...weeks];
  while (padded.length < WEEKS_PER_MONTH) {
    padded.push(EMPTY_WEEK);
  }
  return padded;
}

function MonthCell({ year, month }: { year: number; month: number }) {
  const weeks = padWeeksTo6(getMonthGrid(year, month));
  const themeColor = MONTH_COLORS[month];

  return (
    <Box
      sx={{
        border: "1px solid #dddddd",
        borderRadius: "6px",
        padding: "4px 6px",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <Typography
        sx={{
          fontSize: "1.8rem",
          fontWeight: 700,
          color: themeColor,
          paddingLeft: "4px",
          marginBottom: "8px",
          lineHeight: 1,
        }}
      >
        {month}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          backgroundColor: `${themeColor}33`,
          borderRadius: "3px",
          marginBottom: "2px",
        }}
      >
        {DAY_LABELS.map((label, idx) => (
          <Typography
            key={label}
            sx={{
              fontSize: "0.65rem",
              textAlign: "center",
              paddingY: "3px",
              color:
                idx === 0
                  ? HOLIDAY_COLOR
                  : idx === 6
                  ? SATURDAY_COLOR
                  : "#444",
            }}
          >
            {label}
          </Typography>
        ))}
      </Box>
      {weeks.map((week, wi) => (
        <Box
          key={wi}
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            flex: 1,
            minHeight: "18px",
          }}
        >
          {week.map((date, di) => {
            let dayColor = "#333";
            if (date) {
              if (date.getDay() === 0 || isJapaneseHoliday(date)) {
                dayColor = HOLIDAY_COLOR;
              } else if (date.getDay() === 6) {
                dayColor = SATURDAY_COLOR;
              }
            }
            return (
              <Box
                key={di}
                sx={{
                  borderBottom: "1px dashed #dddddd",
                  borderRight: "1px dashed #dddddd",
                  borderLeft: di === 0 ? "1px dashed #dddddd" : undefined,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "2px",
                }}
              >
                {date && (
                  <Typography
                    sx={{
                      fontSize: "0.75rem",
                      color: dayColor,
                    }}
                  >
                    {date.getDate()}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
