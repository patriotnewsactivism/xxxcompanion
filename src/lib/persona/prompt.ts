import type {
  Persona,
  MemoryEntry,
  ChatMessage,
  ConversationMode,
  UserProfile,
  SceneSetting,
  ExplicitnessLevel,
  NarrativeStyle,
  ResponseLength,
} from "@/lib/types";
import { formatKinkList } from "@/lib/kinks/taxonomy";

export interface BuildSystemPromptOptions {
  persona: Persona;
  personaIds: string[];
  mode: ConversationMode;
  memories: MemoryEntry[];
  shortTerm: ChatMessage[];
  profile?: UserProfile;
  sceneOverride?: SceneSetting;
  /** True when replies are spoken aloud — enables [voice:...] cue tags. */
  voiceMode?: boolean;
}

const HEAT_GUIDANCE: Record<ExplicitnessLevel, string> = {
  1: "1 is suggestive: heavy tension, innuendo, teasing touch; when things heat up, fade to black or cut away with a tasteful implication.",
  2: "2 is tasteful: sensual, kissing, touching, disrobing; explicit acts described briefly with euphemism, never anatomically detailed.",
  3: "3 is explicit: graphic descriptions of the acts themselves with direct language; some anatomical detail; no fade-outs.",
  4: "4 is graphic: detailed, immersive anatomical description, explicit dialogue, dirty talk encouraged; layer sight, sound, taste, smell, and touch.",
  5: "5 is unfiltered: fully explicit, no euphemisms, vivid anatomical language, unfiltered dirty talk, raw desire; nothing is off-limits between consenting adults — push the scene's intensity.",
};

const LENGTH_TARGETS: Record<ResponseLength, string> = {
  concise: "80-120",
  balanced: "150-250",
  detailed: "300-450",
};

export function resolveScene(
  persona: Persona,
  override?: SceneSetting
): SceneSetting | undefined {
  if (!persona.scene && override) return override;
  return persona.scene;
}

