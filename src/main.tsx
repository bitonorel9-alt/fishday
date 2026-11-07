import { render } from "preact";
import "@fontsource/ibm-plex-sans-hebrew/400.css";
import "@fontsource/ibm-plex-sans-hebrew/600.css";
import "@fontsource/karantina/700.css";
import "@fontsource/cormorant-garamond/latin-600-italic.css";
import { App } from "./app";
import { startAnalytics, startErrorTracking } from "./data/analytics";
import "./styles.css";

startErrorTracking();
render(<App />, document.getElementById("app")!);

window.addEventListener("load", () => setTimeout(startAnalytics, 3000));

// רישום מאוחר: הורדת הקבצים לעבודה בלי רשת לא מתחרה בטעינה הראשונה.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    setTimeout(() => void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }), 4000);
  });
}
