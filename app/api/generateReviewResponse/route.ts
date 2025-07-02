import { NextResponse } from "next/server";
import openai from "../../utils/openai"; // Or however you’re configuring OpenAI

export async function POST(req: Request) {
  const { review, sentiment, tone } = await req.json();

  const prompt = `
You're a business owner responding to a Google review.
Review: "${review}"

Tone: ${tone}
Sentiment: ${sentiment === "auto" ? "Detect automatically" : sentiment}

Write a short and thoughtful response in that tone.
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
  });

  const response = completion.choices[0]?.message?.content || "";

  return NextResponse.json({ response });
}
