import { useEffect, useState } from "react";
import { ChoiceGrid, GameFrame, useGameTracker, type GameProps } from "./GameEngine";

interface Item {
  question: string;
  options: string[];
  answer: string;
  level: number;
  errorKey: string;
}

const ITEMS: Item[] = [
  {
    question: "You have a 09:00 test and a 08:30 bus that takes 40 minutes. What is the best first step?",
    options: [
      "Take the earlier 08:00 bus",
      "Take the 08:30 bus anyway",
      "Ask a friend to sign you in",
      "Start studying on the bus",
    ],
    answer: "Take the earlier 08:00 bus",
    level: 1,
    errorKey: "planning",
  },
  {
    question: "Which step comes first when writing an assignment?",
    options: ["Proofread", "Draft the body", "Understand the question", "Format references"],
    answer: "Understand the question",
    level: 1,
    errorKey: "sequencing",
  },
  {
    question: "Pattern: circle, square, circle, square, …",
    options: ["Circle", "Square", "Triangle", "Nothing"],
    answer: "Circle",
    level: 1,
    errorKey: "pattern",
  },
  {
    question: "All second-years must submit a proposal. Sipho is a second-year. Therefore…",
    options: [
      "Sipho must submit a proposal",
      "Sipho may skip the proposal",
      "Only Sipho submits",
      "Nothing can be concluded",
    ],
    answer: "Sipho must submit a proposal",
    level: 2,
    errorKey: "reasoning",
  },
  {
    question: "Three tasks are due Friday. One takes 4 hours, two take 1 hour. Today is Thursday. What now?",
    options: [
      "Start the 4-hour task today",
      "Do the two short tasks and hope for time",
      "Ask for an extension on all three",
      "Do nothing until Friday morning",
    ],
    answer: "Start the 4-hour task today",
    level: 2,
    errorKey: "prioritising",
  },
  {
    question: "Pattern: 2, 3, 5, 8, 12, …",
    options: ["15", "16", "17", "18"],
    answer: "17",
    level: 3,
    errorKey: "pattern",
  },
  {
    question: "Your group member has not sent their section and the deadline is tomorrow. Best action?",
    options: [
      "Contact them now and prepare a backup plan",
      "Submit without their section",
      "Wait until the morning",
      "Report them immediately",
    ],
    answer: "Contact them now and prepare a backup plan",
    level: 3,
    errorKey: "planning",
  },
  {
    question: "If the lab is closed on Wednesdays, and today the lab is open, then today is…",
    options: ["Wednesday", "Not Wednesday", "Thursday", "Cannot say anything"],
    answer: "Not Wednesday",
    level: 3,
    errorKey: "reasoning",
  },
];

export function LogicGame({ onComplete }: GameProps) {
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
    record({ correct, errorKey: item.errorKey, level: item.level });
    setTimeout(advance, 550);
  };

  return (
    <GameFrame
      step={index}
      total={ITEMS.length}
      feedback={feedback}
      hint="Pick the option that makes the most sense to you."
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
