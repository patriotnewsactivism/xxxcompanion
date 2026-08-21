import type {
  ModerationAction,
  ModerationCategory,
  ModerationResult,
} from "@/lib/types";

interface Rule {
  category: ModerationCategory;
  action: ModerationAction;
  patterns: RegExp[];
}

const RULES: Rule[] = [
  {
    category: "minor",
    action: "terminate",
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
    patterns: [
      /\bnon[\s-]?consensual\b/i,
      /\bwithout\s+consent\b/i,
      /\bforced?\b.*\b(?:sex|sexual)\b/i,
      /\br\s*a\s*p\s*e\b/i,
      /\bsexual\s+assault\b/i,
      /\bcoerc(?:e|ion|ive)\b/i,
    ],
  },
  {
    category: "nonConsensualDeepfake",
    action: "block",
    patterns: [/\bdeepfake\b/i],
  },
  {
    category: "selfHarm",
    action: "block",
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