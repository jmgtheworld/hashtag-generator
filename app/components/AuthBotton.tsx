"use client";

import { useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Cookies from "js-cookie";
import Image from "next/image";

export default function AuthButton() {
  const { data: session, status } = useSession();

  useEffect(() => {
    const fetchUsage = async () => {
      const res = await fetch("/api/checkUsage");
      if (!res.ok) return;

      const { count, resetIn } = await res.json();

      Cookies.set("usageCount", count.toString(), { expires: 1 });
      const resetTime =
        Date.now() + resetIn.hours * 3600000 + resetIn.minutes * 60000;
      Cookies.set("usageResetTime", resetTime.toString(), { expires: 1 });
    };

    if (status === "authenticated") {
      fetchUsage();
    } else if (status === "unauthenticated") {
      Cookies.remove("usageCount");
      Cookies.remove("usageResetTime");
    }
  }, [status]);

  if (session) {
    return (
      <div className="flex items-center gap-4">
        {session.user?.image && (
          <Image
            src={session.user.image}
            alt="User avatar"
            width={32}
            height={32}
            className="rounded-full"
          />
        )}
        <button
          onClick={() => {
            signOut();
            Cookies.remove("usageCount");
            Cookies.remove("usageResetTime");
          }}
          className="px-3 py-1 bg-red-500 rounded hover:bg-red-800 text-white"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn()}
      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Sign in
    </button>
  );
}
