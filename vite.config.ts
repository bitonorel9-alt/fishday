import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/fishday/",
  plugins: [
    preact(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "script-defer",
      includeAssets: ["icons/apple-touch-icon.png", "icons/icon.svg"],
      manifest: {
        name: "FishDay",
        short_name: "FishDay",
        description: "איפה ומתי כדאי לדוג היום בחופי חיפה והכרמל",
        lang: "he",
        dir: "rtl",
        start_url: "/fishday/",
        scope: "/fishday/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#08323f",
        theme_color: "#08323f",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
      },
    }),
  ],
});
