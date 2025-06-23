"use client";

import { useState } from "react";

type Props = {
  imageUrl: string;
  caption: string;
  accessToken: string;
  igUserId: string;
};

export default function PostNowCard({
  imageUrl,
  caption,
  accessToken,
  igUserId,
}: Props) {
  const [editingCaption, setEditingCaption] = useState(caption);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handlePost = async () => {
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/meta/postNow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageUrl,
        caption: editingCaption,
        accessToken,
        igUserId,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage("✅ Successfully posted to Instagram!");
    } else {
      setMessage(`❌ Failed: ${data.error || "Unknown error"}`);
    }

    setLoading(false);
  };

  return (
    <div className="mt-4 p-4 border rounded shadow-sm">
      <img src={imageUrl} alt="Preview" className="mb-2 rounded w-full" />
      <textarea
        value={editingCaption}
        onChange={(e) => setEditingCaption(e.target.value)}
        className="w-full border rounded p-2 mb-2"
        rows={3}
      />
      <button
        onClick={handlePost}
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
      >
        {loading ? "Posting..." : "Post to Instagram"}
      </button>
      {message && <p className="mt-2 text-sm text-center">{message}</p>}
    </div>
  );
}
