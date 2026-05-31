import { createTheme } from "@mui/material/styles";
import "@fontsource/comic-neue";
import "@fontsource/zen-maru-gothic";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#262522", // 黒に近いチャコール（黒鍵のイメージ）
      light: "#ddd8d0", // 温かいライトグレー（ホバー／淡い背景）
      dark: "#111111", // ほぼ黒
    },
    secondary: {
      main: "#c9a14a", // ブラスゴールド（差し色）
      light: "#efe2bf", // 淡いゴールドベージュ
      dark: "#a07c2e", // 深いゴールド
    },
    background: {
      default: "#f4eede", // 温かいクリーム地
      paper: "#ffffff", // カードは白〜アイボリー
    },
    text: {
      primary: "#2b241b", // ダークウォームブラウン
      secondary: "#6b5d49", // ソフトブラウン
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
