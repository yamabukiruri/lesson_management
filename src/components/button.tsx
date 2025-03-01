import { theme } from "@/library/theme";
import { Button, SxProps } from "@mui/material";

interface MainBtnProps {
  label: string;
  sx?: SxProps;
  onClick: () => void;
};

export function MainBtn ({label, sx, onClick}: MainBtnProps) {
  const defaultSx = {backgroundColor: theme.palette.primary.main};
  return (
    <Button variant="contained" onClick={onClick} sx={{...defaultSx, ...sx}}>{label}</Button>
  );
};