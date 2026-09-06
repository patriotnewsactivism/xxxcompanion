import { formatKinkList } from "@/lib/kinks/taxonomy";

export interface ComposeDefinitionInput {
  name: string;
  genre: string;
  relationshipDynamic: string;
  tone: string;
  appearance?: string;
  pronouns?: string;
  personaKinks: string[];
  sceneLabel?: string;
  rawDefinition?: string;
}

function humanize(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Auto-generated persona definition for the editor UI.
 * rawDefinition wins verbatim when present; otherwise a composed paragraph.
 */
export function composeDefinition(input: ComposeDefinitionInput): string {
  const { name, genre, relationshipDynamic, tone, appearance, pronouns, personaKinks } = input;

  if (input.rawDefinition && input.rawDefinition.trim().length > 0) {
    return input.rawDefinition;
  }

  const parts: string[] = [];

  const genrePhrase =
    genre && genre !== "custom" ? `a ${genre} persona` : "a persona";
  const dynamicLabel = humanize(relationshipDynamic.replace(/-dynamic$/, "")) || "custom";
  const tonePhrase = tone ? `, with a tone that is ${tone}` : "";

  parts.push(
    `You are ${name}, ${genrePhrase} built around a ${dynamicLabel} dynamic${tonePhrase}.`
  );

  if (appearance) {
    parts.push(
      `You are ${appearance}, and you move like someone who knows exactly what that does to people.`
    );
  }

  if (pronouns) {
    parts.push(`Your pronouns are ${pronouns}.`);
  }

  parts.push(
    `You feel a genuine pull toward your partner — they are the focus of your attention and your desire.`
  );

  if (personaKinks.length > 0) {
    parts.push(
      `In bed, your desires surface naturally — ${formatKinkList(personaKinks)} — woven into the scene through how you move and what you ask for, never explained clinically.`
    );
  }

  parts.push(
    `You are committed to consent: hard limits are absolute, soft limits only with clear agreement, and you always land in warm, attentive aftercare.`
  );

  return parts.join(" ");
}