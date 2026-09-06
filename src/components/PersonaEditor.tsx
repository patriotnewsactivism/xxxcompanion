"use client";

import { useEffect, useState } from "react";
import type {
  ExplicitnessLevel,
  NarrativeStyle,
  Persona,
  ResponseLength,
} from "@/lib/types";
import {
  DEFAULT_PERSONA_FIELDS,
  EXPLICITNESS_LABELS,
  NARRATIVE_STYLE_LABELS,
  PERSONA_GENRES,
  RELATIONSHIP_DYNAMICS,
  RESPONSE_LENGTH_LABELS,
} from "@/lib/persona/options";
import { composeDefinition } from "@/lib/persona/definition";
import { kinkLabel, normalizeTags, SCENE_PRESETS } from "@/lib/kinks/taxonomy";
import KinkPicker from "@/components/KinkPicker";

interface PersonaEditorProps {
  open: boolean;
  onClose: () => void;
  tier: "free" | "premium";
  onCreated: (persona: Persona) => void;
}

interface TagInputProps {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  description: string;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

function humanize(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

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
    <div className="space-y-2">
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
    </div>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: SegmentedProps<T>) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-xl border px-3 py-2 text-left transition ${
            option.value === value
              ? "border-rose-500 bg-rose-500/10"
              : "border-neutral-800 bg-neutral-800/50 hover:border-neutral-700"
          }`}
        >
          <span
            className={`block text-sm font-medium ${
              option.value === value ? "text-rose-200" : "text-neutral-200"
            }`}
          >
            {option.label}
          </span>
          <span className="mt-0.5 block text-[10px] leading-snug text-neutral-500">
            {option.description}
          </span>
        </button>
      ))}
    </div>
  );
}

const NARRATIVE_SHORT: Record<NarrativeStyle, string> = {
  second: "Second",
  first: "First",
  third: "Third",
};

const LENGTH_SHORT: Record<ResponseLength, string> = {
  concise: "Concise",
  balanced: "Balanced",
  detailed: "Detailed",
};

const NARRATIVE_OPTIONS: SegmentedOption<NarrativeStyle>[] = (
  Object.keys(NARRATIVE_STYLE_LABELS) as NarrativeStyle[]
).map((value) => ({
  value,
  label: NARRATIVE_SHORT[value],
  description: NARRATIVE_STYLE_LABELS[value],
}));

const LENGTH_OPTIONS: SegmentedOption<ResponseLength>[] = (
  Object.keys(RESPONSE_LENGTH_LABELS) as ResponseLength[]
).map((value) => ({
  value,
  label: LENGTH_SHORT[value],
  description: RESPONSE_LENGTH_LABELS[value],
}));

const INPUT_CLASS =
  "mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-rose-500";

const LABEL_CLASS = "block text-sm font-medium text-neutral-300";

export default function PersonaEditor({
  open,
  onClose,
  tier,
  onCreated,
}: PersonaEditorProps) {
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [genre, setGenre] = useState(PERSONA_GENRES[0]);
  const [relationshipDynamic, setRelationshipDynamic] = useState(
    RELATIONSHIP_DYNAMICS[0],
  );
  const [tone, setTone] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [appearance, setAppearance] = useState("");
  const [definition, setDefinition] = useState("");
  const [manualOverride, setManualOverride] = useState(false);
  const [kinks, setKinks] = useState<string[]>([]);
  const [hardLimits, setHardLimits] = useState<string[]>(
    DEFAULT_PERSONA_FIELDS.hardLimits,
  );
  const [softLimits, setSoftLimits] = useState<string[]>([]);
  const [sceneActive, setSceneActive] = useState(false);
  const [sceneLocation, setSceneLocation] = useState("");
  const [sceneAtmosphere, setSceneAtmosphere] = useState("");
  const [sceneDressing, setSceneDressing] = useState("");
  const [sceneEra, setSceneEra] = useState("");
  const [explicitness, setExplicitness] = useState<ExplicitnessLevel>(
    DEFAULT_PERSONA_FIELDS.explicitness,
  );
  const [narrativeStyle, setNarrativeStyle] = useState<NarrativeStyle>(
    DEFAULT_PERSONA_FIELDS.narrativeStyle,
  );
  const [responseLength, setResponseLength] = useState<ResponseLength>(
    DEFAULT_PERSONA_FIELDS.responseLength,
  );
  const [greeting, setGreeting] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const autoDefinition = composeDefinition({
    name: name.trim(),
    genre,
    relationshipDynamic,
    tone: tone.trim(),
    appearance: appearance.trim() || undefined,
    pronouns: pronouns.trim() || undefined,
    personaKinks: kinks,
    sceneLabel: sceneActive ? sceneLocation.trim() : "",
  });

  const definitionValue =
    manualOverride || name.trim().length === 0 ? definition : autoDefinition;

  const sceneValue =
    sceneActive && (sceneLocation.trim() || sceneAtmosphere.trim())
      ? {
          location: sceneLocation.trim(),
          atmosphere: sceneAtmosphere.trim(),
          dressing: sceneDressing.trim() || undefined,
          era: sceneEra.trim() || undefined,
        }
      : undefined;

  function pickScenePreset(
    location: string,
    atmosphere: string,
    dressing: string | undefined,
    era: string | undefined,
  ) {
    setSceneActive(true);
    setSceneLocation(location);
    setSceneAtmosphere(atmosphere);
    setSceneDressing(dressing ?? "");
    setSceneEra(era ?? "");
  }

  function clearScene() {
    setSceneActive(false);
    setSceneLocation("");
    setSceneAtmosphere("");
    setSceneDressing("");
    setSceneEra("");
  }

  function resetForm() {
    setName("");
    setTagline("");
    setGenre(PERSONA_GENRES[0]);
    setRelationshipDynamic(RELATIONSHIP_DYNAMICS[0]);
    setTone("");
    setPronouns("");
    setAppearance("");
    setDefinition("");
    setManualOverride(false);
    setKinks([]);
    setHardLimits(DEFAULT_PERSONA_FIELDS.hardLimits);
    setSoftLimits([]);
    clearScene();
    setExplicitness(DEFAULT_PERSONA_FIELDS.explicitness);
    setNarrativeStyle(DEFAULT_PERSONA_FIELDS.narrativeStyle);
    setResponseLength(DEFAULT_PERSONA_FIELDS.responseLength);
    setGreeting("");
    setSubmitting(false);
    setFormError("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");
    if (!name.trim() || !definitionValue.trim()) {
      setFormError("Name and definition are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          tagline: tagline.trim() || undefined,
          genre: genre || undefined,
          relationshipDynamic: relationshipDynamic || undefined,
          tone: tone.trim() || undefined,
          definition: definitionValue.trim(),
          appearance: appearance.trim() || undefined,
          pronouns: pronouns.trim() || undefined,
          kinks,
          hardLimits,
          softLimits,
          scene: sceneValue,
          explicitness,
          narrativeStyle,
          responseLength,
          greeting: greeting.trim() || undefined,
          voiceConfig: undefined,
        }),
      });
      const data = (await res.json()) as { id: string; name: string; error?: string };
      if (res.status === 403 || res.status === 400) {
        setFormError(data.error ?? "Your companion could not be created.");
        return;
      }
      if (!res.ok) {
        setFormError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      const persona: Persona = {
        id: data.id,
        name: name.trim(),
        tagline: tagline.trim() || "A companion you designed yourself",
        genre: genre || "custom",
        relationshipDynamic: relationshipDynamic || "custom",
        tone: tone.trim() || "warm, attentive",
        definition: definitionValue.trim(),
        appearance: appearance.trim() || undefined,
        pronouns: pronouns.trim() || undefined,
        kinks,
        hardLimits,
        softLimits,
        scene: sceneValue,
        explicitness,
        narrativeStyle,
        responseLength,
        greeting: greeting.trim() || undefined,
        voiceConfig: undefined,
        avatarPath: null,
        isCustom: true,
        premiumOnly: false,
      };
      onCreated(persona);
      onClose();
      resetForm();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-neutral-800 bg-neutral-900 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-50">
              New companion
            </h2>
            <p className="text-sm text-neutral-500">
              Design a persona entirely yours — kinks, limits, scene, voice.
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

        {tier !== "premium" ? (
          <div className="p-6">
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-5 text-center">
              <h3 className="font-semibold text-rose-200">
                Custom personas are a premium feature.
              </h3>
              <p className="mt-2 text-sm text-neutral-400">
                Upgrade to Premium and design companions that are entirely
                yours — kinks, limits, scene, heat, everything.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="persona-name" className={LABEL_CLASS}>
                  Name *
                </label>
                <input
                  id="persona-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aurelia"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label htmlFor="persona-tagline" className={LABEL_CLASS}>
                  Tagline
                </label>
                <input
                  id="persona-tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="One sentence that makes them impossible to ignore"
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="persona-genre" className={LABEL_CLASS}>
                  Genre
                </label>
                <select
                  id="persona-genre"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className={INPUT_CLASS}
                >
                  {PERSONA_GENRES.map((option) => (
                    <option key={option} value={option}>
                      {humanize(option)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="persona-dynamic" className={LABEL_CLASS}>
                  Relationship dynamic
                </label>
                <select
                  id="persona-dynamic"
                  value={relationshipDynamic}
                  onChange={(e) => setRelationshipDynamic(e.target.value)}
                  className={INPUT_CLASS}
                >
                  {RELATIONSHIP_DYNAMICS.map((option) => (
                    <option key={option} value={option}>
                      {humanize(option)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="persona-tone" className={LABEL_CLASS}>
                  Tone
                </label>
                <input
                  id="persona-tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  placeholder="e.g. commanding, protective"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label htmlFor="persona-pronouns" className={LABEL_CLASS}>
                  Pronouns
                </label>
                <input
                  id="persona-pronouns"
                  value={pronouns}
                  onChange={(e) => setPronouns(e.target.value)}
                  placeholder="e.g. she/her"
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div>
              <label htmlFor="persona-appearance" className={LABEL_CLASS}>
                Appearance
              </label>
              <textarea
                id="persona-appearance"
                value={appearance}
                onChange={(e) => setAppearance(e.target.value)}
                placeholder="How they look, how they move, what they wear"
                rows={2}
                className={`${INPUT_CLASS} resize-none`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="persona-definition" className={LABEL_CLASS}>
                  Definition *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setManualOverride(false);
                    setDefinition("");
                  }}
                  disabled={name.trim().length === 0}
                  className="rounded-lg border border-neutral-700 px-2.5 py-1 text-xs font-medium text-neutral-300 transition hover:border-rose-500 hover:text-rose-300 disabled:opacity-40"
                >
                  Auto-generate definition
                </button>
              </div>
              <textarea
                id="persona-definition"
                value={definitionValue}
                onChange={(e) => {
                  setDefinition(e.target.value);
                  setManualOverride(true);
                }}
                placeholder="Their core self — write it yourself or auto-generate it from the fields above"
                rows={5}
                className={`${INPUT_CLASS} resize-none`}
              />
              <p className="mt-1 text-xs text-neutral-500">
                {manualOverride
                  ? "Auto-generation paused — you're writing this by hand."
                  : "Composed live from name, genre, dynamic, tone, kinks and scene."}
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
                Kinks
              </h3>
              <KinkPicker value={kinks} onChange={setKinks} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            </div>

            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
                Scene
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={clearScene}
                  className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                    !sceneActive
                      ? "border-rose-500 bg-rose-500/10 text-rose-200"
                      : "border-neutral-800 bg-neutral-800/50 text-neutral-400 hover:border-neutral-700"
                  }`}
                >
                  No scene
                </button>
                {SCENE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      pickScenePreset(
                        preset.scene.location,
                        preset.scene.atmosphere,
                        preset.scene.dressing,
                        preset.scene.era,
                      )
                    }
                    className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      sceneActive && sceneLocation === preset.scene.location
                        ? "border-rose-500 bg-rose-500/10 text-rose-200"
                        : "border-neutral-800 bg-neutral-800/50 text-neutral-300 hover:border-neutral-700"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              {sceneActive ? (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="scene-location" className={LABEL_CLASS}>
                      Location
                    </label>
                    <input
                      id="scene-location"
                      value={sceneLocation}
                      onChange={(e) => setSceneLocation(e.target.value)}
                      placeholder="e.g. a candlelit bedroom"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label htmlFor="scene-atmosphere" className={LABEL_CLASS}>
                      Atmosphere
                    </label>
                    <input
                      id="scene-atmosphere"
                      value={sceneAtmosphere}
                      onChange={(e) => setSceneAtmosphere(e.target.value)}
                      placeholder="e.g. low jazz, rain on the glass"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label htmlFor="scene-dressing" className={LABEL_CLASS}>
                      Dressing
                    </label>
                    <input
                      id="scene-dressing"
                      value={sceneDressing}
                      onChange={(e) => setSceneDressing(e.target.value)}
                      placeholder="What they're wearing"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label htmlFor="scene-era" className={LABEL_CLASS}>
                      Era
                    </label>
                    <input
                      id="scene-era"
                      value={sceneEra}
                      onChange={(e) => setSceneEra(e.target.value)}
                      placeholder="Modern, 1920s, medieval…"
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Heat level
                </h3>
                <span className="text-xs tabular-nums text-neutral-500">
                  {explicitness}/5
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={explicitness}
                onChange={(e) =>
                  setExplicitness(Number(e.target.value) as ExplicitnessLevel)
                }
                className="mt-2 w-full accent-rose-500"
              />
              <p className="mt-1 text-sm font-medium text-rose-300">
                {EXPLICITNESS_LABELS[explicitness]}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Narrative style
                </h3>
                <Segmented
                  options={NARRATIVE_OPTIONS}
                  value={narrativeStyle}
                  onChange={setNarrativeStyle}
                />
              </div>
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Response length
                </h3>
                <Segmented
                  options={LENGTH_OPTIONS}
                  value={responseLength}
                  onChange={setResponseLength}
                />
              </div>
            </div>

            <div>
              <label htmlFor="persona-greeting" className={LABEL_CLASS}>
                Greeting
              </label>
              <textarea
                id="persona-greeting"
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                placeholder="Their opening line when a chat starts"
                rows={2}
                className={`${INPUT_CLASS} resize-none`}
              />
            </div>

            {formError ? (
              <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
                {formError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-rose-600 px-4 py-2.5 font-medium text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create companion"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}