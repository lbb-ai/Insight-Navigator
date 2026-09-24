import { useMemo } from "react";
import { McqRounds, type GameProps, type McqItem } from "./GameEngine";
import { rand, shuffle } from "@/lib/levels";

type Gen = () => { prompt: string; answer: number; errorKey: string; prefix?: string };

const GENERATORS: Record<number, Gen[]> = {
  1: [
    () => { const a = rand(2, 9), b = rand(2, 9); return { prompt: `${a} + ${b}`, answer: a + b, errorKey: "addition" }; },
    () => { const a = rand(10, 18), b = rand(2, 9); return { prompt: `${a} − ${b}`, answer: a - b, errorKey: "subtraction" }; },
    () => { const a = rand(2, 5), b = rand(2, 5); return { prompt: `${a} × ${b}`, answer: a * b, errorKey: "multiplication" }; },
    () => { const s = rand(1, 5), d = rand(2, 3); return { prompt: `Next: ${s}, ${s + d}, ${s + 2 * d}, ${s + 3 * d}, …`, answer: s + 4 * d, errorKey: "sequencing" }; },
  ],
  2: [
    () => { const a = rand(21, 68), b = rand(13, 29); return { prompt: `${a} + ${b}`, answer: a + b, errorKey: "addition" }; },
    () => { const a = rand(51, 95), b = rand(17, 39); return { prompt: `${a} − ${b}`, answer: a - b, errorKey: "subtraction" }; },
    () => { const a = rand(6, 9), b = rand(6, 9); return { prompt: `${a} × ${b}`, answer: a * b, errorKey: "multiplication" }; },
    () => { const b = rand(3, 9), q = rand(4, 9); return { prompt: `${b * q} ÷ ${b}`, answer: q, errorKey: "division" }; },
    () => { const p = rand(12, 38); return { prompt: `A taxi costs R${p}. You pay with R50. Change?`, answer: 50 - p, errorKey: "subtraction", prefix: "R" }; },
  ],
  3: [
    () => { const a = rand(12, 25), b = rand(11, 19); return { prompt: `${a} × ${b}`, answer: a * b, errorKey: "multiplication" }; },
    () => { const p = [10, 15, 20, 25, 30][rand(0, 4)]!, n = rand(2, 9) * 40; return { prompt: `${p}% of ${n}`, answer: (p * n) / 100, errorKey: "proportion" }; },
    () => { const s = rand(1, 4); return { prompt: `Next: ${s}, ${s * 2}, ${s * 4}, ${s * 8}, …`, answer: s * 16, errorKey: "sequencing" }; },
    () => { const b = rand(12, 19), q = rand(6, 14); return { prompt: `${b * q} ÷ ${b}`, answer: q, errorKey: "division" }; },
    () => { const n = rand(3, 9) * 12; return { prompt: `What is ¾ of ${n}?`, answer: (n * 3) / 4, errorKey: "fractions" }; },
  ],
  4: [
    () => { const a = rand(4, 15), b = rand(3, 9), c = rand(3, 9); return { prompt: `${a} + ${b} × ${c}`, answer: a + b * c, errorKey: "order-of-operations" }; },
    () => { const a = rand(3, 9), b = rand(2, 6), c = rand(2, 5); return { prompt: `(${a} + ${b}) × ${c} − ${b}`, answer: (a + b) * c - b, errorKey: "order-of-operations" }; },
    () => { const s = rand(1, 5); return { prompt: `Next: ${s ** 2}, ${(s + 1) ** 2}, ${(s + 2) ** 2}, ${(s + 3) ** 2}, …`, answer: (s + 4) ** 2, errorKey: "sequencing" }; },
    () => { const price = rand(4, 12) * 50, off = [10, 20, 25, 30][rand(0, 3)]!; return { prompt: `R${price} shoes are ${off}% off. New price?`, answer: price - (price * off) / 100, errorKey: "proportion", prefix: "R" }; },
    () => { const x = rand(3, 12), a = rand(2, 6), b = rand(3, 15); return { prompt: `${a}x + ${b} = ${a * x + b}. x = ?`, answer: x, errorKey: "algebra" }; },
  ],
  5: [
    () => { const x = rand(4, 13), a = rand(3, 7), b = rand(2, 9), c = rand(2, 4); return { prompt: `${a}x − ${b} = ${c}x + ${(a - c) * x - b}. x = ?`, answer: x, errorKey: "algebra" }; },
    () => { const a = rand(1, 6), b = rand(2, 7); const t = [a, b, a + b, a + 2 * b, 2 * a + 3 * b]; return { prompt: `Next: ${t.join(", ")}, …`, answer: 3 * a + 5 * b, errorKey: "sequencing" }; },
    () => { const base = rand(4, 9) * 100, up = [10, 20, 25][rand(0, 2)]!, down = [10, 20][rand(0, 1)]!; const v = base * (1 + up / 100) * (1 - down / 100); return { prompt: `R${base} rises ${up}%, then falls ${down}%. Final value?`, answer: Math.round(v), errorKey: "proportion", prefix: "R" }; },
    () => { const n = rand(11, 19); return { prompt: `${n}² − ${n - 1}²`, answer: n * n - (n - 1) * (n - 1), errorKey: "powers" }; },
    () => { const speed = rand(6, 12) * 10, mins = [15, 30, 45][rand(0, 2)]!; return { prompt: `A bus travels at ${speed} km/h. How many km in ${mins} minutes?`, answer: (speed * mins) / 60, errorKey: "rates" }; },
    () => { const a = rand(3, 8), b = rand(2, 6), c = rand(2, 4); return { prompt: `${a * c * b} ÷ (${b} × ${c}) + ${a} × ${b}`, answer: a + a * b, errorKey: "order-of-operations" }; },
  ],
};

function distractors(answer: number): string[] {
  const offsets = shuffle([1, -1, 2, -2, 10, -10, 3, 5]);
  const set = new Set<number>();
  for (const o of offsets) {
    const v = answer + o;
    if (v >= 0 && v !== answer) set.add(v);
    if (set.size === 3) break;
  }
  return [...set].map(String);
}

function build(level: number): McqItem[] {
  const gens = GENERATORS[level] ?? GENERATORS[1]!;
  const seen = new Set<string>();
  const items: McqItem[] = [];
  let guard = 0;
  while (items.length < 5 && guard < 200) {
    guard += 1;
    const g = gens[rand(0, gens.length - 1)]!();
    if (seen.has(g.prompt)) continue;
    seen.add(g.prompt);
    const p = g.prefix ?? "";
    items.push({
      prompt: g.prompt,
      answer: `${p}${g.answer}`,
      options: [`${p}${g.answer}`, ...distractors(g.answer).map((d) => `${p}${d}`)],
      errorKey: g.errorKey,
    });
  }
  return items;
}

export function NumberGame({ level, onComplete }: GameProps) {
  const items = useMemo(() => build(level), [level]);
  return (
    <McqRounds
      items={items}
      level={level}
      onComplete={onComplete}
      hint="Choose the answer that fits. Work at a comfortable pace."
    />
  );
}
