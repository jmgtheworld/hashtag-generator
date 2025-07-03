// lib/auth.ts
import { getServerSession } from "next-auth";
import { authOptions } from "./authOptions"; // ✅ now valid and circular-free

export function auth() {
  return getServerSession(authOptions);
}
