// app/api/generateHashtags/route.ts

import { NextRequest, NextResponse } from "next/server";
import openai from "../../utils/openai";

export async function POST(req: NextRequest) {
  const { imageUrl, imageUrls, options } = await req.json();
  const hashtagCount = options?.hashtagCount || 10;
  const tone = options?.tone || "fun";
  const includeEmojis = options?.includeEmojis !== false;

  if (!imageUrl && (!imageUrls || imageUrls.length === 0)) {
    return NextResponse.json({ error: "No images provided." }, { status: 400 });
  }

  const language = options?.language || "English";

  const buildPrompt = () => {
    return `Analyze the image${imageUrls?.length > 1 ? "s" : ""} and generate:
    1. An Instagram caption in a ${tone} tone ${
      includeEmojis ? "(with emojis)" : "(no emojis)"
    }
    2. Up to ${hashtagCount} relevant, trending hashtags

    Please write the caption and hashtags in ${language}.

    Output format:
    Caption: ...
    Hashtags: ...`;
  };

  try {
    const imageArray = imageUrls || [imageUrl];

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
            ...imageArray.map((url: string) => ({
              type: "image_url",
              image_url: { url },
            })),
            {
              type: "text",
              text: buildPrompt(),
            },
          ],
        },
      ],
    });

    const content = response.choices[0].message.content || "";

    const captionMatch = content.match(/Caption:\s*(.*?)\s*Hashtags:/s);
    const hashtagsMatch = content.match(/Hashtags:\s*(.*)/s);

    const caption = captionMatch?.[1]?.trim() || "";
    const hashtags = hashtagsMatch?.[1]?.trim() || "";

    return NextResponse.json({ caption, hashtags });
  } catch (error) {
    console.error("OpenAI Error:", error);
    return NextResponse.json(
      { error: "Failed to generate content." },
      { status: 500 }
    );
  }
}
