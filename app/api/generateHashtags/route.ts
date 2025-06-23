// app/api/generateHashtags/route.ts

import { NextRequest, NextResponse } from "next/server";
import openai from "../../utils/openai";

export async function POST(req: NextRequest) {
  const { imageUrl, options } = await req.json();

  // Default options
  const {
    hashtagCount = 10,
    tone = "fun",
    includeEmojis = true,
    promptPrefix = "Analyze this photo and generate:",
  } = options || {};

  const safeHashtagCount = Math.min(20, Math.max(1, hashtagCount));

  // Build prompt text
  const emojiText = includeEmojis ? "with emojis" : "without emojis";
  const prompt = `${promptPrefix}
1. A compelling Instagram caption (${emojiText}, ${tone} tone)
2. ${safeHashtagCount} relevant, trending hashtags
Output format:
Caption: ...
Hashtags: ...`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You're a social media assistant who creates Instagram posts from images.",
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    });

    const content = response.choices[0].message.content || "";

    // Split the response into caption and hashtags
    const captionMatch = content.match(/Caption:\s*(.*?)\s*Hashtags:/s);
    const hashtagsMatch = content.match(/Hashtags:\s*(.*)/s);

    const caption = captionMatch?.[1]?.trim() || "";
    const hashtags = hashtagsMatch?.[1]?.trim() || "";

    return NextResponse.json({ caption, hashtags });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate content." },
      { status: 500 }
    );
  }
}
