"use client";

export type LibraryFilter = "all" | "samples" | "generated";

export default function LibraryFilters({
  value,
  onChange,
}: {
  value: LibraryFilter;
  onChange: (v: LibraryFilter) => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border p-1">
      {[
        { key: "samples", label: "Show Samples Only" },
        { key: "generated", label: "Show Generated Only" },
        { key: "all", label: "Show All Items" },
      ].map((opt) => (
        <button
          key={opt.key}
          className={`rounded px-3 py-1 text-sm ${
            value === (opt.key as LibraryFilter)
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
          onClick={() => onChange(opt.key as LibraryFilter)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}


