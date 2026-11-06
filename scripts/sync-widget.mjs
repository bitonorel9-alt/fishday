// מעתיק את רשימת החופים מהאפליקציה לסקריפט הווידג'ט, כדי ששניהם יחשבו אותו ציון.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const { BEACHES } = await import(pathToFileURL(`${root}src/domain/beaches.ts`).href);
const file = `${root}public/widget/fishday-widget.js`;
const code = readFileSync(file, "utf8");

const rows = BEACHES.map((b) => {
  const fields = [`id: ${JSON.stringify(b.id)}`, `name: ${JSON.stringify(b.name)}`, `lat: ${b.lat}`, `lon: ${b.lon}`, `facing: ${b.facing}`];
  if (b.shelteredFrom) fields.push(`shelteredFrom: [${b.shelteredFrom.join(", ")}]`);
  fields.push(`reserve: ${b.legal === "reserve"}`);
  return `  { ${fields.join(", ")} },`;
});

const start = code.indexOf("const BEACHES = [");
const end = code.indexOf("];", start);
if (start < 0 || end < 0) throw new Error("BEACHES block not found in widget");
writeFileSync(file, `${code.slice(0, start)}const BEACHES = [\n${rows.join("\n")}\n${code.slice(end)}`);
console.log(`widget: ${BEACHES.length} beaches`);
