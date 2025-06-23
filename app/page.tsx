"use client";

import { useState } from "react";
import ImageUploader from "./components/ImageUploader";

export default function Home() {
  const [images, setImages] = useState<string[]>([]);
  const [results, setResults] = useState<
    { url: string; caption: string; hashtags: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // 🆕 Customization states
  const [hashtagCount, setHashtagCount] = useState(10);
  const [tone, setTone] = useState("fun");
  const [includeEmojis, setIncludeEmojis] = useState(true);

  const handleGenerate = async () => {
    setLoading(true);
    const newResults = [];

    for (const url of images) {
      const res = await fetch("/api/generateHashtags", {
        method: "POST",
        body: JSON.stringify({
          imageUrl: url,
          options: {
            hashtagCount,
            tone,
            includeEmojis,
          },
        }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      newResults.push({ url, caption: data.caption, hashtags: data.hashtags });
    }

    setResults(newResults);
    setLoading(false);
  };

  return (
    <main className="p-8 max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📸 Instagram Post Generator</h1>
      </div>

      <ImageUploader onImagesChange={setImages} />
      {images.length > 0 && results.length === 0 && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          {images.map((url, i) => (
            <div key={i} className="relative group">
              <img
                src={url}
                alt={`upload-${i}`}
                className="w-full h-auto rounded border"
              />
              <button
                className="absolute top-1 right-1 bg-red-600 text-white rounded px-2 py-1 text-xs opacity-80 group-hover:opacity-100"
                onClick={() => {
                  setImages((prev) => prev.filter((_, idx) => idx !== i));
                }}
              >
                ✖ Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 🧩 Options UI */}
      <div className="mt-4 space-y-4 border p-4 rounded bg-gray-50">
        <div>
          <label className="block text-sm font-medium">
            # of Hashtags (Max: 20)
          </label>
          <input
            type="number"
            min={1}
            max={20} // ← limit to 20
            value={hashtagCount}
            onChange={(e) =>
              setHashtagCount(Math.min(20, Math.max(1, Number(e.target.value))))
            }
            className="w-full border px-2 py-1 rounded text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Tone</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full border px-2 py-1 rounded text-sm"
          >
            <option value="fun">Fun</option>
            <option value="professional">Professional</option>
            <option value="witty">Witty</option>
            <option value="motivational">Motivational</option>
            <option value="casual">Casual</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="emojis"
            checked={includeEmojis}
            onChange={(e) => setIncludeEmojis(e.target.checked)}
          />
          <label htmlFor="emojis" className="text-sm">
            Include emojis in caption
          </label>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate Hashtags & Captions"}
      </button>

      {results.length > 0 && (
        <div className="mt-8 space-y-6">
          {results.map((item, i) => (
            <div key={i} className="border p-4 rounded shadow-sm">
              <img
                src={item.url}
                alt="preview"
                className="w-full rounded mb-4"
              />
              <textarea
                className="w-full border p-2 rounded mb-2 text-sm"
                rows={4}
                defaultValue={`${item.caption}\n\n${item.hashtags}`}
              />
              <div className="flex gap-2 flex-wrap">
                <button
                  className="px-3 py-1 bg-gray-200 rounded text-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${item.caption}\n\n${item.hashtags}`
                    );
                    setCopiedIndex(i);
                    setTimeout(() => setCopiedIndex(null), 2000);
                  }}
                >
                  <span className={copiedIndex === i ? "text-green-600" : ""}>
                    {copiedIndex === i ? "✔ Copied!" : "📋 Copy Caption"}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
