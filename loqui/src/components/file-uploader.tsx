"use client";

import { Upload, Check, X } from "lucide-react";
import { useState } from "react";

export default function FileUploader({
  accept = "audio/*",
  onFile,
}: {
  accept?: string;
  onFile: (file: File, sampleName: string) => Promise<void>;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelected = async (file: File) => {
    if (!file) return;
    
    // Get sample name from user
    const sampleName = prompt("Enter a name for this voice sample:", file.name.replace(/\.[^/.]+$/, ""));
    if (!sampleName) return;

    setUploading(true);
    setUploadSuccess(false);
    setUploadError("");

    try {
      await onFile(file, sampleName);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error: any) {
      setUploadError(error.message || "Upload failed");
      setTimeout(() => setUploadError(""), 5000);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelected(file);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 ${
          uploading
            ? "border-primary bg-primary/5 opacity-60"
            : isDragging
            ? "border-primary bg-primary/5"
            : "border-gray-300 dark:border-gray-700 hover:border-primary"
        }`}
      >
        <input
          type="file"
          accept={accept}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileSelected(f);
          }}
          disabled={uploading}
        />
        {uploading ? (
          <>
            <div className="animate-spin rounded-full h-8 w-8 mx-auto mb-2 border-b-2 border-primary"></div>
            <p className="text-sm font-medium transition-colors duration-500">Uploading...</p>
          </>
        ) : uploadSuccess ? (
          <>
            <Check className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-sm font-medium text-green-600">Upload successful!</p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium transition-colors duration-500">
              Drop file here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1 transition-colors duration-500">
              Supports MP3, WAV, M4A
            </p>
          </>
        )}
      </div>
      {uploadError && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-900/20 p-2">
          <p className="text-xs text-red-800 dark:text-red-200 flex items-center gap-1">
            <X className="h-3 w-3" />
            {uploadError}
          </p>
        </div>
      )}
    </div>
  );
}


