"use client";

import { useState } from "react";
import { Textarea, Input, Button } from "@heroui/react";

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
        <Textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          minRows={4}
          placeholder="Enter the text to synthesize"
          isRequired
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Model Name</label>
        <Input
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          placeholder="MyVoiceModel"
          isRequired
        />
      </div>
      <Button type="submit" isDisabled={disabled} color="primary">
        Submit Generation
      </Button>
    </form>
  );
}


