import { render } from "preact";
// רק עברית ולטינית: בלי קירילית ושפות אחרות שלא בשימוש.
import "@fontsource/ibm-plex-sans-hebrew/hebrew-400.css";
import "@fontsource/ibm-plex-sans-hebrew/latin-400.css";
import "@fontsource/ibm-plex-sans-hebrew/hebrew-600.css";
import "@fontsource/ibm-plex-sans-hebrew/latin-600.css";
import "@fontsource/karantina/hebrew-700.css";
import "@fontsource/karantina/latin-700.css";
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
