/** כל הצלילים מיוצרים בקוד עם Web Audio, בלי קבצי שמע וזכויות יוצרים. */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ocean: { stop: () => void } | null = null;
let noise: AudioBuffer | null = null;

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
  const length = c.sampleRate * 8;
  noise = c.createBuffer(2, length, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = noise.getChannelData(ch);
    let last = 0;
    // רעש חום: רך ועמוק, כמו ים מרחוק.
    for (let i = 0; i < length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.5;
    }
    // חיבור הקצוות, כדי שהלופ לא יישמע.
    for (let i = 0; i < 4000; i++) {
      const mix = i / 4000;
      data[i] = data[i]! * mix + data[length - 4000 + i]! * (1 - mix);
    }
  }
  return noise;
}

export function setVolume(volume: number) {
  if (master) master.gain.value = volume;
}

function waveLayer(c: AudioContext, out: AudioNode, cutoff: number, level: number, rate: number) {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c);
  src.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  const gain = c.createGain();
  gain.gain.value = level;
  const lfo = c.createOscillator();
  lfo.frequency.value = rate;
  const depth = c.createGain();
  depth.gain.value = level * 0.8;
  lfo.connect(depth).connect(gain.gain);
  src.connect(filter).connect(gain).connect(out);
  src.start();
  lfo.start();
  return () => { src.stop(); lfo.stop(); };
}

export function startOcean(volume: number) {
  const c = audio();
  if (!c || !master || ocean) return;
  setVolume(volume);
  const bus = c.createGain();
  bus.gain.value = 0;
  bus.gain.linearRampToValueAtTime(1, c.currentTime + 2);
  bus.connect(master);
  // שתי שכבות בקצב שונה: גל מתנפץ ושטיפה על החול.
  const stops = [waveLayer(c, bus, 420, 0.5, 0.09), waveLayer(c, bus, 1300, 0.16, 0.143)];
  ocean = {
    stop() {
      bus.gain.linearRampToValueAtTime(0, c.currentTime + 0.8);
      setTimeout(() => { stops.forEach((s) => s()); bus.disconnect(); }, 900);
    },
  };
}

export function stopOcean() {
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
  src.start(at, Math.random() * 6, 0.04);
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
