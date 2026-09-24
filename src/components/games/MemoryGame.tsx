import { useEffect, useMemo, useRef, useState } from "react";
import {
  Anchor, Bell, Bike, Camera, Cloud, Coffee, Compass, Crown, Diamond, Feather, Fish, Flame, Flower2,
  Gem, Gift, Globe, Heart, Key, Leaf, Moon, Music, Palette, Plane, Rocket, Shell, Snowflake, Star,
  Sun, Trees, Umbrella, Zap, Lamp, type LucideIcon,
} from "lucide-react";
import { GameFrame, useGameTracker, type GameProps } from "./GameEngine";
import { ROUNDS_PER_LEVEL, shuffle } from "@/lib/levels";
import { playTone } from "@/lib/sound";
import { cn } from "@/lib/utils";

const ICONS: LucideIcon[] = [
  Anchor, Bell, Bike, Camera, Cloud, Coffee, Compass, Crown, Diamond, Feather, Fish, Flame, Flower2,
  Gem, Gift, Globe, Heart, Key, Leaf, Moon, Music, Palette, Plane, Rocket, Shell, Snowflake, Star,
  Sun, Trees, Umbrella, Zap, Lamp,
];

const PAIRS = [3, 4, 6, 8, 10];
const COLS = [3, 4, 4, 4, 5];
const FLIP_BACK_MS = [1000, 900, 800, 650, 500];

interface Card { id: number; face: number; matched: boolean }

function deal(pairs: number, avoid: Set<number>): Card[] {
  const pool = shuffle(ICONS.map((_, i) => i).filter((i) => !avoid.has(i)));
  const faces = (pool.length >= pairs ? pool : shuffle(ICONS.map((_, i) => i))).slice(0, pairs);
  return shuffle([...faces, ...faces]).map((face, id) => ({ id, face, matched: false }));
}

export function MemoryGame({ level, onComplete }: GameProps) {
  const idx = Math.min(Math.max(level, 1), 5) - 1;
  const pairs = PAIRS[idx]!;
  const { beginItem, record, summarise } = useGameTracker();
  const used = useRef(new Set<number>());
  const [round, setRound] = useState(0);
  const [cards, setCards] = useState<Card[]>(() => deal(pairs, used.current));
  const [open, setOpen] = useState<number[]>([]);
  const [seen, setSeen] = useState<Set<number>>(new Set());
  const [feedback, setFeedback] = useState<"positive" | "neutral" | null>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    cards.forEach((c) => used.current.add(c.face));
    beginItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const summary = useMemo(() => summarise(true), [summarise]);
  useEffect(() => {
    if (finished) {
      playTone("complete");
      onComplete(summary);
    }
  }, [finished, summary, onComplete]);

  const flip = (i: number) => {
    const card = cards[i]!;
    if (card.matched || open.includes(i) || open.length === 2 || finished) return;
    playTone("flip");
    if (open.length === 0) {
      setOpen([i]);
      return;
    }
    const first = open[0]!;
    const a = cards[first]!;
    setOpen([first, i]);
    const match = a.face === card.face;
    // A miss counts as an error only if memory could have avoided it:
    // the partner of the first card was already seen, or the second card was already known.
    const partnerSeen = cards.some((c) => c.id !== a.id && c.face === a.face && seen.has(c.id));
    const avoidable = !match && (partnerSeen || seen.has(card.id));
    record({ correct: match || !avoidable, errorKey: avoidable ? "forgot-seen-card" : undefined, level });
    beginItem();
    setSeen((s) => new Set([...s, a.id, card.id]));

    if (match) {
      setFeedback("positive");
      const next = cards.map((c) => (c.face === a.face ? { ...c, matched: true } : c));
      setTimeout(() => {
        setCards(next);
        setOpen([]);
        setFeedback(null);
        if (next.every((c) => c.matched)) {
          if (round + 1 >= ROUNDS_PER_LEVEL) {
            setFinished(true);
          } else {
            setTimeout(() => {
              setCards(deal(pairs, used.current));
              setSeen(new Set());
              setRound((r) => r + 1);
            }, 450);
          }
        }
      }, 350);
    } else {
      if (avoidable) setFeedback("neutral");
      setTimeout(() => {
        setOpen([]);
        setFeedback(null);
      }, FLIP_BACK_MS[idx]);
    }
  };

  return (
    <GameFrame
      step={round}
      total={ROUNDS_PER_LEVEL}
      level={level}
      feedback={feedback}
      hint={`Flip two cards at a time and find all ${pairs} matching pairs. Try to remember where each card is.`}
    >
      <div
        className="mx-auto grid max-w-lg gap-2 sm:gap-3"
        style={{ gridTemplateColumns: `repeat(${COLS[idx]}, minmax(0, 1fr))` }}
      >
        {cards.map((c, i) => {
          const faceUp = c.matched || open.includes(i);
          const Icon = ICONS[c.face]!;
          return (
            <button
              key={`${round}-${c.id}`}
              type="button"
              onClick={() => flip(i)}
              aria-label={faceUp ? `Card ${i + 1}, face up` : `Card ${i + 1}, face down`}
              disabled={c.matched}
              className={cn(
                "grid aspect-square place-items-center rounded-xl border-2 transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                c.matched
                  ? "scale-95 border-risk-low/40 bg-risk-low-soft text-risk-low"
                  : faceUp
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-transparent bg-primary text-primary-foreground hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
              )}
            >
              {faceUp ? (
                <Icon className="size-7 sm:size-9" aria-hidden="true" />
              ) : (
                <span className="font-display text-lg opacity-40" aria-hidden="true">?</span>
              )}
            </button>
          );
        })}
      </div>
    </GameFrame>
  );
}
