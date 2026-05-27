"use client";

import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { theme } from "@/library/theme";
import { prefList } from "@/library/fixed-data";

interface RosterStudent {
  docId: string;
  lastName: string;
  firstName: string;
  age: number;
  pref: string;
  city: string;
  street: string;
  building: string;
}

export const ROSTER_PRINT_CSS = `
@media print {
  @page {
    size: A4 portrait;
    margin: 1.2cm;
  }
  body * {
    visibility: hidden;
  }
  .student-roster-print,
  .student-roster-print * {
    visibility: visible;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .student-roster-print {
    display: block !important;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
  }
  .student-roster-print thead {
    display: table-header-group;
  }
}
`;

function formatAddress(student: RosterStudent): string {
  const prefId = Number(student.pref);
  const prefName = prefList.find((p) => p.id === prefId)?.name ?? "";
  const mainParts: string[] = [];
  if (prefName && prefName !== "未選択") mainParts.push(prefName);
  if (student.city) mainParts.push(student.city);
  if (student.street) mainParts.push(student.street);
  const main = mainParts.join("");
  return student.building ? `${main} ${student.building}` : main;
}

export function formatRosterDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

interface RosterPrintProps {
  students: RosterStudent[];
  classroomName?: string;
}

export function RosterPrint({ students, classroomName }: RosterPrintProps) {
  return (
    <Box
      className="student-roster-print"
      sx={{
        display: "none",
        color: "#000",
        fontFamily: theme.typography.fontFamily,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "12px",
          borderBottom: "1px solid #333",
          paddingBottom: "4px",
        }}
      >
        <Typography
          sx={{ fontSize: "20px", fontWeight: 700, letterSpacing: "0.1em" }}
        >
          生徒名簿
        </Typography>
        <Box sx={{ textAlign: "right", fontSize: "11px" }}>
          {classroomName && (
            <Typography sx={{ fontSize: "12px", fontWeight: 600 }}>
              {classroomName}
            </Typography>
          )}
          <Typography sx={{ fontSize: "11px", color: "#555" }}>
            印刷日: {formatRosterDate()}
          </Typography>
        </Box>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                fontSize: "12px",
                fontWeight: 700,
                width: "30%",
                borderBottom: "1.5px solid #333",
                paddingY: "6px",
              }}
            >
              名前
            </TableCell>
            <TableCell
              sx={{
                fontSize: "12px",
                fontWeight: 700,
                width: "10%",
                borderBottom: "1.5px solid #333",
                paddingY: "6px",
              }}
            >
              年齢
            </TableCell>
            <TableCell
              sx={{
                fontSize: "12px",
                fontWeight: 700,
                width: "60%",
                borderBottom: "1.5px solid #333",
                paddingY: "6px",
              }}
            >
              住所
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.docId}>
              <TableCell
                sx={{
                  fontSize: "11px",
                  paddingY: "6px",
                  borderBottom: "1px solid #ddd",
                }}
              >
                {`${student.lastName} ${student.firstName}`}
              </TableCell>
              <TableCell
                sx={{
                  fontSize: "11px",
                  paddingY: "6px",
                  borderBottom: "1px solid #ddd",
                }}
              >
                {student.age}
              </TableCell>
              <TableCell
                sx={{
                  fontSize: "11px",
                  paddingY: "6px",
                  borderBottom: "1px solid #ddd",
                }}
              >
                {formatAddress(student)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
