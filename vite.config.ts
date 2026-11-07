import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { VitePWA } from "vite-plugin-pwa";
import type { Plugin } from "vite";

/** טעינה מוקדמת של הגופנים שבמסך הראשון, במקביל ל-CSS ולא אחריו. */
function preloadFonts(names: RegExp[]): Plugin {
  return {
    name: "preload-fonts",
    transformIndexHtml: {
      order: "post",
      handler(_html, ctx) {
        const files = Object.keys(ctx.bundle ?? {}).filter((f) => f.endsWith(".woff2") && names.some((n) => n.test(f)));
        return files.map((f) => ({ tag: "link", attrs: { rel: "preload", as: "font", type: "font/woff2", crossorigin: "", href: `/fishday/${f}` }, injectTo: "head" as const }));
      },
    },
  };
}

/**
 * מדיניות אבטחת תוכן: מאיפה מותר לטעון קוד, גופנים ונתונים. חוסמת הזרקת סקריפטים זרים.
 * רק בבנייה, כי שרת הפיתוח מזריק סקריפטים משלו.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://marine-api.open-meteo.com https://api.open-meteo.com https://fishday-stats.bitonorel9.workers.dev",
  "media-src 'self' blob:",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

function securityPolicy(): Plugin {
  return {
    name: "security-policy",
    apply: "build",
    transformIndexHtml: () => [
      { tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content: CSP }, injectTo: "head-prepend" },
      { tag: "meta", attrs: { name: "referrer", content: "strict-origin-when-cross-origin" }, injectTo: "head-prepend" },
    ],
  };
}

export default defineConfig({
  base: "/fishday/",
  // גופנים לא נכנסים לתוך ה-CSS כ-base64: הם נטענים כקבצים נפרדים, רק כשצריך.
  build: { assetsInlineLimit: (file: string) => (file.endsWith(".woff2") || file.endsWith(".woff") ? false : undefined) },
  plugins: [
    preact(),
    securityPolicy(),
    preloadFonts([/cormorant-garamond-latin-600-italic/]),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: ["icons/apple-touch-icon.png", "icons/icon.svg"],
      manifest: {
        name: "FishDay",
        short_name: "FishDay",
        description: "איפה ומתי כדאי לדוג היום בחופי ישראל",
        lang: "he",
        dir: "rtl",
        start_url: "/fishday/",
        scope: "/fishday/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#06262c",
        theme_color: "#06262c",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,webp,woff2}"],
        globIgnores: ["widget/**", "social/**"],
        runtimeCaching: [
          {
            urlPattern: /\/sound\/.*\.m4a$/,
            handler: "CacheFirst",
            options: { cacheName: "sound", cacheableResponse: { statuses: [200] } },
          },
        ],
        // גרסה חדשה נכנסת מיד: מידע על חוקים לא יכול להישאר ישן.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
