import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../lib/auth";
import { db } from "../../lib/firebaseAdmin";
import openai from "@/app/utils/openai";
import { MAX_USAGE, RESET_INTERVAL_HOURS } from "@/app/constants/limits";

export async function POST(req: NextRequest) {
  const session = await auth();
  const { imageUrl, imageUrls, options, excludeHashtags } = await req.json();
  const hashtagCount = options?.hashtagCount || 10;
  const tone = options?.tone || "fun";
  const includeEmojis = options?.includeEmojis !== false;
  const language = options?.language || "English";

  if (!imageUrl && (!imageUrls || imageUrls.length === 0)) {
    return NextResponse.json({ error: "No images provided." }, { status: 400 });
  }

  let usageCount = 0;
  let lastReset = Date.now();

  // 🔐 If user is logged in, check Firestore for usage
  if (session?.user?.email) {
    const email = session.user.email;
    const userRef = db.collection("users").doc(email);
    const snapshot = await userRef.get();

    const now = Date.now();

    if (snapshot.exists) {
      const usageData = snapshot.data();
      usageCount = usageData?.count || 0;
      lastReset = usageData?.lastReset || now;

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
  }

  // 🧠 Prompt for OpenAI
  const buildPrompt = () => {
    const toneDescription =
      tone === "sales pitch"
        ? "in a persuasive, benefit-driven sales pitch tone designed to attract customers"
        : `in a ${tone} tone`;

    return `Analyze the image${imageUrls?.length > 1 ? "s" : ""} and generate:
        1. An Instagram caption ${toneDescription} ${
      includeEmojis ? "(include emojis)" : "(no emojis)"
    } in ${language}.
        ${
          !excludeHashtags
            ? `2. Up to ${hashtagCount} relevant, trending hashtags (exclude generic ones like #food or #instagood)`
            : ""
        }

        Make sure the caption highlights benefits and appeals to emotions if possible. Keep it concise, engaging, and marketing-friendly.`;
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

    let caption = captionMatch?.[1]?.trim() || "";

    // Remove any trailing number or "2." from the end
    caption = caption.replace(/2\.$/, "").trim();
    const hashtags = hashtagsMatch?.[1]?.trim() || "";

    // ✅ Update usage only if caption was successfully generated
    if (session?.user?.email && caption) {
      const userRef = db.collection("users").doc(session.user.email);
      await userRef.set(
        {
          count: usageCount + 1,
          lastReset,
          usageResetTime: Date.now() + RESET_INTERVAL_HOURS * 60 * 60 * 1000,
        },
        { merge: true }
      );
    }

    return NextResponse.json({ caption, hashtags });
  } catch (error) {
    console.error("OpenAI Error:", error);
    return NextResponse.json(
      { error: "Failed to generate content." },
      { status: 500 }
    );
  }
}
