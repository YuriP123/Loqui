"use client";

import { Upload } from "lucide-react";
import { useState } from "react";

export default function FileUploader({
  accept = "audio/*",
  onFile,
  disabled = false,
}: {
  accept?: string;
  onFile: (file: File) => void;
  disabled?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 ${
        disabled
          ? "opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-700"
          : isDragging
          ? "border-primary bg-primary/5"
          : "border-gray-300 dark:border-gray-700 hover:border-primary"
      }`}
    >
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
      <p className="text-sm font-medium transition-colors duration-500">
        Drop file here or click to browse
      </p>
      <p className="text-xs text-muted-foreground mt-1 transition-colors duration-500">
        Supports MP3, WAV, M4A
      </p>
    </div>
  );
}


