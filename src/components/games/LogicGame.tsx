import { useMemo } from "react";
import { McqRounds, type GameProps, type McqItem } from "./GameEngine";

// First option is correct; options are shuffled at play time.
type Row = [prompt: string, options: string[], errorKey: string];

const BANK: Record<number, Row[]> = {
  1: [
    ["Pattern: circle, square, circle, square, …", ["Circle", "Square", "Triangle", "Star"], "pattern"],
    ["Which step comes first when writing an assignment?", ["Understand the question", "Proofread", "Draft the body", "Format references"], "sequencing"],
    ["It is raining and you are walking to campus. What helps most?", ["Take an umbrella", "Wear sunglasses", "Leave your bag", "Walk slower"], "planning"],
    ["All cats have whiskers. Milo is a cat. So Milo…", ["Has whiskers", "Has no whiskers", "Is a dog", "Cannot be known"], "reasoning"],
    ["Morning, afternoon, evening, … what comes next?", ["Night", "Morning", "Noon", "Dawn"], "sequencing"],
  ],
  2: [
    ["You have a 09:00 test and the bus takes 40 minutes. Latest safe bus?", ["08:10", "08:30", "08:45", "08:55"], "planning"],
    ["Pattern: A, C, E, G, …", ["I", "H", "J", "K"], "pattern"],
    ["All second-years submit a proposal. Sipho is a second-year. Therefore…", ["Sipho submits a proposal", "Sipho may skip it", "Only Sipho submits", "Nothing can be concluded"], "reasoning"],
    ["Order these: cook, eat, buy food, wash dishes. What is 2nd?", ["Cook", "Eat", "Buy food", "Wash dishes"], "sequencing"],
    ["Your phone is at 5% and you need it tonight. Best first step?", ["Charge it now", "Turn up brightness", "Play a game", "Ignore it"], "prioritising"],
  ],
  3: [
    ["Three tasks are due Friday: one 4-hour, two 1-hour. It's Thursday. What now?", ["Start the 4-hour task today", "Do the short ones and hope", "Ask for three extensions", "Wait until Friday"], "prioritising"],
    ["Pattern: 2, 3, 5, 8, 12, …", ["17", "15", "16", "18"], "pattern"],
    ["If the lab is closed on Wednesdays, and today it is open, then today is…", ["Not Wednesday", "Wednesday", "Thursday", "Cannot say anything"], "reasoning"],
    ["A group member hasn't sent their section; deadline is tomorrow. Best action?", ["Contact them now and plan a backup", "Submit without it", "Wait until morning", "Report them immediately"], "planning"],
    ["Lindo is taller than Ayanda. Ayanda is taller than Zola. Who is shortest?", ["Zola", "Ayanda", "Lindo", "Cannot tell"], "reasoning"],
  ],
  4: [
    ["Some students are athletes. All athletes train daily. Which must be true?", ["Some students train daily", "All students train daily", "No students train daily", "All who train are athletes"], "reasoning"],
    ["Pattern: 1, 4, 9, 16, 25, …", ["36", "30", "35", "49"], "pattern"],
    ["A meeting is 3 days after the day before Monday. What day is it?", ["Wednesday", "Tuesday", "Thursday", "Sunday"], "sequencing"],
    ["You have R100 for a week: R60 transport is fixed. Snacks R8/day. What's left after 5 days?", ["R0", "R20", "R40", "R12"], "planning"],
    ["If no reptiles have fur and some pets are reptiles, then…", ["Some pets have no fur", "All pets have fur", "No pets have fur", "All reptiles are pets"], "reasoning"],
  ],
  5: [
    ["Pattern: 2, 6, 12, 20, 30, …", ["42", "40", "36", "44"], "pattern"],
    ["Only if the report is approved will funding be released. Funding was released. So…", ["The report was approved", "The report was rejected", "Funding needs no report", "Nothing follows"], "reasoning"],
    ["Tasks: A (needs B done), B (needs C done), D (none), C (needs D done). Which is done 3rd?", ["B", "C", "A", "D"], "sequencing"],
    ["Exam at 14:00, 90-minute journey, 20 min to find the venue, 15 min buffer. Latest departure?", ["11:55", "12:10", "12:25", "11:40"], "planning"],
    ["Five friends sit in a row. Ann is in the middle, Ben is left of Ann but not at the end. Where is Ben?", ["Seat 2", "Seat 1", "Seat 4", "Seat 5"], "reasoning"],
  ],
};

export function LogicGame({ level, onComplete }: GameProps) {
  const items = useMemo<McqItem[]>(
    () =>
      (BANK[level] ?? BANK[1]!).map(([prompt, options, errorKey]) => ({
        prompt,
        options,
        answer: options[0]!,
        errorKey,
      })),
    [level],
  );
  return (
    <McqRounds
      items={items}
      level={level}
      onComplete={onComplete}
      columns={1}
      hint="Pick the option that makes the most sense to you."
      promptClassName="mb-6 font-display text-xl font-semibold"
    />
  );
}
