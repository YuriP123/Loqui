"use client";

import { useMemo, useState } from "react";
import LibraryFilters, { LibraryFilter } from "@/components/library-filters";
import LibraryList from "@/components/library-list";

export default function LibraryPage() {
  const [filter, setFilter] = useState<LibraryFilter>("all");


  function handleDelete(id: string) {
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Library</h1>
      <LibraryFilters value={filter} onChange={setFilter} />
      <LibraryList items={[]} onDelete={handleDelete} />
    </div>
  );
}


