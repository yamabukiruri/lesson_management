"use client";

import Panel from "@/components/panel";
import { Box } from "@mui/material";
import { db } from "../../firebase";
import { ChangeEvent, useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { CardTitle } from "@/components/title";
import { useRouter } from "next/navigation";
import { MainBtn } from "@/components/button";
import { CustomTextField } from "@/components/input";
import { Notice } from "@/components/notice";
import { useAuth } from "../context/authContext";
import Loading from "@/components/loading";

export default function Settings() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [classroomName, setClassroomName] = useState("");
  const [error, setError] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setClassroomName(data.classroomName ?? "");
      }
    };
    fetchSettings();
  }, [user]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setClassroomName(e.target.value);
    if (error) setError("");
  };

  const handleSave = async () => {
    if (!user) return;

    if (!classroomName.trim()) {
      setError("教室名を入力してください");
      return;
    }

    setSaving(true);
    try {
      const docRef = doc(db, "users", user.uid);
      await setDoc(
        docRef,
        { classroomName: classroomName.trim() },
        { merge: true }
      );
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Panel sx={{ display: "grid" }}>
        <CardTitle label="教室設定" />
        <Box sx={{ marginBottom: 3 }}>
          <CustomTextField
            label="教室名"
            name="classroomName"
            value={classroomName}
            required
            error={!!error}
            helperText={error}
            onChange={handleChange}
          />
        </Box>
      </Panel>
      <Box
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <MainBtn
          label={saving ? "保存中..." : "保存"}
          sx={{ width: 160 }}
          onClick={handleSave}
        />
      </Box>
      <Notice
        open={snackbarOpen}
        message="保存しました"
        onClose={() => setSnackbarOpen(false)}
      />
    </Box>
  );
}
