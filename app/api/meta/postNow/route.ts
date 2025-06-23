import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, caption, accessToken, igUserId } = await req.json();

    if (!imageUrl || !caption || !accessToken || !igUserId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Step 1: Create media container
    const mediaRes = await fetch(
      `https://graph.facebook.com/v23.0/${igUserId}/media`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: imageUrl,
          caption,
          access_token: accessToken,
        }),
      }
    );

    const mediaData = await mediaRes.json();

    if (!mediaData.id) {
      console.error("Media creation failed:", mediaData);
      return NextResponse.json(
        { error: "Media creation failed", details: mediaData },
        { status: 500 }
      );
    }

    const creationId = mediaData.id;

    // Step 2: Publish the media
    const publishRes = await fetch(
      `https://graph.facebook.com/v23.0/${igUserId}/media_publish`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: accessToken,
        }),
      }
    );

    const publishData = await publishRes.json();

    if (!publishData.id) {
      console.error("Media publish failed:", publishData);
      return NextResponse.json(
        { error: "Publishing failed", details: publishData },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, postId: publishData.id });
  } catch (err) {
    console.error("Unexpected error posting to Instagram:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
