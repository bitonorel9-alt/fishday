// FishDay ווידג'ט לאייפון, לאפליקציית Scriptable.
// אחרי ההוספה אפשר לבחור חוף: בהגדרות הווידג'ט, בשדה Parameter, כתוב למשל עתלית.
// בלי פרמטר הווידג'ט מציג את החוף הכי טוב עכשיו.

const APP_URL = "https://bitonorel9-alt.github.io/fishday/";

const BEACHES = [
  { id: "achziv", name: "אכזיב", lat: 33.049, lon: 35.095, facing: 284, reserve: false },
  { id: "shavei-zion", name: "שבי ציון", lat: 33.019, lon: 35.086, facing: 285, reserve: false },
  { id: "nahariya", name: "נהריה", lat: 33.009, lon: 35.083, facing: 278, reserve: false },
  { id: "akko", name: "עכו", lat: 32.918, lon: 35.063, facing: 259, shelteredFrom: [285, 360], reserve: false },
  { id: "kiryat-yam", name: "קריית ים", lat: 32.859, lon: 35.061, facing: 292, shelteredFrom: [205, 245], reserve: false },
  { id: "kiryat-haim", name: "קריית חיים", lat: 32.84, lon: 35.04, facing: 293, shelteredFrom: [190, 265], reserve: false },
  { id: "bat-galim", name: "בת גלים", lat: 32.836, lon: 34.96, facing: 335, shelteredFrom: [190, 250], reserve: false },
  { id: "dado", name: "חוף דדו", lat: 32.8, lon: 34.945, facing: 270, reserve: false },
  { id: "atlit", name: "עתלית", lat: 32.716, lon: 34.938, facing: 285, shelteredFrom: [190, 225], reserve: false },
  { id: "neve-yam", name: "נווה ים", lat: 32.675, lon: 34.918, facing: 267, reserve: false },
  { id: "dor-habonim", name: "הבונים–דור", lat: 32.635, lon: 34.912, facing: 273, reserve: true },
  { id: "maagan-michael", name: "מעגן מיכאל", lat: 32.56, lon: 34.893, facing: 286, reserve: false },
  { id: "caesarea", name: "קיסריה", lat: 32.517, lon: 34.892, facing: 279, reserve: false },
  { id: "hadera", name: "חדרה", lat: 32.447, lon: 34.872, facing: 277, reserve: false },
  { id: "michmoret", name: "מכמורת", lat: 32.406, lon: 34.862, facing: 285, reserve: false },
  { id: "netanya", name: "נתניה", lat: 32.302, lon: 34.836, facing: 286, reserve: false },
  { id: "herzliya", name: "הרצליה", lat: 32.166, lon: 34.792, facing: 274, reserve: false },
  { id: "tel-aviv", name: "תל אביב", lat: 32.098, lon: 34.767, facing: 265, reserve: false },
  { id: "jaffa", name: "יפו", lat: 32.056, lon: 34.746, facing: 291, shelteredFrom: [195, 225], reserve: false },
  { id: "bat-yam", name: "בת ים", lat: 32.021, lon: 34.733, facing: 283, reserve: false },
  { id: "palmachim", name: "פלמחים", lat: 31.934, lon: 34.695, facing: 304, reserve: false },
  { id: "ashdod", name: "אשדוד", lat: 31.807, lon: 34.63, facing: 295, reserve: false },
  { id: "nitzanim", name: "ניצנים", lat: 31.735, lon: 34.588, facing: 298, reserve: false },
  { id: "ashkelon", name: "אשקלון", lat: 31.669, lon: 34.541, facing: 301, reserve: false },
  { id: "zikim", name: "זיקים", lat: 31.615, lon: 34.5, facing: 300, reserve: false },
];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const angleDiff = (a, b) => { const d = Math.abs(((a - b) % 360 + 360) % 360); return d > 180 ? 360 - d : d; };

function effectiveWave(h, dir, beach) {
  const align = Math.max(Math.cos((angleDiff(dir, beach.facing) * Math.PI) / 180), 0.3);
  const s = beach.shelteredFrom;
  return h * align * (s && dir >= s[0] && dir <= s[1] ? 0.4 : 1);
}
const waveScore = (h) => (h < 0.3 ? 5 : h < 0.5 ? 8 : h <= 1 ? 10 : h <= 1.4 ? 7 : h <= 1.9 ? 4 : 1);
const periodAdjust = (p) => (p < 4 ? -0.5 : p >= 7 ? 0.5 : 0);
function windScore(speed, dir, beach) {
  let s = speed < 12 ? 10 : speed < 20 ? 8 : speed < 30 ? 5 : speed < 40 ? 3 : 1;
  const diff = angleDiff(dir, beach.facing);
  if (diff <= 70 && speed > 15) s -= 1.5;
  if (diff >= 135 && speed < 25) s += 0.5;
  return clamp(s, 1, 10);
}
function timeScore(hour, sun) {
  const t = hour + 0.5;
  const dist = Math.min(Math.abs(t - sun.sunrise), Math.abs(t - sun.sunset));
  if (dist <= 1.5) return 10;
  if (dist <= 3) return 8;
  return t > sun.sunrise && t < sun.sunset ? 4 : 5;
}

/** חייב להישאר זהה ל-scoreHour באפליקציה. בדיקה אוטומטית משווה ביניהם. */
function scoreHour(c, sun, beach) {
  if (c.waveHeight === null || c.waveDirection === null || c.windSpeed === null || c.windDirection === null) return null;
  const wave = effectiveWave(c.waveHeight, c.waveDirection, beach);
  const waves = clamp(waveScore(wave) + (c.wavePeriod === null ? 0 : periodAdjust(c.wavePeriod)), 1, 10);
  let s = 0.4 * waves + 0.3 * windScore(c.windSpeed, c.windDirection, beach) + 0.3 * timeScore(c.hour, sun);
  if (c.windGust !== null && c.windGust >= 40) s -= 1.5;
  if (c.waveHeight >= 2) s = Math.min(s, 2);
  return Math.round(clamp(s, 1, 10) * 10) / 10;
}