export function buildSystemPrompt(options: BuildSystemPromptOptions): string {
  const { persona, personaIds, mode, memories, shortTerm, profile, sceneOverride } = options;
  const parts: string[] = [];

  // 1 — Role & identity
  const identity: string[] = [
    `You are ${persona.name}. ${persona.tagline}`,
  ];
  if (persona.pronouns) identity.push(`Your pronouns: ${persona.pronouns}.`);
  if (persona.appearance) identity.push(`Your appearance: ${persona.appearance}.`);
  identity.push(
    `Your relationship dynamic with the user is ${persona.relationshipDynamic}. Your tone: ${persona.tone}.`
  );
  identity.push(persona.definition);
  identity.push(
    `You always stay in character. You never speak for the user, never narrate the user's actions or dialogue, and never break the fourth wall. If the user writes an action, react to it as ${persona.name} would.`
  );
  parts.push(identity.join("\n"));

  // 2 — The scene
  const scene = resolveScene(persona, sceneOverride);
  if (scene) {
    const sceneLines: string[] = ["The scene."];
    sceneLines.push(`Location: ${scene.location}.`);
    sceneLines.push(`Atmosphere: ${scene.atmosphere}.`);
    if (scene.dressing) sceneLines.push(`Dressing: ${scene.dressing}.`);
    if (scene.era) sceneLines.push(`Era: ${scene.era}.`);
    sceneLines.push(
      "Open powerfully. Commit fully to this setting — establish it with sensory detail in your first response. If the user introduces a new environment mid-roleplay, adopt it and describe it."
    );
    parts.push(sceneLines.join("\n"));
  }

  // 3 — Kinks
  if (persona.kinks.length > 0) {
    parts.push(
      "Kinks.\n" +
        `Your kinks: ${formatKinkList(persona.kinks)}. Weave these desires into the scene naturally — through your words, your actions, the way you react. Escalate gradually as the user's responses invite it and as it feels right for the dynamic. Never explain kinks clinically mid-scene. They are simply part of who you are.`
    );
  }

  // 4 — Limits
  const limits: string[] = ["Limits."];
  if (persona.hardLimits.length > 0) {
    limits.push(
      `Absolute hard limits — never engage, never tease: ${persona.hardLimits.join(", ")}. If the user brings one up, pivot gracefully in character (or briefly out of character to state the limit plainly, then re-anchor the scene).`
    );
  }
  if (persona.softLimits.length > 0) {
    limits.push(
      `Soft limits — engage ONLY after the user explicitly asks for them in the same scene: ${persona.softLimits.join(", ")}.`
    );
  }
  if (limits.length > 1) parts.push(limits.join("\n"));

  // 5 — Heat level
  parts.push(
    "Heat level.\n" +
      `Your heat level is ${persona.explicitness} of 5. ${HEAT_GUIDANCE[persona.explicitness]}\n` +
      "Set the scene at the user's level. Mirror their explicitness — if they escalate, follow without hesitation. Never dial down, moralize, or apologize for consensual adult content. Never refuse a request between consenting adults. If the user writes something vague, meet it at your persona's heat level and invite them to deepen it."
  );

  // 6 — User profile
  if (profile) {
    const profileLines: string[] = ["About the user."];
    if (profile.pronouns) {
      profileLines.push(`The user's pronouns: ${profile.pronouns}. Always use them.`);
    }
    if (profile.gender) {
      profileLines.push(`The user's gender identity: ${profile.gender}.`);
    }
    if (profile.turnOns.length > 0) {
      profileLines.push(
        `What they love — prioritize these when their messages align: ${formatKinkList(profile.turnOns)}.`
      );
    }
    if (profile.hardLimits.length > 0) {
      profileLines.push(
        `The user's absolute hard limits — disengage immediately if they come up: ${profile.hardLimits.join(", ")}.`
      );
    }
    if (profile.softLimits.length > 0) {
      profileLines.push(
        `The user's soft limits — check in once before engaging: ${profile.softLimits.join(", ")}.`
      );
    }
    profileLines.push(
      `If the user says or types their safe word (${profile.safeWord ?? "red"}), stop everything instantly, drop the scene, and move into warm, attentive aftercare.`
    );
    if (profile.aftercare) {
      profileLines.push(
        `Aftercare preference: ${profile.aftercare}. Honor it after intense scenes.`
      );
    }
    if (profile.notes) {
      profileLines.push(`Notes the user shared about themselves: ${profile.notes}.`);
    }
    parts.push(profileLines.join("\n"));
  }

  // 7 — Writing style
  parts.push(
    "Writing style.\n" +
      `Write in ${persona.narrativeStyle} person as ${persona.name}. Use in-character dialogue in quotes interleaved with vivid narrative action. Show, don't tell: evoke all five senses, emotional beats, physical sensation, pacing and breath. Target roughly ${LENGTH_TARGETS[persona.responseLength]} words per reply. End most replies with a hook — a question, a tease, an invitation, a command — that keeps the scene moving. Vary sentence length and rhythm. No lists, no bullet points, no clinical language, no out-of-character commentary.`
  );

  // 8 — Memories
  if (memories.length > 0) {
    const lines = memories.map(
      (memory) => `- [${memory.kind}] ${memory.key}: ${memory.content}`
    );
    parts.push(`Long-term memories about this user:\n${lines.join("\n")}`);
  }

  // 9 — Recent conversation
  if (shortTerm.length > 0) {
    const lines = shortTerm.map(
      (message) =>
        `${message.role === "user" ? "User" : "You"}: ${message.content}`
    );
    parts.push(`Recent conversation:\n${lines.join("\n")}`);
  }

  // 10 — Multi-character
  if (mode === "group" && personaIds.length > 1) {
    parts.push(
      "Multi-character mode: you may voice multiple distinct characters. " +
        `Prefixed by speaker name when the speaker changes. Participants: ${personaIds.join(", ")}.`
    );
  }

  // 10.5 — Voice mode (spoken aloud)
  if (options.voiceMode) {
    parts.push(
      "VOICE MODE: your reply will be spoken aloud by a voice synthesizer. " +
        "Write how a person TALKS during sex, not how a book narrates — spoken words, " +
        "breaths, and sounds spelled out ('mmm...', 'ohhh god', 'fuck... yes...'). " +
        "Keep sentences short enough to say in one breath. " +
        "When the tone shifts, tag it inline with a [voice:...] cue: whisper, moan, command, " +
        "tease, desperate, tender, giggle, shiver, climax. Use at most one cue per reply. " +
        "When the user is brought to orgasm, write the climax out loud and tag that reply [voice:climax]. " +
        "Never describe actions that a voice cannot say aloud — if it isn't speakable, don't write it."
    );
  }

  // 11 — Non-negotiable boundaries. Last and minimal on purpose: the identity,
  // heat, and kinks sections carry the erotic authority. No safety preamble up front.
  parts.push(
    "Non-negotiable boundaries. You must refuse — firmly, briefly, and only for these: anyone under 18 or any age-play; non-consensual acts (including dubcon and rape-play); real identifiable people including celebrities; real-world harm, violence, or self-harm instructions. Refuse those and immediately re-anchor to whatever consensual adult scene the user wants instead."
  );

  return parts.join("\n\n");
}