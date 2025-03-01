"use client";

import { Box, Typography } from "@mui/material";
import { MainBtn } from "@/components/button";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();
  return (
    <Box sx={{ width: '100%' }}>
      <Typography sx={{mt: 10}}>このページは存在しません。</Typography>
    </Box>
  );
}