const hourOf = (iso) => { const [h, m] = iso.split("T")[1].split(":").map(Number); return h + m / 60; };

async function load() {
  const lat = BEACHES.map((b) => b.lat).join(",");
  const lon = BEACHES.map((b) => b.lon).join(",");
  const q = `latitude=${lat}&longitude=${lon}&timezone=Asia%2FJerusalem&forecast_days=2`;
  const marine = await new Request(`https://marine-api.open-meteo.com/v1/marine?${q}&hourly=wave_height,wave_period,wave_direction`).loadJSON();
  const weather = await new Request(`https://api.open-meteo.com/v1/forecast?${q}&hourly=wind_speed_10m,wind_gusts_10m,wind_direction_10m&daily=sunrise,sunset`).loadJSON();
  return { marine, weather };
}

function pick({ marine, weather }, now, wanted) {
  const stamp = `${now.date}T${String(now.hour).padStart(2, "0")}:00`;
  const sun = { sunrise: hourOf(weather[0].daily.sunrise[0]), sunset: hourOf(weather[0].daily.sunset[0]) };
  const rows = BEACHES.map((beach, i) => {
    const w = weather[i].hourly, m = marine[i].hourly;
    const iw = w.time.indexOf(stamp), im = m.time.indexOf(stamp);
    const c = {
      hour: now.hour,
      waveHeight: m.wave_height[im] ?? null, wavePeriod: m.wave_period[im] ?? null, waveDirection: m.wave_direction[im] ?? null,
      windSpeed: w.wind_speed_10m[iw] ?? null, windGust: w.wind_gusts_10m[iw] ?? null, windDirection: w.wind_direction_10m[iw] ?? null,
    };
    return { beach, c, score: im < 0 || iw < 0 ? null : scoreHour(c, sun, beach) };
  });
  const named = wanted && rows.find((r) => r.beach.name.includes(wanted));
  const best = named ?? rows.filter((r) => !r.beach.reserve && r.score !== null).sort((a, b) => b.score - a.score)[0];
  return { row: best ?? null, sun };
}

function israelNow() {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" }));
  const pad = (n) => String(n).padStart(2, "0");
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, hour: d.getHours() };
}

const hhmm = (h) => `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;
const label = (s) => (s === null ? "אין נתון" : s >= 8 ? "מצוין" : s >= 6.5 ? "טוב" : s >= 4.5 ? "בינוני" : "לא כדאי");
const tint = (s) => new Color(s === null ? "#b4c8d4" : s >= 8 ? "#ffb23e" : s >= 6.5 ? "#2fc4b2" : s >= 4.5 ? "#b6c0ec" : "#f2545b");

function line(stack, text, size, color, opacity) {
  const t = stack.addText(text);
  t.font = Font.boldSystemFont(size);
  t.textColor = color ?? Color.white();
  if (opacity) t.textOpacity = opacity;
  t.lineLimit = 1;
  t.minimumScaleFactor = 0.7;
  return t;
}

function build(result, family) {
  const w = new ListWidget();
  const g = new LinearGradient();
  g.colors = [new Color("#0b6f8c"), new Color("#05213a")];
  g.locations = [0, 1];
  g.startPoint = new Point(0, 0);
  g.endPoint = new Point(1, 1);
  w.backgroundGradient = g;
  w.url = APP_URL;
  w.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);
  w.setPadding(14, 14, 14, 14);

  const head = w.addStack();
  line(head, "🐟 FishDay", 13, new Color("#ffc05a"));
  head.addSpacer();

  if (!result.row) {
    w.addSpacer();
    line(w, "אין נתונים כרגע", 15);
    return w;
  }

  const { beach, c, score } = result.row;
  w.addSpacer();
  const main = w.addStack();
  main.centerAlignContent();
  line(main, score === null ? "–" : score.toFixed(1), family === "small" ? 40 : 46, tint(score));
  main.addSpacer(10);
  const side = main.addStack();
  side.layoutVertically();
  line(side, beach.name, family === "small" ? 15 : 20);
  line(side, label(score), 13, tint(score));
  w.addSpacer();

  if (c.waveHeight !== null && c.waveHeight >= 1.8) line(w, "⚠ גלים גבוהים", 13, new Color("#ff9d8a"));
  else if (c.windGust !== null && c.windGust >= 40) line(w, "⚠ משבים חזקים", 13, new Color("#ff9d8a"));
  else if (family === "small") line(w, `גל ${c.waveHeight?.toFixed(1)} מ' · רוח ${Math.round(c.windSpeed)}`, 12, null, 0.85);
  else line(w, `גל ${c.waveHeight?.toFixed(1)} מ' · רוח ${Math.round(c.windSpeed)} קמ"ש · שקיעה ${hhmm(result.sun.sunset)}`, 13, null, 0.85);
  return w;
}

async function main() {
  const family = config.widgetFamily ?? "medium";
  let widget;
  try {
    const data = await load();
    widget = build(pick(data, israelNow(), args.widgetParameter), family);
  } catch (e) {
    widget = build({ row: null }, family);
  }
  if (config.runsInWidget) Script.setWidget(widget);
  else await widget.presentMedium();
  Script.complete();
}

if (typeof Script !== "undefined") await main();
else module.exports = { BEACHES, scoreHour, pick };
