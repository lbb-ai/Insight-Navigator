export const ROUNDS_PER_LEVEL = 5;

export const LEVELS = [
  { n: 1, label: "Easy" },
  { n: 2, label: "Medium" },
  { n: 3, label: "Hard" },
  { n: 4, label: "Very hard" },
  { n: 5, label: "Extremely hard" },
] as const;

export function levelLabel(n: number) {
  return LEVELS.find((l) => l.n === n)?.label ?? `Level ${n}`;
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
