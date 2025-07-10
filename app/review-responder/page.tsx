"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import Navigation from "../components/Nav";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";

import { checkAndResetUsage, getRemainingTime } from "../utils/usageLimiter";
import { MAX_USAGE, FREE_USAGE, MAX_TRIAL_USAGE } from "../constants/limits";
import { useSession } from "next-auth/react";

export default function ReviewResponder() {
  const [reviewText, setReviewText] = useState("");
  const [tone, setTone] = useState("professional");
  const [sentiment, setSentiment] = useState("auto");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchUsageDataLoaded, setFetchUsageDataLoaded] = useState(false);

  const [usageCount, setUsageCount] = useState(0);

  const [resetIn, setResetIn] = useState<{
    hours: number;
    minutes: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isTrialUser, setIsTrialUser] = useState(false);

  const { status } = useSession();

  useEffect(() => {
    const checkLocalUsage = async () => {
      const cookieCount = Cookies.get("usageCount");
      const cookieReset = Cookies.get("usageResetTime");
      const cookieTrial = Cookies.get("isTrialUser");

      const now = Date.now();
      const resetTime = parseInt(cookieReset || "0", 10);

      // If valid cookies exist and reset time hasn't passed
      if (
        cookieCount &&
        resetTime &&
        now < resetTime &&
        (status !== "authenticated" || status === "authenticated")
      ) {
        setUsageCount(parseInt(cookieCount, 10));
        setIsTrialUser(cookieTrial === "true");
        const timeLeft = resetTime - now;
        setResetIn({
          hours: Math.floor(timeLeft / (1000 * 60 * 60)),
          minutes: Math.ceil((timeLeft % (1000 * 60 * 60)) / (1000 * 60)),
        });
        setFetchUsageDataLoaded(true);
        return;
      }

      // 🧠 Fallback to API check
      if (status === "authenticated") {
        try {
          const res = await fetch("/api/checkUsage");
          const data = await res.json();

          if (data?.count !== undefined) {
            setUsageCount(data.count);
            setIsTrialUser(data.trial || false);
            setResetIn(data.resetIn || null);

            // 📝 Save to cookies
            Cookies.set("usageCount", String(data.count));
            Cookies.set(
              "usageResetTime",
              String(
                Date.now() +
                  data.resetIn.hours * 3600 * 1000 +
                  data.resetIn.minutes * 60 * 1000
              )
            );
            Cookies.set("isTrialUser", String(data.trial || false));
          }
        } catch (e) {
          console.error("Failed to fetch usage:", e);
        } finally {
          setFetchUsageDataLoaded(true);
        }
      } else {
        // Unauthenticated fallback
        setUsageCount(FREE_USAGE);
        setFetchUsageDataLoaded(true);
      }
    };

    checkLocalUsage();
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
          {/* Usage message */}
          {!fetchUsageDataLoaded ? (
            <div className="flex items-center text-sm text-gray-600 gap-2">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span>Loading usage data...</span>
            </div>
          ) : (
            <div className="font-medium text-sm">
              You have{" "}
              <span className="font-bold">
                {Math.max(
                  (isTrialUser ? MAX_TRIAL_USAGE : MAX_USAGE) - usageCount,
                  0
                )}
              </span>{" "}
              free generation
              {(isTrialUser ? MAX_TRIAL_USAGE : MAX_USAGE) - usageCount !== 1
                ? "s"
                : ""}{" "}
              remaining today.
            </div>
          )}
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
