import { theme } from "@/library/theme";
import { Typography } from "@mui/material";

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
