"use client";

import { Box, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../context/authContext";

export default function NotFound() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return <Box>読み込み中...</Box>;
  }

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Typography sx={{ mt: 10 }}>このページは存在しません。</Typography>
    </Box>
  );
}
