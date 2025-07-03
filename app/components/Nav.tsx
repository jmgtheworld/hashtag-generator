"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AuthButton from "./AuthBotton";

export default function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { href: "/", label: "📸 IG Generator" },
    { href: "/review-responder", label: "⭐ Review Responder" },
  ];

  const isActive = (href: string) =>
    pathname === href
      ? "text-blue-700 font-bold bg-purple-300"
      : "text-blue-400 hover:text-black hover:bg-sky-50";

  return (
    <nav className="bg-indigo-100 text-blue-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo + Links */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/purplecow.png"
                alt="Logo"
                width={100}
                height={200}
              />
              <span className="text-xl font-bold text-purple-400">AI</span>
            </Link>

            {/* Desktop Menu Links */}
            <div className="hidden md:flex gap-4">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm px-4 py-2 rounded transition ${isActive(
                    item.href
                  )}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Auth Button */}
          <div className="hidden md:flex items-center gap-4">
            <AuthButton />
          </div>

          {/* Mobile: Auth + Hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <AuthButton />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-purple-700 focus:outline-none"
              aria-label="Toggle Menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-indigo-100 px-4 py-4 border-t border-purple-200">
          <div className="flex flex-col gap-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm px-4 py-2 rounded transition ${isActive(
                  item.href
                )}`}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
