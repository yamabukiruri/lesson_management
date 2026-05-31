import { theme } from "@/library/theme";
import {
  TextField,
  SxProps,
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { ChangeEvent } from "react";

// 共通スタイル：白地・ソフトなベージュ枠・金色フォーカス
const outlinedFieldSx = (rounded: boolean) => ({
  "& .MuiOutlinedInput-root": {
    backgroundColor: theme.palette.background.paper,
    borderRadius: rounded ? "999px" : "12px",
    transition: "border-color 0.2s ease",
    "& fieldset": {
      borderColor: theme.palette.secondary.main,
    },
    "&:hover fieldset": {
      borderColor: theme.palette.secondary.dark,
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.secondary.dark,
      borderWidth: "1.5px",
    },
  },
  "& .MuiInputLabel-root": {
    color: theme.palette.text.secondary,
    fontWeight: 600,
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: theme.palette.secondary.dark,
  },
});

interface CustomTextFieldProps {
  label: string;
  name: string;
  value: string | number;
  type?: "date" | "number";
  sx?: SxProps;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  search?: boolean;
  placeholder?: string;
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
  search,
  placeholder,
  onChange,
}: CustomTextFieldProps) {
  const renderedLabel = required ? (
    <>
      {label}
      <Box component="span" sx={{ color: theme.palette.error.main, ml: 0.5 }}>
        （必須）
      </Box>
    </>
  ) : (
    label
  );

  return (
    <TextField
      label={search ? undefined : renderedLabel}
      placeholder={placeholder}
      variant="outlined"
      name={name}
      value={value}
      type={type}
      error={error}
      helperText={helperText}
      slotProps={
        search
          ? {
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon
                      sx={{ color: theme.palette.secondary.dark }}
                    />
                  </InputAdornment>
                ),
              },
            }
          : undefined
      }
      sx={{ ...outlinedFieldSx(!!search), ...sx }}
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
  disabled?: boolean;
  onChange: (value: number) => void;
}

export function CustomPulldown({
  label,
  name,
  value,
  sx,
  options,
  disabled,
  onChange,
}: CustomPulldownProps) {
  const handleSelectChange = (event: SelectChangeEvent<number>) => {
    onChange(event.target.value as number);
  };

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl
        variant="outlined"
        fullWidth
        disabled={disabled}
        sx={{ ...outlinedFieldSx(false), ...sx }}
      >
        <InputLabel sx={{ fontFamily: theme.typography.fontFamily }}>
          {label}
        </InputLabel>
        <Select
          value={value}
          name={name}
          label={label}
          onChange={handleSelectChange}
        >
          {options.map((option) => (
            <MenuItem
              key={option.id}
              value={option.id}
              sx={{
                "&:hover": {
                  backgroundColor: theme.palette.primary.light,
                },
                "&&.Mui-selected": {
                  backgroundColor: theme.palette.primary.main,
                  color: "#fff",
                },
                "&&.Mui-selected:hover": {
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

interface CustomCheckboxProps {
  label: string;
  name: string;
  checked: boolean;
  sx?: SxProps;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export function CustomCheckbox({
  label,
  name,
  checked,
  sx,
  disabled,
  onChange,
}: CustomCheckboxProps) {
  return (
    <FormControlLabel
      control={
        <Checkbox
          name={name}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          sx={{
            color: theme.palette.primary.main,
            "&.Mui-checked": { color: theme.palette.primary.main },
          }}
        />
      }
      label={label}
      sx={{
        "& .MuiFormControlLabel-label": {
          fontFamily: theme.typography.fontFamily,
        },
        ...(sx as object),
      }}
    />
  );
}
