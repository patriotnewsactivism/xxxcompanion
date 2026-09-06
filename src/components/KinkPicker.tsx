"use client";

import { useMemo, useState } from "react";
import { kinksByCategory, kinkLabel, normalizeTags } from "@/lib/kinks/taxonomy";

interface KinkPickerProps {
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  placeholder?: string;
}

function humanize(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function KinkPicker({
  value,
  onChange,
  max = 60,
  placeholder = "Search kinks",
}: KinkPickerProps) {
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return kinksByCategory()
      .map((group) => ({
        ...group,
        kinks: group.kinks.filter(
          (kink) =>
            q.length === 0 ||
            kink.label.toLowerCase().includes(q) ||
            kink.id.includes(q),
        ),
      }))
      .filter((group) => group.kinks.length > 0);
  }, [query]);

  const atCap = value.length >= max;

  function toggle(kinkId: string) {
    if (value.includes(kinkId)) {
      onChange(value.filter((id) => id !== kinkId));
    } else if (!atCap) {
      onChange([...value, kinkId]);
    }
  }

  function addCustom() {
    const tag = normalizeTags([draft])[0];
    if (!tag) return;
    if (!value.includes(tag) && !atCap) {
      onChange([...value, tag]);
    }
    setDraft("");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
          placeholder={placeholder}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-rose-500"
        />
        <span className="shrink-0 text-xs tabular-nums text-neutral-500">
          {value.length}/{max}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Type a freeform kink…"
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-rose-500"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!draft.trim() || atCap}
          className="shrink-0 rounded-lg border border-rose-500/50 px-3 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-40"
        >
          Add tag
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-neutral-500">No kinks match that search.</p>
      ) : (
        <div className="max-h-64 space-y-4 overflow-y-auto pr-1">
          {groups.map((group) => (
            <div key={group.category}>
              <h4 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-neutral-500">
                {humanize(group.category)}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {group.kinks.map((kink) => {
                  const selected = value.includes(kink.id);
                  return (
                    <button
                      key={kink.id}
                      type="button"
                      onClick={() => toggle(kink.id)}
                      disabled={!selected && atCap}
                      title={kink.description}
                      className={`rounded-full border px-2.5 py-1 text-xs transition disabled:opacity-40 ${
                        selected
                          ? "border-rose-500 bg-rose-500/15 text-rose-200"
                          : "border-neutral-800 bg-neutral-800/50 text-neutral-300 hover:border-neutral-700"
                      }`}
                    >
                      {kink.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-neutral-500">
        Freeform tags welcome — anything between consenting adults.
      </p>
    </div>
  );
}