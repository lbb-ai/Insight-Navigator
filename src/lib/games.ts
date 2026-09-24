export type GameType = "number" | "word" | "memory" | "reading" | "logic" | "attention";

export type RiskArea =
  | "dyscalculia"
  | "dyslexia"
  | "working-memory"
  | "executive-function"
  | "attention";

export interface GameMeta {
  type: GameType;
  title: string;
  area: RiskArea;
  /** Supportive "why am I playing this?" framing — never clinical. */
  why: string;
  captures: string;
  minutes: number;
  icon: string;
}

export const GAME_ORDER: GameType[] = [
  "number",
  "word",
  "memory",
  "reading",
  "logic",
  "attention",
];

export const GAMES: Record<GameType, GameMeta> = {
  number: {
    type: "number",
    title: "Number Challenge",
    area: "dyscalculia",
    why: "A few quick number puzzles. We're looking at how you work with numbers and sequences — there is no pass or fail here.",
    captures: "Arithmetic accuracy, sequencing, number sense",
    minutes: 3,
    icon: "Calculator",
  },
  word: {
    type: "word",
    title: "Word Challenge",
    area: "dyslexia",
    why: "Spot the word that's spelled correctly. This helps us understand how you recognise written words.",
    captures: "Spelling, word recognition, vocabulary",
    minutes: 3,
    icon: "SpellCheck",
  },
  memory: {
    type: "memory",
    title: "Flip & Match",
    area: "working-memory",
    why: "Flip the cards and find the matching pairs. This shows how well you hold places in mind as you go.",
    captures: "Recall under load, working-memory span",
    minutes: 3,
    icon: "Brain",
  },
  reading: {
    type: "reading",
    title: "Reading Challenge",
    area: "dyslexia",
    why: "Read a short passage at your own pace, then answer a few questions about it. Take the time you need.",
    captures: "Reading fluency and comprehension",
    minutes: 4,
    icon: "BookOpen",
  },
  logic: {
    type: "logic",
    title: "Logic & Scenario",
    area: "executive-function",
    why: "Everyday situations and patterns. This looks at how you plan, sequence and work through a problem.",
    captures: "Sequencing, reasoning, problem-solving",
    minutes: 4,
    icon: "Puzzle",
  },
  attention: {
    type: "attention",
    title: "Focus Challenge",
    area: "attention",
    why: "Respond to the middle arrow while ignoring the others — rules get trickier as levels rise. This looks at steady, selective focus.",
    captures: "Sustained focus, consistency, reaction time",
    minutes: 3,
    icon: "Target",
  },
};

export const AREA_LABELS: Record<RiskArea, string> = {
  dyscalculia: "Dyscalculia indicators",
  dyslexia: "Dyslexia indicators",
  "working-memory": "Working-memory difficulty",
  "executive-function": "Executive-function difficulty",
  attention: "Attention-related indicators",
};

export const AREA_SHORT: Record<RiskArea, string> = {
  dyscalculia: "Numeracy",
  dyslexia: "Reading & language",
  "working-memory": "Working memory",
  "executive-function": "Planning & reasoning",
  attention: "Focus & attention",
};

export const AREA_GAMES: Record<RiskArea, GameType[]> = {
  dyscalculia: ["number"],
  dyslexia: ["word", "reading"],
  "working-memory": ["memory"],
  "executive-function": ["logic"],
  attention: ["attention"],
};

export interface GameMetrics {
  game_type: GameType;
  accuracy: number;
  avg_response_time_ms: number;
  skipped_items: number;
  repeated_errors: number;
  difficulty_progression: number;
  completed: boolean;
}

/** Peer baseline response times (ms) used for explainable comparisons. */
export const BASELINE_RT_MS: Record<GameType, number> = {
  number: 6000,
  word: 5000,
  memory: 2500,
  reading: 9000,
  logic: 9000,
  attention: 700,
};
