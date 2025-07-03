import { NextRequest, NextResponse } from "next/server";
import openai from "../../utils/openai";
import { auth } from "../../lib/auth";
import { db } from "../../lib/firebaseAdmin";
import { MAX_USAGE, RESET_INTERVAL_HOURS } from "@/app/constants/limits";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { review, sentiment, tone } = await req.json();

  if (!review || !tone || !sentiment) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // 🔍 Fetch user usage from Firestore
  const email = session.user.email;
  const userRef = db.collection("users").doc(email);
  const snapshot = await userRef.get();

  const now = Date.now();
  let usageCount = 0;
  let lastReset = now;

  if (snapshot.exists) {
    const data = snapshot.data();
    usageCount = data?.count || 0;
    lastReset = data?.lastReset || now;

    const hoursSinceReset = (now - lastReset) / (1000 * 60 * 60);
    if (hoursSinceReset >= RESET_INTERVAL_HOURS) {
      usageCount = 0;
      lastReset = now;
    }

    if (usageCount >= MAX_USAGE) {
      const timeLeft = RESET_INTERVAL_HOURS - hoursSinceReset;
      const hours = Math.floor(timeLeft);
      const minutes = Math.ceil((timeLeft - hours) * 60);
      return NextResponse.json(
        {
          error: `Usage limit exceeded. Try again in ${hours}h ${minutes}m.`,
        },
        { status: 429 }
      );
    }
  }

  // 🧠 OpenAI Prompt
  const prompt = `
You're a business owner responding to a Google review.
Review: "${review}"

Tone: ${tone}
Sentiment: ${sentiment === "auto" ? "Detect automatically" : sentiment}

Write a short and thoughtful response in that tone.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    const response = completion.choices[0]?.message?.content?.trim() || "";

    // ✅ Increment usage only if response was generated
    if (response) {
      await userRef.set(
        {
          count: usageCount + 1,
          lastReset,
        },
        { merge: true }
      );
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error("OpenAI error:", error);
    return NextResponse.json(
      { error: "Failed to generate response." },
      { status: 500 }
    );
  }
}
