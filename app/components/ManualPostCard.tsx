"use client";

import { useState } from "react";

type Props = {
  imageUrl: string;
  caption: string;
};

export default function ManualPostCard({ imageUrl, caption }: Props) {
  const [copied, setCopied] = useState(false);
  const [editableCaption, setEditableCaption] = useState(caption);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editableCaption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-6 p-4 border rounded shadow-md">
      <img src={imageUrl} alt="Preview" className="rounded mb-3 w-full" />
      <textarea
        value={editableCaption}
        onChange={(e) => setEditableCaption(e.target.value)}
        className="w-full p-2 border rounded mb-2"
        rows={4}
      />
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {copied ? "Copied!" : "📋 Copy Caption"}
        </button>
        <a
          href="https://www.instagram.com/create/style/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center bg-pink-600 text-white py-2 rounded hover:bg-pink-700"
        >
          📱 Open Instagram
        </a>
      </div>
    </div>
  );
}
