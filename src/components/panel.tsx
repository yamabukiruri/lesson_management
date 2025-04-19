import { PropsWithChildren } from "react";
import { Card, SxProps } from "@mui/material";

interface PanelProps {
  sx?: SxProps;
}

export default function Panel({ children, sx }: PropsWithChildren<PanelProps>) {
  const defaultSx = {
    marginBottom: "32px",
    padding: "24px",
    alignSelf: "start",
    borderRadius: "16px",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)",
    backgroundColor: "#ffffff",
  };

  return <Card sx={{ ...defaultSx, ...sx }}>{children}</Card>;
}
