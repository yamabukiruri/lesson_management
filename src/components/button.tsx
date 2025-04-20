import { theme } from "@/library/theme";
import { Button, SxProps, Theme } from "@mui/material";

interface MainBtnProps {
  label: string;
  sx?: SxProps<Theme>;
  onClick: () => void;
}

export function MainBtn({ label, sx, onClick }: MainBtnProps) {
  const defaultSx: SxProps<Theme> = {
    backgroundColor: theme.palette.primary.main,
    color: "#fff",
    padding: "12px 24px",
    borderRadius: "20px",
    fontWeight: 600,
    fontFamily: theme.typography.fontFamily,
    fontSize: "1rem",
    textTransform: "none",
    transition: "all 0.3s ease",
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
    },
  };

  return (
    <Button
      variant="contained"
      onClick={onClick}
      sx={{ ...(defaultSx as object), ...(sx as object) }}
    >
      {label}
    </Button>
  );
}
