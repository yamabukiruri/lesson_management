"use client";

import { MainBtn } from "@/components/button";
import { Box, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../context/authContext";

export default function Login() {
  const { user, signInWithGoogle } = useAuth();
  const router = useRouter();

  // ユーザーがログインしたら、ホームページにリダイレクト
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  return (
    <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
      {user ? null : (
        <Box
          sx={{
            padding: 10,
            width: "30%",
            backgroundColor: "white",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            rowGap: 10,
            borderRadius: 2,
          }}
        >
          <Typography sx={{ fontSize: 40, color: "black" }}>
            Welcome to Lesson Manager!
          </Typography>
          <MainBtn label="サインイン" onClick={signInWithGoogle} />
        </Box>
      )}
    </Box>
  );
}
