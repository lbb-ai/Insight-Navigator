import { useMemo } from "react";
import { McqRounds, type GameProps, type McqItem } from "./GameEngine";

// [correct, misspelling, misspelling, misspelling, errorKey]
type Row = [string, string, string, string, string];

const BANK: Record<number, Row[]> = {
  1: [
    ["friend", "freind", "frend", "frined", "vowel-order"],
    ["because", "becuase", "becos", "becaus", "vowel-order"],
    ["people", "peple", "poeple", "peeple", "vowel-omission"],
    ["which", "wich", "whitch", "whicth", "silent-letter"],
    ["school", "skool", "scool", "schol", "consonant-cluster"],
  ],
  2: [
    ["library", "libary", "libraray", "librery", "vowel-omission"],
    ["receive", "recieve", "receeve", "receve", "vowel-order"],
    ["separate", "seperate", "seperete", "separete", "vowel-omission"],
    ["beginning", "begining", "beginnning", "begginning", "double-letters"],
    ["tomorrow", "tommorow", "tomorow", "tommorrow", "double-letters"],
  ],
  3: [
    ["definitely", "definately", "definetly", "definitley", "vowel-order"],
    ["necessary", "neccessary", "necesary", "neccesary", "double-letters"],
    ["environment", "enviroment", "envirnoment", "enviornment", "letter-order"],
    ["government", "goverment", "govenment", "governmant", "silent-letter"],
    ["argument", "arguement", "arguemnt", "argumant", "vowel-omission"],
  ],
  4: [
    ["accommodation", "acommodation", "accomodation", "acomodation", "double-letters"],
    ["occurrence", "occurence", "ocurrence", "occurrance", "double-letters"],
    ["rhythm", "rythm", "rhythem", "rythem", "consonant-cluster"],
    ["conscientious", "consciencious", "conscientous", "consientious", "consonant-cluster"],
    ["embarrass", "embarass", "embarras", "embaress", "double-letters"],
  ],
  5: [
    ["onomatopoeia", "onomatopeia", "onomatopoea", "onamatopoeia", "vowel-order"],
    ["bureaucracy", "beaurocracy", "bureacracy", "bureaucrasy", "vowel-order"],
    ["questionnaire", "questionaire", "questionnare", "questionnair", "double-letters"],
    ["millennium", "millenium", "milennium", "millenniem", "double-letters"],
    ["mischievous", "mischievious", "mischevous", "mischievos", "letter-order"],
  ],
};

export function WordGame({ level, onComplete }: GameProps) {
  const items = useMemo<McqItem[]>(
    () =>
      (BANK[level] ?? BANK[1]!).map(([answer, a, b, c, errorKey]) => ({
        prompt: "Which spelling is correct?",
        answer,
        options: [answer, a, b, c],
        errorKey,
      })),
    [level],
  );
  return (
    <McqRounds
      items={items}
      level={level}
      onComplete={onComplete}
      hint="Spot the word that is spelled correctly."
      promptClassName="mb-5 text-center font-display text-lg font-semibold"
    />
  );
}
