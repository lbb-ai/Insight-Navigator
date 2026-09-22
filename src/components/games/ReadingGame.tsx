import { useEffect, useState } from "react";
import { ChoiceGrid, GameFrame, useGameTracker, type GameProps } from "./GameEngine";
import { Button } from "@/components/ui/button";

const PASSAGE = `Thandi walks to the campus library every Tuesday afternoon. She likes the quiet corner near the window, where the noise from the courtyard fades away. Last week she arrived to find the corner taken, so she sat near the entrance instead. The constant movement made it hard to finish her chapter, and she left after only twenty minutes. This week she arrived an hour earlier and found her usual seat free. She finished two chapters and still had time to review her notes before her evening lecture.`;

interface Item {
  question: string;
  options: string[];
  answer: string;
  level: number;
  errorKey: string;
}

const ITEMS: Item[] = [
  {
    question: "Which day does Thandi go to the library?",
    options: ["Monday", "Tuesday", "Thursday", "Friday"],
    answer: "Tuesday",
    level: 1,
    errorKey: "detail-recall",
  },
  {
    question: "Why did she leave early last week?",
    options: [
      "The library closed",
      "The movement near the entrance distracted her",
      "She forgot her notes",
      "She had a lecture",
    ],
    answer: "The movement near the entrance distracted her",
    level: 2,
    errorKey: "inference",
  },
  {
    question: "What did she change this week?",
    options: [
      "She arrived an hour earlier",
      "She went on a different day",
      "She used a study room",
      "She studied at home",
    ],
    answer: "She arrived an hour earlier",
    level: 2,
    errorKey: "detail-recall",
  },
  {
    question: "How long did she stay last week?",
    options: ["Ten minutes", "Twenty minutes", "One hour", "Two hours"],
    answer: "Twenty minutes",
    level: 1,
    errorKey: "detail-recall",
  },
  {
    question: "What does the passage suggest helps Thandi concentrate?",
    options: ["Background music", "A quiet, familiar spot", "Studying with friends", "Short breaks"],
    answer: "A quiet, familiar spot",
    level: 3,
    errorKey: "inference",
  },
  {
    question: "What did she do after finishing two chapters?",
    options: [
      "Went home",
      "Reviewed her notes",
      "Met a lecturer",
      "Borrowed another book",
    ],
    answer: "Reviewed her notes",
    level: 2,
    errorKey: "detail-recall",
  },
];

export function ReadingGame({ onComplete }: GameProps) {
  const { beginItem, record, summarise, count } = useGameTracker();
  const [reading, setReading] = useState(true);
  const [readStart] = useState(() => Date.now());
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"positive" | "neutral" | null>(null);

  useEffect(() => {
    if (!reading) beginItem();
  }, [index, reading, beginItem]);

  useEffect(() => {
    if (count === ITEMS.length) onComplete(summarise(true));
  }, [count, onComplete, summarise]);

  if (reading) {
    return (
      <div className="surface-card p-5 md:p-8">
        <p className="mb-4 text-sm text-muted-foreground">
          Read this short passage at your own pace. When you're ready, continue to a few questions —
          the passage will be hidden.
        </p>
        <p className="rounded-xl bg-muted/50 p-5 text-lg leading-relaxed">{PASSAGE}</p>
        <Button className="mt-6 w-full sm:w-auto" onClick={() => setReading(false)}>
          I've finished reading
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          Time spent reading: recorded to understand pace only — there is no time limit.
        </p>
      </div>
    );
  }

  const item = ITEMS[Math.min(index, ITEMS.length - 1)]!;

  const advance = () => {
    setChosen(null);
    setFeedback(null);
    setIndex((i) => i + 1);
  };

  const choose = (value: string) => {
    if (chosen) return;
    const correct = value === item.answer;
    setChosen(value);
    setFeedback(correct ? "positive" : "neutral");
    record({
      correct,
      errorKey: item.errorKey,
      level: item.level,
      ms: index === 0 ? Date.now() - readStart : undefined,
    });
    setTimeout(advance, 550);
  };

  return (
    <GameFrame
      step={index}
      total={ITEMS.length}
      feedback={feedback}
      hint="Answer from what you remember of the passage."
      onSkip={
        chosen
          ? undefined
          : () => {
              record({ correct: false, skipped: true, errorKey: item.errorKey, level: item.level });
              advance();
            }
      }
    >
      <p className="mb-6 font-display text-xl font-semibold">{item.question}</p>
      <ChoiceGrid
        options={item.options}
        onChoose={choose}
        chosen={chosen}
        disabled={!!chosen}
        columns={1}
      />
    </GameFrame>
  );
}
