import { render } from "preact";
import "@fontsource/ibm-plex-sans-hebrew/400.css";
import "@fontsource/ibm-plex-sans-hebrew/600.css";
import "@fontsource/karantina/700.css";
import { App } from "./app";
import "./styles.css";

render(<App />, document.getElementById("app")!);

// רישום מאוחר: הורדת הקבצים לעבודה בלי רשת לא מתחרה בטעינה הראשונה.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    setTimeout(() => void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }), 4000);
  });
}
