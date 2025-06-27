"use client";

import { useState } from "react";
import ImageUploader from "./components/ImageUploader";

export default function Home() {
  const [images, setImages] = useState<string[]>([]);
  const [results, setResults] = useState<
    { urls: string[]; caption: string; hashtags: string }[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  // 🆕 Customization states
  const [hashtagCount, setHashtagCount] = useState(10);
  const [tone, setTone] = useState("fun");
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [groupImages, setGroupImages] = useState(false);
  const [language, setLanguage] = useState("English"); // Default to English
  const [editableResults, setEditableResults] = useState<string[]>([]);
  const [cancelMessage, setCancelMessage] = useState(false);

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setLoading(false);
      setCancelMessage(true);

      // Automatically hide message after 2.5 seconds
      setTimeout(() => setCancelMessage(false), 2500);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    const newResults: { urls: string[]; caption: string; hashtags: string }[] =
      [];

    if (groupImages) {
      const controller = new AbortController();
      setAbortController(controller); // Save it so we can cancel later
      // 🧷 Grouped: Send all images as one request
      const res = await fetch("/api/generateHashtags", {
        method: "POST",
        signal: controller.signal,
        body: JSON.stringify({
          imageUrls: images,
          options: {
            hashtagCount,
            tone,
            includeEmojis,
            language,
          },
        }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (data.caption && data.hashtags) {
        newResults.push({
          urls: images, // all grouped
          caption: data.caption,
          hashtags: data.hashtags,
        });
      }
    } else {
      // 📦 Individually generate for each image
      for (const url of images) {
        const controller = new AbortController();
        setAbortController(controller); // Save it so we can cancel later
        const res = await fetch("/api/generateHashtags", {
          method: "POST",
          body: JSON.stringify({
            imageUrl: url,
            signal: controller.signal,
            options: {
              hashtagCount,
              tone,
              includeEmojis,
              language,
            },
          }),
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();

        newResults.push({
          urls: [url],
          caption: data.caption,
          hashtags: data.hashtags,
        });
      }
    }
    console.log("newResults", newResults);
    setResults(newResults);
    setEditableResults(
      newResults.map((item) => `${item.caption}\n\n${item.hashtags}`)
    );

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
          <label className="block text-sm font-medium">Output Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full border px-2 py-1 rounded text-sm"
          >
            <option value="English">English</option>
            <option value="Korean">Korean</option>
            <option value="Spanish">Spanish</option>
            <option value="Japanese">Japanese</option>
            <option value="French">French</option>
          </select>
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

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="groupImages"
          checked={groupImages}
          onChange={(e) => setGroupImages(e.target.checked)}
        />
        <label htmlFor="groupImages" className="text-sm">
          Group all images and generate 1 caption + hashtag set
        </label>
      </div>
      {cancelMessage && (
        <div className="mt-2 text-red-600 font-medium text-sm">
          ❌ Generation canceled
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {!loading ? (
          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Generate Hashtags & Captions
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-gray-400 text-white rounded cursor-not-allowed"
              disabled
            >
              Generating...
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Cancel
            </button>
          </div>
        )}

        <a
          href="https://www.instagram.com/create/style/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
        >
          📷 Open Instagram
        </a>
      </div>

      {loading ? (
        <div className="mt-10 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        results.map((item, i) => (
          <div key={i} className="border p-4 rounded shadow-sm mt-5">
            {/* 👇 show all grouped images */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {item.urls?.map((imgUrl, idx) => (
                <img
                  key={idx}
                  src={imgUrl}
                  alt={`preview-${idx}`}
                  className="w-full rounded"
                />
              ))}
            </div>

            <textarea
              className="w-full border p-2 rounded mb-2 text-sm"
              rows={4}
              value={editableResults[i] || ""}
              onChange={(e) => {
                const updated = [...editableResults];
                updated[i] = e.target.value;
                setEditableResults(updated);
              }}
            />

            <div className="flex gap-2 flex-wrap">
              <button
                className="px-3 py-1 bg-gray-200 rounded text-sm"
                onClick={() => {
                  navigator.clipboard.writeText(editableResults[i]);
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
        ))
      )}
    </main>
  );
}
