import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../lib/auth";
import { db } from "../../lib/firebaseAdmin";

const MAX_USAGE = 30;
const RESET_INTERVAL_HOURS = 24;

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const email = session.user.email;
  const userRef = db.collection("users").doc(email);
  const snapshot = await userRef.get();

  const now = Date.now();
  let usageData = snapshot.data() ?? { count: 0, lastReset: now };

  const hoursSinceReset = (now - usageData.lastReset) / (1000 * 60 * 60);

  if (hoursSinceReset >= RESET_INTERVAL_HOURS) {
    usageData = { count: 0, lastReset: now };
    await userRef.set(usageData, { merge: true });
  }

  const remaining = MAX_USAGE - usageData.count;
  const resetInMs =
    usageData.lastReset + RESET_INTERVAL_HOURS * 3600 * 1000 - now;
  const resetIn = {
    hours: Math.floor(resetInMs / (1000 * 60 * 60)),
    minutes: Math.ceil((resetInMs % (1000 * 60 * 60)) / (1000 * 60)),
  };

  if (usageData.count >= MAX_USAGE) {
    return NextResponse.json(
      {
        error: `Usage limit exceeded. Try again in ${resetIn.hours}h ${resetIn.minutes}m.`,
        count: usageData.count,
        resetIn,
      },
      { status: 429 }
    );
  }

  return NextResponse.json({
    count: usageData.count,
    remaining,
    resetIn,
  });
}
