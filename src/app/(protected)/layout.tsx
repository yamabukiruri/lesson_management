"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box } from "@mui/material";
import { useAuth } from "@/app/context/auth-context";
import MenuBar from "@/components/menu";
import Loading from "@/components/loading";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "background.default",
      }}
    >
      <MenuBar />
      <main>{children}</main>
    </Box>
  );
}
