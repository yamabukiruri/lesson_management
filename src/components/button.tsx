import { theme } from "@/library/theme";
import { Button, SxProps, Theme } from "@mui/material";

interface BtnProps {
  label: string;
  sx?: SxProps<Theme>;
  disabled?: boolean;
  onClick: () => void;
}

export function MainBtn({ label, sx, disabled, onClick }: BtnProps) {
  const defaultSx: SxProps<Theme> = {
    backgroundColor: theme.palette.primary.main,
    color: "#fff",
    padding: "12px 16px",
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
      disabled={disabled}
      sx={{ ...(defaultSx as object), ...(sx as object) }}
    >
      {label}
    </Button>
  );
}

export function SubBtn({ label, sx, disabled, onClick }: BtnProps) {
  const defaultSx: SxProps<Theme> = {
    backgroundColor: "#fff",
    color: theme.palette.secondary.dark,
    padding: "12px 16px",
    borderRadius: "20px",
    border: `1.5px solid ${theme.palette.secondary.dark}`,
    fontWeight: 600,
    fontFamily: theme.typography.fontFamily,
    fontSize: "1rem",
    textTransform: "none",
    transition: "all 0.3s ease",
    "&:hover": {
      backgroundColor: theme.palette.secondary.light,
      borderColor: theme.palette.secondary.dark,
    },
  };

  return (
    <Button
      variant="outlined"
      onClick={onClick}
      disabled={disabled}
      sx={{ ...(defaultSx as object), ...(sx as object) }}
    >
      {label}
    </Button>
  );
}
