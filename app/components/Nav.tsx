"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";

export default function Navigation() {
  const pathname = usePathname();
  return (
    <nav className="w-full bg-indigo-100 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / App Name */}
          <div className="flex items-center gap-2">
            <Image
              src="/images/purplecow.png"
              width={100}
              height={40}
              alt="Purple Cow Logo"
            />
            <span className="text-xl font-bold text-purple-400">DIGITAL</span>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-6">
            <a
              href="/"
              className={`text-sm px-4 py-2 rounded transition ${
                pathname === "/"
                  ? "text-blue-700 font-bold bg-sky-100"
                  : "text-blue-400 hover:text-black hover:bg-sky-50"
              }`}
            >
              📸 IG Generator
            </a>

            <a
              href="/review-responder"
              className={`text-sm px-4 py-2 rounded transition ${
                pathname === "/review-responder"
                  ? "text-blue-700 font-bold bg-sky-100"
                  : "text-blue-400 hover:text-black hover:bg-sky-50"
              }`}
            >
              ⭐ Review Responder
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
