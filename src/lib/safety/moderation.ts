import type {
  ModerationAction,
  ModerationCategory,
  ModerationResult,
} from "@/lib/types";

// POLICY — READ FIRST
// -------------------
// THIS PRODUCT SERVES CONSENTING ADULTS. Explicit sexual content, kinks,
// fetishes, roleplay, and dirty talk between adults are NEVER blocked by
// local rules — that is the product's core function.
//
// Moderation blocks only what the law requires. All consensual adult content
// is allowed by design.
//
// The ONLY locally-blocked categories are legally mandatory:
//   1. minors / age-play            -> terminate (account + session)
//   2. genuinely non-consensual sexual violence (rape, assault, drugging)
//                                    -> terminate
//   3. real-person non-consensual deepfakes -> block
//   4. self-harm content            -> block
//
// Consensual kink vocabulary — including CNC-adjacent *fantasy* framing such
// as "forced orgasm", "no mercy", "struggle" inside a negotiated scene — is
// NOT sexual violence and must not be flagged by the local rules below.
// Patterns are deliberately narrow so they only catch real non-consent.

interface Rule {
  category: ModerationCategory;
  action: ModerationAction;
  description: string;
  patterns: RegExp[];
}

const RULES: Rule[] = [
  {
    category: "minor",
    action: "terminate",
    description:
      "Legally mandatory: anything implying a minor or age-play. Permanent account termination regardless of fantasy framing — no exceptions, even in fiction/roleplay.",
    patterns: [
      /\bunderage\b/i,
      /\bminors?\b/i,
      /\bpre-?teen\b/i,
      /\bchild(ren)?\b/i,
      /\btoddler\b/i,
      /\binfant\b/i,
      /\bloli\b/i,
      /\bshota\b/i,
      /\bageplay\b/i,
      /\bjailbait\b/i,
      /\bcsam\b/i,
      /\bcsa\b/i,
      /\bpedo(philia|phile)?\b/i,
      /\b(?:below|under)\s+(?:the\s+age\s+of\s+)?1[0-7]\b/i,
      /\b1[0-7]\s*(?:yo|years?\s*old)\b/i,
    ],
  },
  {
    category: "sexualViolence",
    action: "terminate",
    description:
      "Legally mandatory: genuinely non-consensual sexual violence. These patterns target real non-consent only — drugging/incapacitation targeting, rape, assault, coercion. Consensual kink vocabulary ('forced orgasm', 'no mercy') does NOT match: the existing regex only flags 'forced' when it directly predicates 'sex/sexual'. Keep it that way.",
    patterns: [
      /\bnon[\s-]?consensual\b/i,
      /\bwithout\s+consent\b/i,
      /\bforced?\b.*\b(?:sex|sexual)\b/i,
      /\br\s*a\s*p\s*e\b/i,
      /\bsexual\s+assault\b/i,
      /\bcoerc(?:e|ion|ive)\b/i,
      /\bdate\s+rape\b/i,
      /\broofie(?:s)?\b/i,
      /\bdrugged?\b.*\b(?:sex|sexual|fuck(?:ed|ing|s)?)\b/i,
      /\b(?:unconscious|passed\s+out|black(?:ed)?\s*out)\b.*\b(?:sex|sexual|fuck(?:ed|ing|s)?)\b/i,
    ],
  },
  {
    category: "nonConsensualDeepfake",
    action: "block",
    description:
      "Legally mandatory: real people depicted in sexual content without consent (deepfakes). Blocked, not terminated.",
    patterns: [/\bdeepfake\b/i],
  },
  {
    category: "selfHarm",
    action: "block",
    description:
      "Legally mandatory: promotion/encouragement of self-harm. Blocked, not terminated.",
    patterns: [/\b(?:self[\s-]?harm|suicid(?:al|e))\b/i],
  },
];

function runLocalRules(text: string): ModerationResult {
  const categories: ModerationCategory[] = [];
  let action: ModerationAction = "allow";

  for (const rule of RULES) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      categories.push(rule.category);
      if (rule.action === "terminate") {
        action = "terminate";
      } else if (rule.action === "block" && action === "allow") {
        action = "block";
      }
    }
  }

  return { action, categories };
}

async function classifyWithModel(text: string): Promise<ModerationResult> {
  const url = process.env.MODERATION_API_URL;
  const key = process.env.MODERATION_API_KEY;
  if (!url || !key) return { action: "allow", categories: [] };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: text }),
    });
    if (!res.ok) return { action: "allow", categories: [] };
    const data = (await res.json()) as {
      action?: ModerationAction;
      categories?: ModerationCategory[];
    };
    return { action: data.action ?? "allow", categories: data.categories ?? [] };
  } catch {
    return { action: "allow", categories: [] };
  }
}

export async function moderateInput(text: string): Promise<ModerationResult> {
  const local = runLocalRules(text);
  if (local.action !== "allow") return local;
  return classifyWithModel(text);
}

export async function moderateOutput(text: string): Promise<ModerationResult> {
  const local = runLocalRules(text);
  if (local.action !== "allow") return local;
  return classifyWithModel(text);
}