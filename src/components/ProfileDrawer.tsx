"use client";

import { useEffect, useRef, useState } from "react";
import type { UserProfile } from "@/lib/types";
import { kinkLabel, normalizeTags } from "@/lib/kinks/taxonomy";
import KinkPicker from "@/components/KinkPicker";

interface ProfileDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface TagInputProps {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}

const INPUT_CLASS =
  "mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-rose-500";

const LABEL_CLASS = "block text-sm font-medium text-neutral-300";

function TagInput({ values, onChange, placeholder }: TagInputProps) {
  const [draft, setDraft] = useState("");

  function add() {
    const tag = normalizeTags([draft])[0];
    if (tag && !values.includes(tag)) {
      onChange([...values, tag]);
    }
    setDraft("");
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((item) => (
        <span
          key={item}
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300"
        >
          {kinkLabel(item)}
          <button
            type="button"
            onClick={() => onChange(values.filter((v) => v !== item))}
            aria-label={`Remove ${kinkLabel(item)}`}
            className="text-neutral-500 transition hover:text-rose-400"
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        placeholder={placeholder}
        className="min-w-32 flex-1 rounded-full border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-100 outline-none focus:border-rose-500"
      />
    </div>
  );
}

export default function ProfileDrawer({ open, onClose }: ProfileDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [savedFading, setSavedFading] = useState(false);
  const timers = useRef<number[]>([]);

  const [displayName, setDisplayName] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [gender, setGender] = useState("");
  const [turnOns, setTurnOns] = useState<string[]>([]);
  const [hardLimits, setHardLimits] = useState<string[]>([]);
  const [softLimits, setSoftLimits] = useState<string[]>([]);
  const [safeWord, setSafeWord] = useState("");
  const [aftercare, setAftercare] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const ref = timers.current;
    return () => {
      ref.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) {
          if (!cancelled) setError("Failed to load your profile.");
          return;
        }
        const data = (await res.json()) as UserProfile;
        if (cancelled) return;
        setDisplayName(data.displayName ?? "");
        setPronouns(data.pronouns ?? "");
        setGender(data.gender ?? "");
        setTurnOns(Array.isArray(data.turnOns) ? data.turnOns : []);
        setHardLimits(Array.isArray(data.hardLimits) ? data.hardLimits : []);
        setSoftLimits(Array.isArray(data.softLimits) ? data.softLimits : []);
        setSafeWord(data.safeWord ?? "");
        setAftercare(data.aftercare ?? "");
        setNotes(data.notes ?? "");
      } catch {
        if (!cancelled) setError("Failed to load your profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  function showSaved() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
    setSaved(true);
    setSavedFading(false);
    timers.current.push(
      window.setTimeout(() => setSavedFading(true), 1500),
      window.setTimeout(() => setSaved(false), 2200),
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim() || undefined,
          pronouns: pronouns.trim() || undefined,
          gender: gender.trim() || undefined,
          turnOns,
          hardLimits,
          softLimits,
          safeWord: safeWord.trim() || undefined,
          aftercare: aftercare.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "Failed to save your profile.");
        return;
      }
      showSaved();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-96 max-w-full flex-col border-l border-neutral-800 bg-neutral-900 shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between border-b border-neutral-800 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-50">
              Your profile
            </h2>
            <p className="text-sm text-neutral-500">
              The companions read this — it personalizes every scene.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg px-2 py-1 text-neutral-500 transition hover:bg-neutral-800 hover:text-neutral-200"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
            Loading…
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex-1 space-y-5 overflow-y-auto p-5"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="profile-display-name" className={LABEL_CLASS}>
                  Display name
                </label>
                <input
                  id="profile-display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="What should they call you?"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label htmlFor="profile-pronouns" className={LABEL_CLASS}>
                  Pronouns
                </label>
                <input
                  id="profile-pronouns"
                  value={pronouns}
                  onChange={(e) => setPronouns(e.target.value)}
                  placeholder="he/him, she/her, they/them"
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div>
              <label htmlFor="profile-gender" className={LABEL_CLASS}>
                Gender
              </label>
              <input
                id="profile-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                placeholder="Your gender identity"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
                Turn-ons
              </h3>
              <KinkPicker value={turnOns} onChange={setTurnOns} />
            </div>

            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
                Hard limits
              </h3>
              <TagInput
                values={hardLimits}
                onChange={setHardLimits}
                placeholder="Never, under any circumstances…"
              />
            </div>

            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
                Soft limits
              </h3>
              <TagInput
                values={softLimits}
                onChange={setSoftLimits}
                placeholder="Only with a clear check-in…"
              />
            </div>

            <div>
              <label htmlFor="profile-safe-word" className={LABEL_CLASS}>
                Safe word
              </label>
              <input
                id="profile-safe-word"
                value={safeWord}
                onChange={(e) => setSafeWord(e.target.value)}
                placeholder="A word that stops everything, instantly"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="profile-aftercare" className={LABEL_CLASS}>
                Aftercare
              </label>
              <textarea
                id="profile-aftercare"
                value={aftercare}
                onChange={(e) => setAftercare(e.target.value)}
                placeholder="What helps you come down after an intense scene?"
                rows={3}
                className={`${INPUT_CLASS} resize-none`}
              />
            </div>

            <div>
              <label htmlFor="profile-notes" className={LABEL_CLASS}>
                Notes
              </label>
              <textarea
                id="profile-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything else they should know about you"
                rows={3}
                className={`${INPUT_CLASS} resize-none`}
              />
            </div>

            {error ? (
              <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
                {error}
              </p>
            ) : null}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save profile"}
              </button>
              {saved ? (
                <span
                  className={`text-sm font-medium text-emerald-400 transition-opacity duration-500 ${
                    savedFading ? "opacity-0" : "opacity-100"
                  }`}
                >
                  Saved
                </span>
              ) : null}
            </div>
          </form>
        )}
      </aside>
    </div>
  );
}