// /api/checkUsage/route.ts
import { NextResponse } from "next/server";
import { auth } from "../../lib/auth";
import { db } from "../../lib/firebaseAdmin";
import {
  ACCEPTED_EMAILS,
  MAX_USAGE,
  RESET_INTERVAL_HOURS,
  TRIAL_EMAILS,
  MAX_TRIAL_USAGE,
} from "@/app/constants/limits";

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const isTrial = TRIAL_EMAILS.includes(email);
  const maxAllowed = isTrial ? MAX_TRIAL_USAGE : MAX_USAGE;

  // ❌ Completely block users not on any list
  if (!ACCEPTED_EMAILS.includes(email) && !isTrial) {
    return NextResponse.json({
      count: maxAllowed,
      remaining: 0,
      resetIn: { hours: 0, minutes: 0 },
      message: "This email is not authorized for generation.",
    });
  }

  const userRef = db.collection("users").doc(email);
  const snapshot = await userRef.get();

  const now = Date.now();
  let usageData: { count: number; lastReset: number };

  if (snapshot.exists && snapshot.data()) {
    usageData = snapshot.data() as { count: number; lastReset: number };
  } else {
    usageData = { count: 0, lastReset: now };
  }

  const hoursSinceReset = (now - usageData.lastReset) / (1000 * 60 * 60);

  if (hoursSinceReset >= RESET_INTERVAL_HOURS) {
    usageData = { count: 0, lastReset: now };
    await userRef.set(usageData, { merge: true });
  }

  const remaining = maxAllowed - usageData.count;
  const resetInMs =
    usageData.lastReset + RESET_INTERVAL_HOURS * 3600 * 1000 - now;

  const resetIn = {
    hours: Math.floor(resetInMs / (1000 * 60 * 60)),
    minutes: Math.ceil((resetInMs % (1000 * 60 * 60)) / (1000 * 60)),
  };

  return NextResponse.json({
    count: usageData.count,
    remaining,
    resetIn,
    trial: isTrial,
  });
}
