import { MAX_USAGE, RESET_INTERVAL_HOURS } from "../constants/limits";

export function checkAndResetUsage(): { allowed: boolean; usageCount: number } {
  const now = Date.now();
  const storedReset = localStorage.getItem("usageResetTime");
  const storedUsage = parseInt(localStorage.getItem("usageCount") || "0");

  if (!storedReset || now > parseInt(storedReset)) {
    localStorage.setItem("usageCount", "0");
    localStorage.setItem(
      "usageResetTime",
      (now + RESET_INTERVAL_HOURS * 60 * 60 * 1000).toString()
    );
    return { allowed: true, usageCount: 0 };
  }

  if (storedUsage >= MAX_USAGE) {
    return { allowed: false, usageCount: storedUsage };
  }

  return { allowed: true, usageCount: storedUsage };
}

export function incrementUsage() {
  const usage = parseInt(localStorage.getItem("usageCount") || "0");
  localStorage.setItem("usageCount", (usage + 1).toString());
}

export function getRemainingTime(): { hours: number; minutes: number } | null {
  if (typeof window === "undefined") return null; // ✅ Prevent SSR errors

  const reset = localStorage.getItem("usageResetTime");
  if (!reset) return null;

  const msLeft = parseInt(reset) - Date.now();
  if (msLeft <= 0) return null;

  const minutes = Math.floor(msLeft / (1000 * 60)) % 60;
  const hours = Math.floor(msLeft / (1000 * 60 * 60));
  return { hours, minutes };
}
