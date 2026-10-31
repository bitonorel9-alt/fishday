import { render } from "preact";
import { App } from "./app";
import "@fontsource/ibm-plex-sans-hebrew/400.css";
import "@fontsource/ibm-plex-sans-hebrew/500.css";
import "@fontsource/ibm-plex-sans-hebrew/600.css";
import "@fontsource/karantina/700.css";
import "./styles.css";

render(<App />, document.getElementById("app")!);
