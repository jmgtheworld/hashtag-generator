"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="w-full bg-indigo-100 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Image
              src="/images/purplecow.png"
              width={100}
              height={40}
              alt="Purple Cow Logo"
            />
            <span className="text-xl font-bold text-purple-400">AI</span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`text-sm px-4 py-2 rounded transition ${
                pathname === "/"
                  ? "text-blue-700 font-bold bg-sky-100"
                  : "text-blue-400 hover:text-black hover:bg-sky-50"
              }`}
            >
              📸 IG Generator
            </Link>

            <Link
              href="/review-responder"
              className={`text-sm px-4 py-2 rounded transition ${
                pathname === "/review-responder"
                  ? "text-blue-700 font-bold bg-sky-100"
                  : "text-blue-400 hover:text-black hover:bg-sky-50"
              }`}
            >
              ⭐ Review Responder
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-purple-700 focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-16 right-0 w-1/2 bg-indigo-100 text-blue-800 flex flex-col py-4 px-4 shadow-lg z-50">
            <Link
              href="/"
              className={`block text-sm px-4 py-2 rounded transition ${
                pathname === "/"
                  ? "text-blue-700 font-bold bg-sky-100"
                  : "text-blue-400 hover:text-black hover:bg-sky-50"
              }`}
            >
              📸 IG Generator
            </Link>

            <a
              href="/review-responder"
              className={`block text-sm px-4 py-2 rounded transition ${
                pathname === "/review-responder"
                  ? "text-blue-700 font-bold bg-sky-100"
                  : "text-blue-400 hover:text-black hover:bg-sky-50"
              }`}
            >
              ⭐ Review Responder
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}
