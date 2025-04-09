import { theme } from "@/library/theme";
import { SxProps, TextField } from "@mui/material";
import { ChangeEvent } from "react";

interface CustomTextFieldProps {
  label: string;
  name: string;
  value: string | number;
  type?: "date" | "number";
  sx?: SxProps;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function CustomTextField({
  label,
  name,
  value,
  type,
  sx,
  onChange,
}: CustomTextFieldProps) {
  const defaultSx = {
    "& .MuiFilledInput-root": {
      backgroundColor: theme.palette.secondary.light, // 通常時の背景色
      "&:after": {
        borderBottom: `3px solid ${theme.palette.primary.light}`, // フォーカス時の下線の色
      },
    },
    "& .MuiInputLabel-root": {
      color: "gray", // 通常時のラベル色
      fontWeight: "bold",
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: theme.palette.primary.light, // フォーカス時のラベル色
      fontWeight: "bold",
    },
  };
  return (
    <TextField
      label={label}
      variant="filled"
      name={name}
      value={value}
      type={type}
      sx={{ ...defaultSx, ...sx }}
      onChange={onChange}
    />
  );
}
