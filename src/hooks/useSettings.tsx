import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type FontChoice = "atkinson" | "lexend" | "opendyslexic" | "system";

export interface Settings {
  theme: ThemeMode;
  font: FontChoice;
  fontScale: number; // percent, 90–140
  sound: boolean;
}

export const SETTINGS_KEY = "ld-settings";
export const DEFAULT_SETTINGS: Settings = { theme: "light", font: "atkinson", fontScale: 100, sound: true };

export const FONT_STACKS: Record<FontChoice, { label: string; stack: string; note: string }> = {
  atkinson: {
    label: "Atkinson Hyperlegible",
    stack: '"Atkinson Hyperlegible", ui-sans-serif, system-ui, sans-serif',
    note: "Default — designed for low-vision readers",
  },
  lexend: {
    label: "Lexend",
    stack: '"Lexend", ui-sans-serif, system-ui, sans-serif',
    note: "Wider letters that can ease reading",
  },
  opendyslexic: {
    label: "OpenDyslexic",
    stack: '"OpenDyslexic", "Atkinson Hyperlegible", ui-sans-serif, sans-serif',
    note: "Weighted letter bottoms some dyslexic readers prefer",
  },
  system: {
    label: "Device default",
    stack: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
    note: "Uses your phone or computer's own font",
  },
};

export function readSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}") as Partial<Settings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function apply(s: Settings) {
  const root = document.documentElement;
  const dark =
    s.theme === "dark" ||
    (s.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
  root.style.setProperty("--app-font", FONT_STACKS[s.font].stack);
  root.style.fontSize = `${s.fontScale}%`;
}

const Ctx = createContext<{ settings: Settings; update: (p: Partial<Settings>) => void; reset: () => void } | null>(
  null,
);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const s = readSettings();
    setSettings(s);
    apply(s);
  }, []);

  useEffect(() => {
    if (settings.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const fn = () => apply(settings);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [settings]);

  const update = useCallback((p: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...p };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      apply(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => update(DEFAULT_SETTINGS), [update]);

  return <Ctx.Provider value={{ settings, update, reset }}>{children}</Ctx.Provider>;
}

export function useSettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
