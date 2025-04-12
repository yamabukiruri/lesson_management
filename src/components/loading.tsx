import { Box, CircularProgress, Typography } from "@mui/material";
import { theme } from "@/library/theme";

export default function LoadingScreen() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: "100vh",
        width: "100vw",
        backgroundColor: theme.palette.background.default,
        zIndex: 9999,
      }}
    >
      <CircularProgress
        size={60}
        thickness={4}
        sx={{ color: theme.palette.primary.main }}
      />
      <Typography
        variant="h6"
        sx={{ mt: 3, color: theme.palette.text.primary }}
      >
        Loading...
      </Typography>
    </Box>
  );
}
