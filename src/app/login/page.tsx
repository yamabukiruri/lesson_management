"use client";

import { MainBtn } from "@/components/button";
import { Box, Typography, Paper } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../context/auth-context";
import { theme } from "@/library/theme";

export default function Login() {
  const { user, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  return (
    <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
      {!user && (
        <Paper
          elevation={6}
          sx={{
            padding: { xs: 4, sm: 6 },
            width: { xs: "90%", sm: "440px" },
            borderRadius: 4,
            backgroundColor: "white",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: theme.palette.primary.dark,
              textAlign: "center",
              fontFamily: theme.typography.fontFamily,
            }}
          >
            Lesson Manager
          </Typography>
          <Typography sx={{ fontFamily: theme.typography.fontFamily, mb: 5 }}>
            ピアノ教室の先生のための生徒管理アプリ
          </Typography>
          <MainBtn label="サインイン" onClick={signInWithGoogle} />
        </Paper>
      )}
    </Box>
  );
}
