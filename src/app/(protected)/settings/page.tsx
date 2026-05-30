"use client";

import Panel from "@/components/panel";
import { Box, Divider, Typography } from "@mui/material";
import { db } from "@/firebase";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { CardTitle, SectionTitle } from "@/components/title";
import { MainBtn, SubBtn } from "@/components/button";
import { CustomTextField } from "@/components/input";
import { Notice } from "@/components/notice";
import { theme } from "@/library/theme";
import { useAuth } from "@/app/context/auth-context";

const LOGO_MAX_SIZE = 256;
const LOGO_FILE_LIMIT_BYTES = 10 * 1024 * 1024;

async function resizeImageToDataUrl(
  file: File,
  maxSize: number
): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    image.src = dataUrl;
  });

  const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas が利用できません");
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL("image/png");
}

export default function Settings() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [classroomName, setClassroomName] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState("");
  const [error, setError] = useState("");
  const [logoError, setLogoError] = useState("");
  const [logoProcessing, setLogoProcessing] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setClassroomName(data.classroomName ?? "");
        setLogoDataUrl(data.logoDataUrl ?? "");
      }
    };
    fetchSettings();
  }, [user]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setClassroomName(e.target.value);
    if (error) setError("");
  };

  const handleLogoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > LOGO_FILE_LIMIT_BYTES) {
      setLogoError("ファイルサイズが大きすぎます（10MB以下にしてください）");
      e.target.value = "";
      return;
    }

    setLogoError("");
    setLogoProcessing(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file, LOGO_MAX_SIZE);
      setLogoDataUrl(dataUrl);
    } catch (err) {
      setLogoError(
        err instanceof Error ? err.message : "画像の処理に失敗しました"
      );
    } finally {
      setLogoProcessing(false);
      e.target.value = "";
    }
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
        {
          classroomName: classroomName.trim(),
          logoDataUrl: logoDataUrl,
        },
        { merge: true }
      );
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Panel sx={{ display: "grid" }}>
        <CardTitle label="教室設定" />
        <SectionTitle label="基本情報" />
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
        <Divider />
        <Box sx={{ marginBottom: 3 }}>
          <SectionTitle label="ロゴ画像" sx={{ marginTop: 2 }} />
          <Typography
            sx={{
              marginBottom: 2,
              fontSize: "0.85rem",
              color: "#888",
              fontFamily: theme.typography.fontFamily,
            }}
          >
            最大{LOGO_MAX_SIZE}×{LOGO_MAX_SIZE}pxに自動でリサイズされます。
          </Typography>
          {logoDataUrl && (
            <Box
              sx={{
                display: "inline-block",
                marginBottom: 2,
              }}
            >
              <Box
                component="img"
                src={logoDataUrl}
                alt="ロゴプレビュー"
                sx={{
                  display: "block",
                  width: 128,
                  height: 128,
                  objectFit: "contain",
                  backgroundColor: theme.palette.secondary.light,
                  borderRadius: 2,
                  padding: 1,
                  border: `1px solid ${theme.palette.secondary.main}`,
                }}
              />
            </Box>
          )}
          <input
            type="file"
            accept="image/*"
            hidden
            ref={fileInputRef}
            onChange={handleLogoSelect}
          />
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <SubBtn
              label={
                logoProcessing
                  ? "処理中..."
                  : logoDataUrl
                  ? "画像を変更"
                  : "画像を選択"
              }
              onClick={() => fileInputRef.current?.click()}
            />
            {logoDataUrl && (
              <SubBtn
                label="ロゴを削除"
                onClick={() => setLogoDataUrl("")}
              />
            )}
          </Box>
          {logoError && (
            <Typography
              sx={{
                marginTop: 1,
                color: theme.palette.error.main,
                fontSize: "0.85rem",
                fontFamily: theme.typography.fontFamily,
              }}
            >
              {logoError}
            </Typography>
          )}
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
