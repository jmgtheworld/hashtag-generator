import { NextResponse } from "next/server";

export async function GET() {
  const redirectUri = process.env.NEXT_PUBLIC_META_REDIRECT_URI!;
  const url = new URL("https://www.facebook.com/v23.0/dialog/oauth");

  url.searchParams.set("client_id", process.env.META_CLIENT_ID!);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");

  url.searchParams.set(
    "scope",
    [
      "pages_show_list",
      "instagram_basic",
      "pages_read_engagement",
      "pages_manage_posts",
      "instagram_content_publish", // 🔥 required for posting
    ].join(",")
  );

  return NextResponse.redirect(url.toString());
}
