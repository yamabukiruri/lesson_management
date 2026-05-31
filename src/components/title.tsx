import { theme } from "@/library/theme";
import { SxProps, Typography } from "@mui/material";

interface CardTitleProps {
  label: string;
}

export function CardTitle({ label }: CardTitleProps) {
  return (
    <Typography
      sx={{
        fontSize: "22px",
        fontWeight: "bold",
        mb: 2,
        fontFamily: theme.typography.fontFamily,
        color: "#4a3f5a",
      }}
    >
      {label}
    </Typography>
  );
}

interface SectionTitleProps {
  label: string;
  sx?: SxProps;
}

export function SectionTitle({ label, sx }: SectionTitleProps) {
  const defaultSx = {
    marginBottom: 2,
    fontFamily: theme.typography.fontFamily,
  };
  return (
    <Typography sx={{ ...defaultSx, ...(sx as object) }}>{label}</Typography>
  );
}
