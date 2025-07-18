"use client";

import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { MAX_IMAGE_UPLOADS } from "../constants/limits";

interface Props {
  onImagesChange: (urls: string[]) => void;
  images: string[];
}

export default function ImageUploader({ onImagesChange, images }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const newFiles = Array.from(files);

      if (uploadedUrls.length + newFiles.length > MAX_IMAGE_UPLOADS) {
        toast.error(
          `🚫 You can only upload up to ${MAX_IMAGE_UPLOADS} images.`
        );
        return;
      }

      setUploading(true);
      const urls: string[] = [];

      for (const file of newFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "upload_preset",
          process.env.NEXT_PUBLIC_CLOUDINARY_PRESET!
        );

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await res.json();
        if (data.secure_url) urls.push(data.secure_url);
      }

      const updated = [...uploadedUrls, ...urls];
      setUploadedUrls(updated);
      onImagesChange(updated);
      setUploading(false);
    },
    [onImagesChange, uploadedUrls]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  return (
    <div className="mb-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`border-2 border-dashed rounded p-6 text-center transition-colors duration-200 ${
          uploading ? "border-gray-400 bg-gray-50" : "border-blue-400 bg-white"
        }`}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleInputChange}
          disabled={uploading || uploadedUrls.length >= MAX_IMAGE_UPLOADS}
          className="hidden"
          id="fileInput"
        />
        <label htmlFor="fileInput" className="cursor-pointer block">
          {uploading ? (
            <div className="flex justify-center items-center gap-2 text-blue-600">
              <svg
                className="animate-spin h-5 w-5 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
              Uploading ...
            </div>
          ) : (
            <div>
              <p className="text-blue-600 font-semibold">
                Click to upload or drag & drop
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {images.length}/{MAX_IMAGE_UPLOADS} images uploaded
              </p>
              {uploadedUrls.length >= MAX_IMAGE_UPLOADS && (
                <p className="text-red-500 text-sm mt-1">
                  Maximum of {MAX_IMAGE_UPLOADS} images reached.
                </p>
              )}
            </div>
          )}
        </label>
      </div>
    </div>
  );
}
