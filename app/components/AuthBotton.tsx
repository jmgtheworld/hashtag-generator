"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p className="text-sm text-gray-500">Checking session...</p>;
  }

  if (session) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-600 font-bold">
          Signed in as{" "}
          <span className="font-semibold text-blue-600">
            {session.user?.email}
          </span>
        </span>
        <button
          onClick={() => signOut()}
          className="px-3 py-1.5 text-sm font-medium bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-300"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn()}
      className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
    >
      🔐 Sign in with Google
    </button>
  );
}
