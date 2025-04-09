import { theme } from "@/library/theme";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  SxProps,
  TextField,
} from "@mui/material";
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

interface CustomPulldownProps {
  label: string;
  name: string;
  value: number;
  sx?: SxProps;
  options: { id: number; name: string }[];
  onChange: (value: number) => void;
}

export function CustomPulldown({
  label,
  name,
  value,
  sx,
  options,
  onChange,
}: CustomPulldownProps) {
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

  const handleSelectChange = (event: SelectChangeEvent<number>) => {
    onChange(event.target.value as number);
  };

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl variant="filled" fullWidth sx={{ ...defaultSx, ...sx }}>
        <InputLabel>{label}</InputLabel>
        <Select
          value={value}
          name={name}
          label={label}
          onChange={handleSelectChange}
        >
          {options.map((option) => (
            <MenuItem key={option.id} value={option.id}>
              {option.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
