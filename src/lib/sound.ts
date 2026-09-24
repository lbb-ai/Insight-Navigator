import { readSettings } from "@/hooks/useSettings";

let ctx: AudioContext | null = null;

/** Soft, low-key feedback tones. Never a harsh "wrong" buzzer. */
export function playTone(kind: "positive" | "neutral" | "flip" | "complete") {
  if (typeof window === "undefined" || !readSettings().sound) return;
  try {
    ctx ??= new AudioContext();
    const notes: Record<typeof kind, number[]> = {
      positive: [660, 880],
      neutral: [440],
      flip: [520],
      complete: [523, 659, 784],
    };
    notes[kind].forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx!.currentTime + i * 0.09;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(kind === "flip" ? 0.04 : 0.08, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  } catch {
    /* audio unavailable */
  }
}
