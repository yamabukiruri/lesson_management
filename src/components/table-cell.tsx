import { TableCell, TableSortLabel } from "@mui/material";
import { SxProps, Theme } from "@mui/system";
import { PropsWithChildren, ReactNode } from "react";
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

interface SortableTableCellProps<K extends string> {
  columnKey: K;
  label: ReactNode;
  activeKey: K;
  order: "asc" | "desc";
  onSort: (key: K) => void;
  sx?: SxProps<Theme>;
}

export function SortableTableCell<K extends string>({
  columnKey,
  label,
  activeKey,
  order,
  onSort,
  sx,
}: SortableTableCellProps<K>) {
  const active = activeKey === columnKey;

  return (
    <CustomTableCell sx={sx}>
      <TableSortLabel
        active={active}
        direction={active ? order : "desc"}
        onClick={() => onSort(columnKey)}
        sx={{
          fontFamily: theme.typography.fontFamily,
          fontWeight: 600,
        }}
      >
        {label}
      </TableSortLabel>
    </CustomTableCell>
  );
}
