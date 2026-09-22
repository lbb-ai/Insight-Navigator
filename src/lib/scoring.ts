import {
  AREA_GAMES,
  AREA_LABELS,
  BASELINE_RT_MS,
  GAMES,
  type GameMetrics,
  type GameType,
  type RiskArea,
} from "./games";

export type RiskBand = "low" | "medium" | "high";

export interface Thresholds {
  medium_threshold: number; // accuracy at/above this = low risk
  high_threshold: number; // accuracy below this = high risk
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  medium_threshold: 75,
  high_threshold: 55,
};

export interface AreaOutcome {
  area: RiskArea;
  band: RiskBand;
  signals: string[];
}

const BAND_RANK: Record<RiskBand, number> = { low: 0, medium: 1, high: 2 };

function bandFromAccuracy(accuracy: number, t: Thresholds): RiskBand {
  if (accuracy >= t.medium_threshold) return "low";
  if (accuracy >= t.high_threshold) return "medium";
  return "high";
}

function escalate(band: RiskBand): RiskBand {
  return band === "low" ? "medium" : "high";
}

/**
 * Transparent, rule-based classification. Every step that moves a band
 * writes a plain-language signal so staff can see exactly why.
 */
export function classifyGame(
  metrics: GameMetrics,
  thresholds: Thresholds = DEFAULT_THRESHOLDS,
): { band: RiskBand; signals: string[] } {
  const meta = GAMES[metrics.game_type];
  const signals: string[] = [];
  const accuracy = Math.round(metrics.accuracy);
  let band = bandFromAccuracy(accuracy, thresholds);

  signals.push(
    band === "low"
      ? `${meta.title}: accuracy ${accuracy}% (at or above the ${thresholds.medium_threshold}% expected range).`
      : `${meta.title}: accuracy ${accuracy}% (below the ${thresholds.medium_threshold}% expected range${
          band === "high" ? `, and below the ${thresholds.high_threshold}% review threshold` : ""
        }).`,
  );

  const baseline = BASELINE_RT_MS[metrics.game_type];
  const ratio = baseline > 0 ? metrics.avg_response_time_ms / baseline : 1;
  if (ratio >= 1.8) {
    signals.push(
      `Average response time ${(metrics.avg_response_time_ms / 1000).toFixed(1)}s — about ${ratio.toFixed(1)}x the peer baseline.`,
    );
    band = escalate(band);
  } else if (ratio >= 1.35) {
    signals.push(
      `Average response time ${(metrics.avg_response_time_ms / 1000).toFixed(1)}s — moderately above the peer baseline (${ratio.toFixed(1)}x).`,
    );
  }

  if (metrics.repeated_errors >= 4) {
    signals.push(
      `${metrics.repeated_errors} repeated errors of the same type, suggesting a consistent pattern rather than one-off slips.`,
    );
    band = escalate(band);
  } else if (metrics.repeated_errors >= 2) {
    signals.push(`${metrics.repeated_errors} repeated errors of the same type.`);
  }

  if (metrics.skipped_items >= 3) {
    signals.push(`${metrics.skipped_items} items skipped.`);
    band = escalate(band);
  } else if (metrics.skipped_items > 0) {
    signals.push(`${metrics.skipped_items} item(s) skipped.`);
  }

  if (!metrics.completed) {
    signals.push("Activity was not completed in this session.");
    band = escalate(band);
  }

  signals.push(`Difficulty reached: level ${metrics.difficulty_progression}.`);

  return { band, signals };
}

export function classifySession(
  results: GameMetrics[],
  perGame: Partial<Record<GameType, Thresholds>> = {},
): AreaOutcome[] {
  const outcomes: AreaOutcome[] = [];

  (Object.keys(AREA_GAMES) as RiskArea[]).forEach((area) => {
    const games: GameType[] = AREA_GAMES[area];
    const relevant = results.filter((r) => games.includes(r.game_type));
    if (relevant.length === 0) return;

    let band: RiskBand = "low";
    const signals: string[] = [];

    relevant.forEach((r) => {
      const outcome = classifyGame(r, perGame[r.game_type] ?? DEFAULT_THRESHOLDS);
      if (BAND_RANK[outcome.band] > BAND_RANK[band]) band = outcome.band;
      signals.push(...outcome.signals);
    });

    signals.unshift(
      `${AREA_LABELS[area]} classified ${band.toUpperCase()} based on ${relevant.length} activity result(s).`,
    );

    outcomes.push({ area, band, signals });
  });

  return outcomes;
}

export function overallBand(outcomes: { risk_band: RiskBand }[]): RiskBand {
  return outcomes.reduce<RiskBand>(
    (worst, o) => (BAND_RANK[o.risk_band] > BAND_RANK[worst] ? o.risk_band : worst),
    "low",
  );
}

export const BAND_LABEL: Record<RiskBand, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

/** Supportive, non-labelling copy shown to students. */
export const STUDENT_BAND_COPY: Record<RiskBand, { title: string; body: string }> = {
  low: {
    title: "Nothing stood out in this screening",
    body: "Your activity results sat within the usual range. This is not a diagnosis or a judgement of your ability — if studying still feels harder than it should, you can request support at any time.",
  },
  medium: {
    title: "A few areas may be worth a conversation",
    body: "Some activities showed patterns that the Disability Unit likes to look at with you. This is a prompt for a chat, not a label or a diagnosis. A staff member will review your results and suggest next steps.",
  },
  high: {
    title: "We'd like to connect you with support",
    body: "Several activities showed patterns the Disability Unit reviews closely. This does not diagnose anything and says nothing about your intelligence or potential — it simply means a trained person should look at this with you.",
  },
};
