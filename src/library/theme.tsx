import { createTheme } from "@mui/material/styles";
import "@fontsource/comic-neue";
import "@fontsource/zen-maru-gothic";

declare module "@mui/material/styles" {
  interface Palette {
    tertiary: Palette["primary"];
  }
  interface PaletteOptions {
    tertiary?: PaletteOptions["primary"];
  }
}

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
    tertiary: {
      main: "#f7e3a7", // ペールバター
      light: "#fff7db", // アイボリー寄りの明るさ
      dark: "#e5c97f", // 少し深みのある黄
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
