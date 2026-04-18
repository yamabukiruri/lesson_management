import { theme } from "@/library/theme";
import {
  TextField,
  SxProps,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { ChangeEvent } from "react";

interface CustomTextFieldProps {
  label: string;
  name: string;
  value: string | number;
  type?: "date" | "number";
  sx?: SxProps;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function CustomTextField({
  label,
  name,
  value,
  type,
  sx,
  error,
  helperText,
  required,
  onChange,
}: CustomTextFieldProps) {
  const defaultSx = {
    "& .MuiFilledInput-root": {
      backgroundColor: theme.palette.secondary.light,
      borderRadius: "8px",
      height: "56px", // 統一高さ
      transition: "all 0.3s ease",
      "&:hover": {
        backgroundColor: theme.palette.primary.light,
      },
      "&.Mui-focused": {
        backgroundColor: theme.palette.secondary.main,
      },
      "&:after": {
        borderBottom: `2px solid ${theme.palette.primary.main}`,
      },
    },
    "& .MuiInputLabel-root": {
      color: "#888",
      fontWeight: 600,
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: theme.palette.primary.main,
    },
  };

  const renderedLabel = required ? (
    <>
      {label}
      <Box
        component="span"
        sx={{ color: theme.palette.error.main, ml: 0.5 }}
      >
        （必須）
      </Box>
    </>
  ) : (
    label
  );

  return (
    <TextField
      label={renderedLabel}
      variant="filled"
      name={name}
      value={value}
      type={type}
      error={error}
      helperText={helperText}
      sx={{ ...defaultSx, ...sx }}
      onChange={onChange}
      fullWidth
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
      backgroundColor: theme.palette.secondary.light,
      borderRadius: "8px",
      height: "56px", // TextField と統一
      transition: "all 0.3s ease",
      "&:hover": {
        backgroundColor: theme.palette.primary.light,
      },
      "&.Mui-focused": {
        backgroundColor: theme.palette.secondary.main,
      },
      "&:after": {
        borderBottom: `2px solid ${theme.palette.primary.main}`,
      },
    },
    "& .MuiInputLabel-root": {
      color: "#888",
      fontWeight: 600,
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: theme.palette.primary.main,
    },
  };

  const handleSelectChange = (event: SelectChangeEvent<number>) => {
    onChange(event.target.value as number);
  };

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl variant="filled" fullWidth sx={{ ...defaultSx, ...sx }}>
        <InputLabel sx={{ fontFamily: theme.typography.fontFamily }}>
          {label}
        </InputLabel>
        <Select value={value} name={name} onChange={handleSelectChange}>
          {options.map((option) => (
            <MenuItem
              key={option.id}
              value={option.id}
              sx={{
                "&:hover": {
                  backgroundColor: theme.palette.primary.light,
                },
                "&.Mui-selected": {
                  backgroundColor: theme.palette.primary.main,
                  color: "#fff",
                },
                "&.Mui-selected:hover": {
                  backgroundColor: theme.palette.primary.dark,
                },
              }}
            >
              {option.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
