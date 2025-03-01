import { Button, SxProps } from "@mui/material";

interface MainBtnProps {
  label: string;
  sx?: SxProps;
  onClick: () => void;
};

export function MainBtn ({label, sx, onClick}: MainBtnProps) {
  return (
    <Button variant="contained" onClick={onClick} sx={sx}>{label}</Button>
  );
};