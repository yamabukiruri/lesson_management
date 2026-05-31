import { TableCell } from "@mui/material";
import { SxProps, Theme } from "@mui/system";
import { PropsWithChildren } from "react";
import { theme } from "@/library/theme";

interface CustomTableCellProps {
  sx?: SxProps<Theme>;
}

export default function CustomTableCell({
  children,
  sx,
}: PropsWithChildren<CustomTableCellProps>) {
  const defaultSx: SxProps<Theme> = {
    textAlign: "center",
    fontFamily: theme.typography.fontFamily,
    fontSize: "16px",
    fontWeight: 600,
  };

  return <TableCell sx={{ ...defaultSx, ...sx }}>{children}</TableCell>;
}
