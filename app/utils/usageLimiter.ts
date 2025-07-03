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
  const reset = Cookies.get("usageTimestamp");
  if (!reset) return null;

  const msLeft =
    parseInt(reset, 10) + RESET_INTERVAL_HOURS * 60 * 60 * 1000 - Date.now();
  if (msLeft <= 0) return null;

  const minutes = Math.floor(msLeft / (1000 * 60)) % 60;
  const hours = Math.floor(msLeft / (1000 * 60 * 60));
  return { hours, minutes };
}

export function getUsageCount(): number {
  return parseInt(Cookies.get("usageCount") || "0", 10);
}
