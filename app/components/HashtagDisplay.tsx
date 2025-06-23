"use client";

import { useState } from "react";

type Result = {
  url: string;
  caption: string;
  hashtags: string;
};

export default function HashtagDisplay({ results }: { results: Result[] }) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedResults, setEditedResults] = useState<Result[]>(results);

  const toggleEdit = (index: number) => {
    if (editingIndex === index) {
      // Save changes
      setEditingIndex(null);
    } else {
      // Start editing
      setEditedResults(results);
      setEditingIndex(index);
    }
  };

  const handleChange = (
    index: number,
    field: "caption" | "hashtags",
    value: string
  ) => {
    const updated = [...editedResults];
    updated[index][field] = value;
    setEditedResults(updated);
  };

  return (
    <div className="mt-6 space-y-6">
      {editedResults.map((result, index) => (
        <div key={index} className="border p-4 rounded shadow">
          <img
            src={result.url}
            alt={`Upload ${index + 1}`}
            className="w-full max-w-sm rounded mb-3"
          />

          <div className="mb-3">
            <p className="font-semibold mb-1">📄 Caption:</p>
            {editingIndex === index ? (
              <textarea
                value={result.caption}
                onChange={(e) => handleChange(index, "caption", e.target.value)}
                className="w-full p-2 border rounded"
                rows={3}
              />
            ) : (
              <p className="whitespace-pre-wrap">{result.caption}</p>
            )}
          </div>

          <div className="mb-3">
            <p className="font-semibold mb-1">🏷️ Hashtags:</p>
            {editingIndex === index ? (
              <textarea
                value={result.hashtags}
                onChange={(e) =>
                  handleChange(index, "hashtags", e.target.value)
                }
                className="w-full p-2 border rounded"
                rows={2}
              />
            ) : (
              <p className="whitespace-pre-wrap text-blue-600">
                {result.hashtags}
              </p>
            )}
          </div>

          <button
            onClick={() => toggleEdit(index)}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            {editingIndex === index ? "Save" : "Edit"}
          </button>
        </div>
      ))}
    </div>
  );
}
