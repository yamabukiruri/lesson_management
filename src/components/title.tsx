import { Typography } from "@mui/material";

interface CardTitleProps {
  label: string;
}

export function CardTitle({ label }: CardTitleProps) {
  return (
    <Typography sx={{ fontSize: "24px", fontWeight: "bold", mb: 2 }}>
      {label}
    </Typography>
  );
}
