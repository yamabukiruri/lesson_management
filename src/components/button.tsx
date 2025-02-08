import { Button } from "@mui/material";

interface MainBtnProps {
  label: string;
  onClick: () => void;
};

export function MainBtn ({label, onClick}: MainBtnProps) {
  return (
    <Button variant="contained" onClick={onClick}>{label}</Button>
  );
};