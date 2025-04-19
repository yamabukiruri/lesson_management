import { createTheme } from "@mui/material/styles";
import "@fontsource/comic-neue";
import "@fontsource/zen-maru-gothic";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#b37a7d", // くすみローズ
      light: "#decac4", // サンドベージュ
      dark: "#94595c",
    },
    secondary: {
      main: "#eae3dd", // ライトグレージュ
      light: "#f7f4f1", // ミストホワイト
    },
  },
  typography: {
    fontFamily: `"Comic Neue", "Zen Maru Gothic", "Helvetica", "Arial", sans-serif`,
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
});
