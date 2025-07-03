import Cookies from "js-cookie";
import { MAX_USAGE, RESET_INTERVAL_HOURS } from "../constants/limits";

export function checkAndResetUsage(): { allowed: boolean } {
  const usageCount = parseInt(Cookies.get("usageCount") || "0", 10);
  const timestamp = parseInt(Cookies.get("usageTimestamp") || "0", 10);

  const now = Date.now();
  const hoursPassed = (now - timestamp) / (1000 * 60 * 60);

  if (isNaN(timestamp) || hoursPassed >= RESET_INTERVAL_HOURS) {
    Cookies.set("usageCount", "0");
    Cookies.set("usageTimestamp", now.toString());
    return { allowed: true };
  }

  if (usageCount >= MAX_USAGE) return { allowed: false };
  return { allowed: true };
}

export function incrementUsage() {
  const current = parseInt(Cookies.get("usageCount") || "0", 10);
  const newCount = current + 1;
  Cookies.set("usageCount", newCount.toString());

  if (!Cookies.get("usageTimestamp")) {
    Cookies.set("usageTimestamp", Date.now().toString());
  }
}

export function getRemainingTime(): { hours: number; minutes: number } | null {
  const resetTime = Cookies.get("usageResetTime");

  if (!resetTime) return null;

  const then = parseInt(resetTime, 10);
  const now = Date.now();
  const nextReset = then + RESET_INTERVAL_HOURS * 60 * 60 * 1000;

  const diff = nextReset - now;

  if (diff <= 0) return { hours: 0, minutes: 0 };

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.ceil((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes };
}

export function getUsageCount(): number {
  return parseInt(Cookies.get("usageCount") || "0", 10);
}
