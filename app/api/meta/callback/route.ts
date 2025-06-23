// app/api/meta/callback/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const redirectUri = process.env.NEXT_PUBLIC_META_REDIRECT_URI!;
  const appId = process.env.META_CLIENT_ID!;
  const appSecret = process.env.META_CLIENT_SECRET!;

  console.log("code", code);
  console.log("appId", appId);
  console.log("appSecret", appSecret);

  // 1. Exchange code → short-lived token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v23.0/oauth/access_token?` +
      new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code: code!,
      })
  );

  const tokenData = await tokenRes.json();
  const shortToken = tokenData.access_token;

  // 2. Exchange for long-lived token
  const longRes = await fetch(
    `https://graph.facebook.com/v23.0/oauth/access_token?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: shortToken,
      })
  );

  const { access_token } = await longRes.json();

  // 3. Get user's Pages
  const pagesRes = await fetch(
    `https://graph.facebook.com/v23.0/me/accounts?access_token=${access_token}`
  );
  const pages = await pagesRes.json();
  console.log("pages", pages);
  const page = pages.data?.[0]; // use first page (can expand UI later)

  if (!page) {
    return NextResponse.json(
      { error: "No connected Facebook Pages found." },
      { status: 400 }
    );
  }

  // 4. Get IG Business Account ID using page-level access token
  const pageAccessToken = page.access_token;
  console.log("page", page);

  const pageDetailsRes = await fetch(
    `https://graph.facebook.com/v23.0/${page.id}?fields=instagram_business_account&access_token=${pageAccessToken}`
  );
  const pageDetails = await pageDetailsRes.json();
  const igId = pageDetails.instagram_business_account?.id;

  if (!igId) {
    return NextResponse.json(
      { error: "No Instagram business account linked." },
      { status: 400 }
    );
  }

  // 5. Get IG username (use page access token too)
  const igRes = await fetch(
    `https://graph.facebook.com/v23.0/${igId}?fields=username&access_token=${pageAccessToken}`
  );
  const igData = await igRes.json();

  // 6. Redirect back to home with user info in query
  const url = new URL("http://localhost:3000");
  url.searchParams.set("ig_id", igId);
  url.searchParams.set("fb_page_id", page.id);
  url.searchParams.set("access_token", pageAccessToken);
  url.searchParams.set("username", igData.username);

  return NextResponse.redirect(url.toString());
}
