/** רעש הים הוא הקלטה אמיתית (CC0). הרולר והקליקים מיוצרים בקוד עם Web Audio. */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ocean: { stop: () => void } | null = null;
let noise: AudioBuffer | null = null;
let waves: Promise<AudioBuffer> | null = null;
let oceanWanted = false;

const WAVES_URL = `${import.meta.env.BASE_URL}sound/waves.m4a`;
/** הקובץ מכיל חצי שנייה עודפת בכל צד, כדי שהלופ לא ייקטע. */
const LOOP_START = 0.5;
const LOOP_END = 60.5;

function audio(): AudioContext | null {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noiseBuffer(c: AudioContext): AudioBuffer {
  if (noise) return noise;
  const length = c.sampleRate * 2;
  noise = c.createBuffer(2, length, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = noise.getChannelData(ch);
    let last = 0;
    // רעש קצר שממנו בונים את הקליקים של הרולר.
    for (let i = 0; i < length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.5;
    }
  }
  return noise;
}

export function setVolume(volume: number) {
  if (master) master.gain.value = volume;
}

function loadWaves(c: AudioContext): Promise<AudioBuffer> {
  waves ??= fetch(WAVES_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`Sound failed: ${res.status}`);
      return res.arrayBuffer();
    })
    .then((data) => c.decodeAudioData(data))
    .catch((err: unknown) => {
      waves = null;
      throw err;
    });
  return waves;
}

export function startOcean(volume: number) {
  const c = audio();
  if (!c || !master || ocean) return;
  oceanWanted = true;
  setVolume(volume);
  const out = master;
  void loadWaves(c).then((buffer) => {
    // ייתכן שהמשתמש כיבה בזמן שהקובץ נטען.
    if (!oceanWanted || ocean) return;
    const src = c.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.loopStart = LOOP_START;
    src.loopEnd = LOOP_END;
    const bus = c.createGain();
    bus.gain.setValueAtTime(0.0001, c.currentTime);
    bus.gain.exponentialRampToValueAtTime(1.5, c.currentTime + 2.5);
    src.connect(bus).connect(out);
    src.start(0, LOOP_START);
    ocean = {
      stop() {
        bus.gain.cancelScheduledValues(c.currentTime);
        bus.gain.setValueAtTime(bus.gain.value, c.currentTime);
        bus.gain.linearRampToValueAtTime(0, c.currentTime + 0.8);
        setTimeout(() => { src.stop(); bus.disconnect(); }, 900);
      },
    };
  }).catch(() => undefined);
}

export function stopOcean() {
  oceanWanted = false;
  ocean?.stop();
  ocean = null;
}

function tick(c: AudioContext, at: number, freq: number, level: number) {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c);
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = 7;
  const gain = c.createGain();
  gain.gain.setValueAtTime(level, at);
  gain.gain.exponentialRampToValueAtTime(0.001, at + 0.03);
  src.connect(filter).connect(gain).connect(master!);
  src.start(at, Math.random() * 1.8, 0.04);
}

/** תקתוק קטן של רולר, ללחיצות. */
export function clickSound(volume: number) {
  const c = audio();
  if (!c || !master) return;
  if (!ocean) setVolume(volume);
  tick(c, c.currentTime, 2600, 2.4);
}

/** גלגול רולר שמאט: לתפיסת דג. */
export function reelSound(volume: number) {
  const c = audio();
  if (!c || !master) return;
  if (!ocean) setVolume(volume);
  let at = c.currentTime;
  for (let i = 0; i < 26; i++) {
    tick(c, at, 2300 + (i % 2) * 500, 2.2);
    at += 0.028 + i * 0.0028;
  }
}

/** הטלה: שריקה קצרה של החוט. */
export function castSound(volume: number) {
  const c = audio();
  if (!c || !master) return;
  if (!ocean) setVolume(volume);
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c);
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 3;
  filter.frequency.setValueAtTime(1200, c.currentTime);
  filter.frequency.exponentialRampToValueAtTime(5200, c.currentTime + 0.32);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.001, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(1.6, c.currentTime + 0.12);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.36);
  src.connect(filter).connect(gain).connect(master);
  src.start(c.currentTime, 0, 0.4);
}
