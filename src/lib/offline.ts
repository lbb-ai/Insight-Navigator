import { supabase } from "@/integrations/supabase/client";
import type { GameMetrics } from "./games";

const KEY = "ld-screening-pending-results";

export interface PendingResult extends GameMetrics {
  session_id: string;
  user_id: string;
}

function read(): PendingResult[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as PendingResult[];
  } catch {
    return [];
  }
}

function write(items: PendingResult[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

/** Saves a game result, keeping it locally if the device is offline. */
export async function saveGameResult(payload: PendingResult): Promise<{ queued: boolean }> {
  const { error } = await supabase
    .from("game_results")
    .upsert(payload, { onConflict: "session_id,game_type" });
  if (error) {
    write([...read().filter((p) => !(p.session_id === payload.session_id && p.game_type === payload.game_type)), payload]);
    return { queued: true };
  }
  return { queued: false };
}

/** Retries anything saved while offline. */
export async function flushPendingResults(): Promise<number> {
  const pending = read();
  if (pending.length === 0) return 0;
  const { error } = await supabase
    .from("game_results")
    .upsert(pending, { onConflict: "session_id,game_type" });
  if (error) return 0;
  write([]);
  return pending.length;
}

export function pendingCount(): number {
  return read().length;
}
