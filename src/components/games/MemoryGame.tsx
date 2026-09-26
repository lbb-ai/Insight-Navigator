import { useEffect, useMemo, useRef, useState } from "react";
import { GameFrame, useGameTracker, type GameProps } from "./GameEngine";
import { Button } from "@/components/ui/button";
import { ROUNDS_PER_LEVEL, shuffle } from "@/lib/levels";
import { playTone } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { QuestionTimer } from "./QuestionTimer";

const FACES = [
  { emoji: "🐢", name: "turtle" }, { emoji: "🍓", name: "strawberry" }, { emoji: "🚲", name: "bicycle" },
  { emoji: "🌻", name: "sunflower" }, { emoji: "🐬", name: "dolphin" }, { emoji: "🍋", name: "lemon" },
  { emoji: "🎸", name: "guitar" }, { emoji: "🦋", name: "butterfly" }, { emoji: "🍉", name: "watermelon" },
  { emoji: "🚀", name: "rocket" }, { emoji: "🐙", name: "octopus" }, { emoji: "🌈", name: "rainbow" },
  { emoji: "🍄", name: "mushroom" }, { emoji: "🦊", name: "fox" }, { emoji: "🏀", name: "basketball" },
  { emoji: "🍍", name: "pineapple" }, { emoji: "🐝", name: "bee" }, { emoji: "🎨", name: "paint palette" },
  { emoji: "🦜", name: "parrot" }, { emoji: "🌙", name: "moon" }, { emoji: "🥑", name: "avocado" },
  { emoji: "🪁", name: "kite" }, { emoji: "🐘", name: "elephant" }, { emoji: "🎈", name: "balloon" },
  { emoji: "🐳", name: "whale" }, { emoji: "🍒", name: "cherries" }, { emoji: "🦀", name: "crab" },
  { emoji: "🌵", name: "cactus" }, { emoji: "🍕", name: "pizza" }, { emoji: "🦚", name: "peacock" },
];
const FACE_IMAGES = import.meta.glob("/src/assets/memory-faces/*.svg", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

function faceImage(emoji: string) {
  const filename = [...emoji].filter((character) => character.codePointAt(0) !== 0xfe0f)
    .map((character) => character.codePointAt(0)?.toString(16)).join("-");
  return FACE_IMAGES[`/src/assets/memory-faces/${filename}.svg`];
}

const PAIRS = [3, 4, 6, 8, 10];
const COLS = [3, 4, 4, 4, 5];
const FLIP_BACK_MS = [1000, 900, 800, 650, 500];

interface Card { id: number; face: number; matched: boolean }

function deal(pairs: number, avoid: Set<number>): Card[] {
  const pool = shuffle(FACES.map((_, i) => i).filter((i) => !avoid.has(i)));
  const faces = (pool.length >= pairs ? pool : shuffle(FACES.map((_, i) => i))).slice(0, pairs);
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
  const completionSent = useRef(false);

  useEffect(() => {
    cards.forEach((c) => used.current.add(c.face));
    beginItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const summary = useMemo(() => summarise(true), [summarise]);
  useEffect(() => {
    if (finished && !completionSent.current) {
      completionSent.current = true;
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

  const advanceTimedOutRound = () => {
    if (finished) return;
    record({ correct: false, skipped: true, errorKey: "board-timeout", level, ms: 35000 });
    if (round + 1 >= ROUNDS_PER_LEVEL) {
      setFinished(true);
      return;
    }
    setOpen([]);
    setSeen(new Set());
    setCards(deal(pairs, used.current));
    setRound((current) => current + 1);
  };

  return (
    <GameFrame
      step={round}
      total={ROUNDS_PER_LEVEL}
      level={level}
      feedback={feedback}
      hint={`Flip two cards at a time and find all ${pairs} matching pairs. Try to remember where each card is.`}
    >
      <QuestionTimer resetKey={round} onExpire={advanceTimedOutRound} paused={finished} />
      <div
        className="mx-auto grid max-w-lg gap-2 sm:gap-3"
        style={{ gridTemplateColumns: `repeat(${COLS[idx]}, minmax(0, 1fr))` }}
      >
        {cards.map((c, i) => {
          const faceUp = c.matched || open.includes(i);
          const face = FACES[c.face];
          return (
            <Button
              key={`${round}-${c.id}`}
              variant="ghost"
              type="button"
              onClick={() => flip(i)}
              aria-label={faceUp ? `Card ${i + 1}, ${face?.name ?? "picture"}${c.matched ? ", matched" : ""}` : `Card ${i + 1}, face down`}
              disabled={c.matched}
              className={cn(
                "grid h-auto w-full aspect-square place-items-center rounded-md border-2 p-0 transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                c.matched
                  ? "border-risk-low bg-risk-low-soft opacity-70"
                  : faceUp
                    ? "border-primary bg-card shadow-[var(--shadow-card)]"
                    : "border-transparent bg-primary text-primary-foreground hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
              )}
            >
              {faceUp ? (
                face && faceImage(face.emoji) ? (
                  <img src={faceImage(face.emoji)} alt="" aria-hidden="true" className="size-9 sm:size-12" width={48} height={48} />
                ) : (
                  <span className="text-3xl leading-none sm:text-4xl" aria-hidden="true">{face?.emoji}</span>
                )
              ) : (
                <span className="font-display text-2xl font-bold text-brand-spark" aria-hidden="true">?</span>
              )}
            </Button>
          );
        })}
      </div>
    </GameFrame>
  );
}
