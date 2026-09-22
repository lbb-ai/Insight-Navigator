import { useEffect, useState } from "react";
import { ChoiceGrid, GameFrame, useGameTracker, type GameProps } from "./GameEngine";

interface Item {
  options: string[];
  answer: string;
  level: number;
  errorKey: string;
}

const ITEMS: Item[] = [
  { options: ["libary", "library", "libraray", "librery"], answer: "library", level: 1, errorKey: "vowel-omission" },
  { options: ["recieve", "receeve", "receive", "receve"], answer: "receive", level: 1, errorKey: "vowel-order" },
  { options: ["definately", "definitely", "definetly", "definitley"], answer: "definitely", level: 2, errorKey: "vowel-order" },
  { options: ["seperate", "separate", "seperete", "separete"], answer: "separate", level: 2, errorKey: "vowel-omission" },
  { options: ["accommodation", "acommodation", "accomodation", "acomodation"], answer: "accommodation", level: 3, errorKey: "double-letters" },
  { options: ["neccessary", "necessary", "necesary", "neccesary"], answer: "necessary", level: 3, errorKey: "double-letters" },
  { options: ["rythm", "rhythm", "rhythem", "rythem"], answer: "rhythm", level: 3, errorKey: "consonant-cluster" },
  { options: ["occurence", "occurrence", "ocurrence", "occurrance"], answer: "occurrence", level: 3, errorKey: "double-letters" },
  { options: ["begining", "beginning", "beginnning", "begginning"], answer: "beginning", level: 2, errorKey: "double-letters" },
  { options: ["enviroment", "environment", "envirnoment", "enviornment"], answer: "environment", level: 2, errorKey: "letter-order" },
];

export function WordGame({ onComplete }: GameProps) {
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
      hint="Which spelling is correct?"
      onSkip={
        chosen
          ? undefined
          : () => {
              record({ correct: false, skipped: true, errorKey: item.errorKey, level: item.level });
              advance();
            }
      }
    >
      <ChoiceGrid options={item.options} onChoose={choose} chosen={chosen} disabled={!!chosen} />
    </GameFrame>
  );
}
