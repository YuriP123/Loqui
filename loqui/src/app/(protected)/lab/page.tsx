"use client";

import Recorder from "@/components/recorder";
import FileUploader from "@/components/file-uploader";
import SampleList from "@/components/sample-list";
import ModelGenerationForm from "@/components/model-generation-form";

export default function LabPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Lab</h1>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-lg border p-4">
          <h2 className="text-lg font-medium">Audio Sample Creation</h2>
          <div className="flex flex-wrap gap-3">
            <Recorder onRecorded={() => {}} />
            <FileUploader onFile={() => {}} />
          </div>
          <SampleList items={[]} />
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <h2 className="text-lg font-medium">Model Generation</h2>
          <ModelGenerationForm onSubmit={() => {}} disabled />
        </div>
      </section>
    </div>
  );
}
