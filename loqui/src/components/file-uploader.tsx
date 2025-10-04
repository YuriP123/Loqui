"use client";

export default function FileUploader({
  accept = "audio/*",
  onFile,
}: {
  accept?: string;
  onFile: (file: File) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 hover:bg-muted">
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <span>Upload File</span>
    </label>
  );
}


