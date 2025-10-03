"use client";

import { useState } from "react";

export default function ModelGenerationForm({
  onSubmit,
  disabled,
}: {
  onSubmit: (values: { script: string; modelName: string }) => void;
  disabled?: boolean;
}) {
  const [script, setScript] = useState("");
  const [modelName, setModelName] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ script, modelName });
      }}
    >
      <div>
        <label className="block text-sm font-medium">Script Text</label>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          className="mt-1 w-full rounded-md border bg-background p-2"
          rows={4}
          placeholder="Enter the text to synthesize"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Model Name</label>
        <input
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          className="mt-1 w-full rounded-md border bg-background p-2"
          placeholder="MyVoiceModel"
          required
        />
      </div>
      <button
        type="submit"
        disabled={disabled}
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        Submit Generation
      </button>
    </form>
  );
}


