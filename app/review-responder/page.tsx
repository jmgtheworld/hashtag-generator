"use client";

import Navigation from "../components/Nav";

export default function ReviewResponder() {
  return (
    <div>
      <Navigation />
      <main className="bg-white min-h-screen p-8 max-w-xl mx-auto">
        <div className="p-8 max-w-xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold mb-4">
              ⭐ Google Review Responder
            </h1>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Upload or paste customer reviews and get professionally written
          replies.
        </p>
        {/* Your input & output UI will go here */}
      </main>
    </div>
  );
}
