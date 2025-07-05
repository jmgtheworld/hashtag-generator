"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import Navigation from "../components/Nav";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";

import { checkAndResetUsage, getRemainingTime } from "../utils/usageLimiter";
import {
  MAX_USAGE,
  RESET_INTERVAL_HOURS,
  FREE_USAGE,
} from "../constants/limits";
import { useSession } from "next-auth/react";

export default function ReviewResponder() {
  const [reviewText, setReviewText] = useState("");
  const [tone, setTone] = useState("professional");
  const [sentiment, setSentiment] = useState("auto");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const [usageCount, setUsageCount] = useState(0);
  const [, setRemainingTime] = useState<{
    hours: number;
    minutes: number;
  } | null>(null);
  const [resetIn, setResetIn] = useState<{
    hours: number;
    minutes: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const { status } = useSession();

  useEffect(() => {
    const count = Cookies.get("usageCount");
    const resetTime = Cookies.get("usageResetTime");

    if (count && resetTime) {
      const now = Date.now();
      const then = parseInt(resetTime, 10);
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
      // If cookie missing or user not logged in, default to 0 usage
      setUsageCount(FREE_USAGE);
    }

    setRemainingTime(getRemainingTime());
  }, []);

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

  const handleGenerateResponse = async () => {
    // if (status !== "authenticated") {
    //   toast.error("🚫 You must be logged in to generate captions.");
    //   return;
    // }
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

    if (!reviewText.trim()) {
      toast.error("🚫 You must enter a valid review.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/generateReviewResponse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review: reviewText, sentiment, tone }),
    });

    const data = await res.json();

    if (data?.response?.trim()) {
      setResponse(data.response.trim());
      setUsageCount((prev) => prev + 1);
    } else {
      toast.error("🚫 No response generated");
    }

    setLoading(false);
  };

  return (
    <div>
      <Navigation />
      <ToastContainer position="top-center" autoClose={2000} />
      <main className="bg-white min-h-screen p-8 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">⭐ Google Review Responder</h1>
        <p className="text-sm text-gray-600 mb-4">
          Paste a customer review and get a professional reply.
        </p>

        {/* 📊 Usage Limit Box */}
        <div className="relative mb-4 p-4 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-sm shadow-sm flex items-start gap-3">
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

          <div className="font-medium text-sm">
            You have <span className="font-bold">{MAX_USAGE - usageCount}</span>{" "}
            free generation{MAX_USAGE - usageCount !== 1 ? "s" : ""} remaining
            today.
          </div>
        </div>

        {/* Review Input & Options */}
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Paste customer review here..."
          className="w-full border p-2 rounded mb-4 text-sm"
          rows={5}
        />

        <div className="flex gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="border px-2 py-1 rounded text-sm"
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="apologetic">Apologetic</option>
              <option value="casual">Casual</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sentiment</label>
            <select
              value={sentiment}
              onChange={(e) => setSentiment(e.target.value)}
              className="border px-2 py-1 rounded text-sm"
            >
              <option value="auto">Auto Detect</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerateResponse}
          disabled={loading}
          className={`px-4 py-2 rounded text-white ${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Generating..." : "Generate Response"}
        </button>

        {response && (
          <div className="mt-6 border p-4 rounded bg-gray-50">
            <label className="block text-sm font-medium mb-1">
              Suggested Response
            </label>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              className="w-full border p-2 rounded text-sm"
              rows={5}
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(response);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="mt-2 px-3 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300"
            >
              {copied ? "✅ Copied!" : "📋 Copy"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
