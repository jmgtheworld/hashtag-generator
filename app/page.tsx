"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import Cookies from "js-cookie";
import "react-toastify/dist/ReactToastify.css";
import { useSession } from "next-auth/react";

import ImageUploader from "./components/ImageUploader";
import { MAX_USAGE, RESET_INTERVAL_HOURS } from "./constants/limits";
import {
  checkAndResetUsage,
  getRemainingTime,
  incrementUsage,
} from "./utils/usageLimiter";
import Image from "next/image";
import Navigation from "./components/Nav";

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
  const [customTone, setCustomTone] = useState("");
  const selectedTone = tone === "custom" ? customTone : tone;
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [groupImages, setGroupImages] = useState(false);
  const [language, setLanguage] = useState("English"); // Default to English
  const [editableResults, setEditableResults] = useState<string[]>([]);
  const [cancelMessage, setCancelMessage] = useState(false);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const [excludeHashtags, setExcludeHashtags] = useState(false);
  const [resetIn, setResetIn] = useState<{
    hours: number;
    minutes: number;
  } | null>(null);

  const { data: session, status } = useSession();

  useEffect(() => {
    const fetchUsage = async () => {
      const res = await fetch("/api/checkUsage");
      const data = await res.json();

      if (data?.count !== undefined) {
        setUsageCount(data.count);
        if (data.resetIn) {
          setResetIn(data.resetIn);
        }
      }
    };

    if (status === "authenticated") {
      fetchUsage();
    }
  }, [status]);

  useEffect(() => {
    if (results.length > 0 && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [results]);

  useEffect(() => {
    const count = Cookies.get("usageCount");
    const resetTime = Cookies.get("usageResetTime");

    if (count && resetTime) {
      console.log("hh");
      const now = Date.now();
      const then = parseInt(resetTime);
      const hoursPassed = (now - then) / (1000 * 60 * 60);

      if (hoursPassed >= RESET_INTERVAL_HOURS) {
        Cookies.remove("usageCount");
        Cookies.remove("usageResetTime");
        setUsageCount(0);
      } else {
        const parsedCount = parseInt(count, 10);
        setUsageCount(isNaN(parsedCount) ? 0 : parsedCount);
      }
    } else {
      // If not logged in or cookie missing
      setUsageCount(30); // 👈 explicitly set remaining usage to 0
    }

    setRemainingTime(getRemainingTime());
  }, []);

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
    if (status !== "authenticated") {
      toast.error("🚫 You must be logged in to generate captions.");
      return;
    }
    const { allowed } = checkAndResetUsage();

    if (!allowed) {
      const time = getRemainingTime();
      toast.error(
        time
          ? `⚠️ You've hit the ${MAX_USAGE} limit. Try again in ${time.hours}h ${time.minutes}m.`
          : "⚠️ You've reached the limit of free generations."
      );
      return;
    }

    if (images.length === 0) {
      toast.error("🚫 Please upload at least one image before generating.");
      return;
    }

    if (images.length === 0) {
      toast.error("Upload at least one image!", {
        theme: "dark", // or "colored", "light"
        style: {
          borderRadius: "10px",
          background: "#dc2626",
          color: "#fff",
        },
      });
      return;
    }
    if (!tone || tone.trim() === "") {
      toast.error("Please enter a tone.");
      return;
    }

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
            tone: selectedTone,
            includeEmojis,
            language,
            excludeHashtags,
          },
        }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (data && data.caption?.trim()) {
        newResults.push({
          urls: images,
          caption: data.caption.trim(),
          hashtags: data.hashtags?.trim() || "",
        });
        incrementUsage();
        setUsageCount((prev) => prev + 1);
      } else {
        toast.error("⚠️ Caption was empty. Generation failed.");
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
              tone: selectedTone,
              includeEmojis,
              language,
            },
          }),
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();

        if (data && data.caption?.trim()) {
          newResults.push({
            urls: [url],
            caption: data.caption.trim(),
            hashtags: data.hashtags?.trim() || "",
          });
          incrementUsage();
          setUsageCount((prev) => prev + 1);
        } else {
          toast.error("⚠️ Caption was empty. Generation failed.");
        }
      }
    }
    setResults(newResults);
    setEditableResults(
      newResults.map((item) => `${item.caption}\n\n${item.hashtags}`)
    );
    setLoading(false);
  };

  const [remainingTime, setRemainingTime] = useState<{
    hours: number;
    minutes: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const time = getRemainingTime();
      setRemainingTime(time);
    }
  }, []);

  return (
    <>
      <Navigation />
      <main className="bg-white min-h-screen p-8 max-w-xl mx-auto">
        <div className="p-8 max-w-xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">📸 Instagram Post Generator</h1>
          </div>
        </div>
        <div className="relative mb-4 p-4 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-sm shadow-sm flex items-start gap-3">
          {/* Info icon with tooltip */}
          <div className="relative group mt-0.5">
            <svg
              className="w-5 h-5 text-blue-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M12 20c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z"
              />
            </svg>

            {/* Tooltip */}
            {resetIn && (
              <div className="absolute left-6 top-0 z-20 bg-white border border-gray-300 text-gray-800 px-3 py-2 text-xs rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none w-max max-w-xs">
                ⏳ Usage resets in {resetIn.hours}h {resetIn.minutes}m
              </div>
            )}
          </div>

          {/* Usage message */}
          <div className="font-medium text-sm">
            You have{" "}
            <span className="font-bold">
              {Math.max(MAX_USAGE - usageCount, 0)}
            </span>{" "}
            free generation{MAX_USAGE - usageCount !== 1 ? "s" : ""} remaining
            today.
          </div>
        </div>

        <ImageUploader onImagesChange={setImages} />
        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            {images.map((url, i) => (
              <div key={i} className="relative group">
                <Image
                  src={url}
                  width={400}
                  height={300}
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
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="excludeHashtags"
              checked={excludeHashtags}
              onChange={(e) => setExcludeHashtags(e.target.checked)}
            />
            <label htmlFor="excludeHashtags" className="text-sm">
              Exclude hashtags from output
            </label>
          </div>

          {!excludeHashtags && (
            <div>
              <label className="block text-sm font-medium">
                # of Hashtags (Max: 20)
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={hashtagCount}
                onChange={(e) =>
                  setHashtagCount(
                    Math.min(20, Math.max(1, Number(e.target.value)))
                  )
                }
                className="w-full border px-2 py-1 rounded text-sm"
              />
            </div>
          )}

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
              <option value="custom">Other (Custom)</option>
            </select>

            {tone === "custom" && (
              <input
                type="text"
                value={customTone}
                onChange={(e) => setCustomTone(e.target.value)}
                placeholder="Enter your own tone..."
                className="mt-2 w-full border px-2 py-1 rounded text-sm"
              />
            )}
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
        <ToastContainer position="top-center" autoClose={2000} />

        <div ref={resultsRef}>
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
                    <Image
                      key={idx}
                      src={imgUrl}
                      width={400}
                      height={300}
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
        </div>
      </main>
    </>
  );
}
