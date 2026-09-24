import { useMemo, useState } from "react";
import { McqRounds, type GameProps, type McqItem } from "./GameEngine";
import { Button } from "@/components/ui/button";

type Q = [question: string, options: string[], errorKey: string]; // first option correct

const PASSAGES: Record<number, { text: string; questions: Q[] }> = {
  1: {
    text: "Sam has a red bag. Every morning he walks to the bus stop with his dog, Max. The bus comes at eight o'clock. Sam sits by the window and reads a comic book.",
    questions: [
      ["What colour is Sam's bag?", ["Red", "Blue", "Green", "Black"], "detail-recall"],
      ["What is the dog's name?", ["Max", "Sam", "Rex", "Buddy"], "detail-recall"],
      ["When does the bus come?", ["Eight o'clock", "Seven o'clock", "Nine o'clock", "Noon"], "detail-recall"],
      ["Where does Sam sit?", ["By the window", "At the back", "Next to the driver", "On the floor"], "detail-recall"],
      ["What does Sam read?", ["A comic book", "A newspaper", "A textbook", "A letter"], "detail-recall"],
    ],
  },
  2: {
    text: "Thandi walks to the campus library every Tuesday afternoon. She likes the quiet corner near the window. Last week the corner was taken, so she sat near the entrance. The movement distracted her and she left after twenty minutes. This week she arrived an hour earlier and got her favourite seat.",
    questions: [
      ["Which day does Thandi go to the library?", ["Tuesday", "Monday", "Thursday", "Friday"], "detail-recall"],
      ["Why did she leave early last week?", ["Movement near the entrance distracted her", "The library closed", "She forgot her notes", "She had a lecture"], "inference"],
      ["How long did she stay last week?", ["Twenty minutes", "Ten minutes", "One hour", "Two hours"], "detail-recall"],
      ["What did she change this week?", ["She arrived an hour earlier", "She went on another day", "She used a study room", "She studied at home"], "detail-recall"],
      ["What helps Thandi concentrate?", ["A quiet, familiar spot", "Background music", "Studying with friends", "Short breaks"], "inference"],
    ],
  },
  3: {
    text: "The city council planned to close the old market to build a parking garage. Traders argued that the market brought tourists and supported over two hundred families. After a month of public meetings, the council agreed to renovate the market instead and to build the garage on an unused lot two streets away. Some residents still worry the renovation will raise stall rents.",
    questions: [
      ["What did the council first plan?", ["Close the market for a garage", "Expand the market", "Build a new mall", "Raise taxes"], "detail-recall"],
      ["How many families did traders say the market supported?", ["Over two hundred", "About fifty", "Over a thousand", "Twenty"], "detail-recall"],
      ["What was finally decided?", ["Renovate the market; garage elsewhere", "Close the market", "Cancel both plans", "Move the traders"], "main-idea"],
      ["Where will the garage be built?", ["An unused lot two streets away", "Inside the market", "Next to city hall", "It won't be built"], "detail-recall"],
      ["Why are some residents still worried?", ["Stall rents may rise", "Tourists may leave", "The garage is too small", "Meetings will continue"], "inference"],
    ],
  },
  4: {
    text: "Although sleep is often sacrificed during exam periods, research consistently shows that memory consolidation depends heavily on it. During deep sleep the brain replays newly learned information, strengthening the connections that store it. Students who study late into the night may therefore remember less than peers who stop earlier and rest, even if they spend more hours with their notes. Moderate daytime naps appear to offer some, though not all, of the same benefits.",
    questions: [
      ["What is the main claim of the passage?", ["Sleep supports memory, so late-night study can backfire", "Naps replace night sleep", "Longer study always helps", "Exams should be shorter"], "main-idea"],
      ["What happens during deep sleep?", ["The brain replays new information", "The brain forgets old memories", "Heart rate rises", "Dreams stop"], "detail-recall"],
      ["According to the passage, late-night studiers may…", ["Remember less than rested peers", "Always score higher", "Need no revision", "Sleep more deeply"], "inference"],
      ["What does the passage say about naps?", ["They give some but not all benefits", "They are harmful", "They equal a full night", "They were not studied"], "detail-recall"],
      ["The word 'consolidation' most nearly means…", ["Strengthening and stabilising", "Forgetting", "Dividing", "Measuring"], "vocabulary"],
    ],
  },
  5: {
    text: "Proponents of universal basic income contend that unconditional cash transfers would mitigate the precarity introduced by automation, affording workers latitude to retrain or pursue unpaid care. Sceptics counter that the fiscal burden would be prohibitive absent substantial tax reform, and that removing work incentives could erode labour participation. Pilot programmes, however, have yielded equivocal results: recipients in several trials reported improved wellbeing without a marked decline in employment, yet the brevity and modest scale of these pilots limit how far such findings can be generalised.",
    questions: [
      ["What do proponents believe basic income would reduce?", ["Insecurity caused by automation", "Government spending", "Tax reform", "Care work"], "detail-recall"],
      ["What is the sceptics' main fiscal concern?", ["The cost without major tax reform", "Too little automation", "Pilots were too large", "Wellbeing would fall"], "detail-recall"],
      ["'Equivocal' results are best described as…", ["Mixed and open to interpretation", "Clearly positive", "Clearly negative", "Fraudulent"], "vocabulary"],
      ["What did several pilots find?", ["Better wellbeing, no marked drop in employment", "Large drops in employment", "No change in wellbeing", "Higher taxes"], "detail-recall"],
      ["Why does the author urge caution about the pilots?", ["They were short and small-scale", "They were biased", "They measured the wrong thing", "They were never published"], "inference"],
    ],
  },
};

export function ReadingGame({ level, onComplete }: GameProps) {
  const passage = PASSAGES[level] ?? PASSAGES[1]!;
  const [reading, setReading] = useState(true);
  const [readStart] = useState(() => Date.now());
  const items = useMemo<McqItem[]>(
    () => passage.questions.map(([prompt, options, errorKey]) => ({ prompt, options, answer: options[0]!, errorKey })),
    [passage],
  );

  if (reading) {
    return (
      <div className="surface-card p-5 md:p-8">
        <p className="mb-4 text-sm text-muted-foreground">
          Read this passage at your own pace. When you're ready, continue to five questions — the passage
          will be hidden.
        </p>
        <p className="rounded-xl bg-muted/50 p-5 text-lg leading-relaxed">{passage.text}</p>
        <Button className="mt-6 w-full sm:w-auto" onClick={() => setReading(false)}>
          I've finished reading
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          Reading time is recorded to understand pace only — there is no time limit.
        </p>
      </div>
    );
  }

  return (
    <McqRounds
      items={items}
      level={level}
      onComplete={onComplete}
      columns={1}
      timeFrom={readStart}
      hint="Answer from what you remember of the passage."
      promptClassName="mb-6 font-display text-xl font-semibold"
    />
  );
}
