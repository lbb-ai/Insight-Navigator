import { useEffect, useState } from "react";
import { ChoiceGrid, GameFrame, useGameTracker, type GameProps } from "./GameEngine";

interface Item {
  prompt: string;
  options: string[];
  answer: string;
  level: number;
  errorKey: string;
}

const ITEMS: Item[] = [
  { prompt: "7 + 8", options: ["13", "15", "16", "17"], answer: "15", level: 1, errorKey: "addition" },
  { prompt: "24 − 9", options: ["13", "14", "15", "16"], answer: "15", level: 1, errorKey: "subtraction" },
  { prompt: "Which number is largest?", options: ["0.7", "0.19", "0.34", "0.5"], answer: "0.7", level: 1, errorKey: "magnitude" },
  { prompt: "6 × 7", options: ["36", "42", "48", "49"], answer: "42", level: 2, errorKey: "multiplication" },
  { prompt: "Next in the sequence: 3, 6, 12, 24, …", options: ["30", "36", "48", "54"], answer: "48", level: 2, errorKey: "sequencing" },
  { prompt: "45 ÷ 5", options: ["7", "8", "9", "11"], answer: "9", level: 2, errorKey: "division" },
  { prompt: "15% of 200", options: ["15", "25", "30", "35"], answer: "30", level: 3, errorKey: "proportion" },
  { prompt: "Next in the sequence: 1, 4, 9, 16, …", options: ["20", "24", "25", "27"], answer: "25", level: 3, errorKey: "sequencing" },
  { prompt: "A taxi costs R18. You pay with R50. Change?", options: ["R28", "R32", "R34", "R42"], answer: "R32", level: 3, errorKey: "subtraction" },
  { prompt: "Which is equal to 3/4?", options: ["0.34", "0.43", "0.75", "0.7"], answer: "0.75", level: 3, errorKey: "magnitude" },
];

export function NumberGame({ onComplete }: GameProps) {
  const { beginItem, record, summarise, count } = useGameTracker();
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"positive" | "neutral" | null>(null);

  useEffect(() => {
    beginItem();
  }, [index, beginItem]);

  useEffect(() => {
    if (count === ITEMS.length) onComplete(summarise(true));
  }, [count, onComplete, summarise]);

  const advance = () => {
    setChosen(null);
    setFeedback(null);
    setIndex((i) => i + 1);
  };

  const item = ITEMS[Math.min(index, ITEMS.length - 1)]!;

  const choose = (value: string) => {
    if (chosen) return;
    const correct = value === item.answer;
    setChosen(value);
    setFeedback(correct ? "positive" : "neutral");
    record({ correct, errorKey: item.errorKey, level: item.level });
    setTimeout(advance, 550);
  };

  return (
    <GameFrame
      step={index}
      total={ITEMS.length}
      feedback={feedback}
      hint="Choose the answer that fits. Work at a comfortable pace."
      onSkip={
        chosen
          ? undefined
          : () => {
              record({ correct: false, skipped: true, errorKey: item.errorKey, level: item.level });
              advance();
            }
      }
    >
      <p className="mb-6 text-center font-display text-3xl font-semibold md:text-4xl">
        {item.prompt}
      </p>
      <ChoiceGrid options={item.options} onChoose={choose} chosen={chosen} disabled={!!chosen} />
    </GameFrame>
  );
}
