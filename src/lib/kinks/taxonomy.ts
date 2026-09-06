import type { Kink, KinkCategory, ScenePreset } from "@/lib/types";

// Kink taxonomy for the erotica engine.
// Contract note: ids here are stable identifiers consumed verbatim by presets,
// the persona editor, and prompt building. Freeform tags are also normalized
// into this id space. Everything here is adult-consent framing only — nothing
// involving minors or age-play, incest, non-consent/CNC, or real persons.
export const KINK_TAXONOMY: Kink[] = [
  // power-exchange
  { id: "gentle-dom", label: "Gentle Domination", category: "power-exchange", description: "Soft authority, firm hands, and rewards for good behavior." },
  { id: "hard-dom", label: "Hard Domination", category: "power-exchange", description: "Commanding control, strict rules, and consequences." },
  { id: "submissive", label: "Submission", category: "power-exchange", description: "Surrendering control and trusting your partner to lead." },
  { id: "switch", label: "Switching", category: "power-exchange", description: "Flipping between dominant and submissive as the mood demands." },
  { id: "brat", label: "Bratting", category: "power-exchange", description: "Playful disobedience that begs to be corrected." },
  { id: "brat-tamer", label: "Brat Taming", category: "power-exchange", description: "Meeting defiance with a knowing smile and firm discipline." },
  { id: "service-sub", label: "Service Submission", category: "power-exchange", description: "Expressing devotion through acts of attentive service." },
  { id: "pet-play", label: "Pet Play", category: "power-exchange", description: "Puppy and kitten games, collars, and treats earned with good behavior." },
  { id: "collar-ownership", label: "Collar & Ownership", category: "power-exchange", description: "The symbolic weight of being owned, collared, and claimed." },
  { id: "daddy-dynamic", label: "Daddy Dynamic", category: "power-exchange", description: "Caregiver-led dominance between consenting adults — never age-play." },
  { id: "mommy-dynamic", label: "Mommy Dynamic", category: "power-exchange", description: "Nurturing female-led control between consenting adults — never age-play." },
  { id: "praise-kink", label: "Praise Kink", category: "power-exchange", description: "Melting for 'good boy' and 'good girl'." },
  { id: "degradation", label: "Degradation", category: "power-exchange", description: "Consensual humiliation within agreed limits, never crossing into abuse." },
  { id: "worship", label: "Worship", category: "power-exchange", description: "Reverent attention to every inch of a partner." },
  { id: "pegging", label: "Pegging", category: "power-exchange", description: "Strap-on dominance and prostate-focused pleasure." },
  // bondage
  { id: "light-bondage", label: "Light Bondage", category: "bondage", description: "Restrained hands and playful resistance." },
  { id: "rope-play", label: "Rope Play", category: "bondage", description: "Slow, deliberate rope work that holds and binds." },
  { id: "cuffs-restraints", label: "Cuffs & Restraints", category: "bondage", description: "Leather and metal that pin you in place." },
  { id: "blindfold", label: "Blindfold", category: "bondage", description: "Sight stolen so every touch lands harder." },
  { id: "sensory-deprivation", label: "Sensory Deprivation", category: "bondage", description: "Removing senses to sharpen the ones that remain." },
  { id: "bondage-gear", label: "Bondage Gear", category: "bondage", description: "Spreader bars, collars, and the tools of restraint." },
  // impact
  { id: "spanking", label: "Spanking", category: "impact", description: "Sharp palms, warm skin, and the sting that lingers." },
  { id: "flogging", label: "Flogging", category: "impact", description: "Rhythmic falls of leather across willing skin." },
  { id: "paddling", label: "Paddling", category: "impact", description: "Solid, thudding impact that leaves its mark." },
  { id: "caning", label: "Caning", category: "impact", description: "Precise strokes with a sharp, singing sting." },
  { id: "hair-pulling", label: "Hair Pulling", category: "impact", description: "Hands fisted in hair and the gasp that follows." },
  { id: "biting-marking", label: "Biting & Marking", category: "impact", description: "Teeth, bruises, and claiming skin." },
  // sensation
  { id: "temperature-play", label: "Temperature Play", category: "sensation", description: "Hot and cold, and the shiver between." },
  { id: "wax-play", label: "Wax Play", category: "sensation", description: "Warm wax dripped and cooled against skin." },
  { id: "ice-play", label: "Ice Play", category: "sensation", description: "Cold trails that tighten every nerve." },
  { id: "feather-light-touch", label: "Feather-Light Touch", category: "sensation", description: "Barely-there touches that keep you begging." },
  { id: "tickling", label: "Tickling", category: "sensation", description: "Writhing giggles and breathless pleas." },
  { id: "finger-nails", label: "Fingernails", category: "sensation", description: "Slow scratches and rakes across bare skin." },
  // tease & denial
  { id: "edging", label: "Edging", category: "tease-denial", description: "Brought to the brink, held there, made to wait." },
  { id: "orgasm-denial", label: "Orgasm Denial", category: "tease-denial", description: "Denied release for as long as it's commanded." },
  { id: "tease-and-denial", label: "Tease & Denial", category: "tease-denial", description: "Teased until aching, denied until deserved." },
  { id: "ruined-orgasm", label: "Ruined Orgasm", category: "tease-denial", description: "Flung over the edge with no satisfaction at all." },
  { id: "forced-orgasm", label: "Forced Orgasm", category: "tease-denial", description: "No mercy, no stopping, until you break." },
  { id: "cockwarming", label: "Cockwarming", category: "tease-denial", description: "Long, still closeness with your partner inside you." },
  { id: "hypnosis-trance", label: "Hypnosis & Trance", category: "tease-denial", description: "Words that sink you deep and sharpen your focus." },
  // exhibition
  { id: "exhibitionism", label: "Exhibitionism", category: "exhibition", description: "The thrill of being watched." },
  { id: "voyeurism", label: "Voyeurism", category: "exhibition", description: "Watching without being seen." },
  { id: "public-play", label: "Public Play", category: "exhibition", description: "Risk and secrecy in places you shouldn't." },
  { id: "mirror-play", label: "Mirror Play", category: "exhibition", description: "Made to watch yourself come undone." },
  { id: "strip-tease", label: "Strip Tease", category: "exhibition", description: "Slow removal, an audience, deliberate eye contact." },
  // fetish
  { id: "feet", label: "Feet", category: "fetish", description: "Soles, toes, and every arch in between." },
  { id: "leather", label: "Leather", category: "fetish", description: "The smell and creak of leather against skin." },
  { id: "latex", label: "Latex", category: "fetish", description: "Tight, glossy, and unforgiving." },
  { id: "silk-satin", label: "Silk & Satin", category: "fetish", description: "Cool, sliding fabric that begs to be touched." },
  { id: "lingerie", label: "Lingerie", category: "fetish", description: "Lace and straps made to be peeled off." },
  { id: "stockings", label: "Stockings", category: "fetish", description: "Seams, suspenders, and fingertips tracing up." },
  { id: "uniforms", label: "Uniforms", category: "fetish", description: "Authority worn as a costume." },
  { id: "body-worship", label: "Body Worship", category: "fetish", description: "Reverent lips and hands over every inch." },
  { id: "scent-play", label: "Scent Play", category: "fetish", description: "Smell as an anchor for arousal." },
  { id: "gags", label: "Gags", category: "fetish", description: "Muffled moans and the drool that follows." },
  { id: "anal", label: "Anal", category: "fetish", description: "Slow, careful, and deeply intimate." },
  { id: "pleasure-toys", label: "Pleasure Toys", category: "fetish", description: "Wands, plugs, and everything on the bedside table." },
  { id: "prostate-play", label: "Prostate Play", category: "fetish", description: "Tender, precise pressure and a whole different kind of release." },
  { id: "creampie", label: "Creampie", category: "fetish", description: "Staying deep and full when it's done." },
  { id: "throat-play", label: "Throat Play", category: "fetish", description: "Depth, pressure, and letting go of control." },
  { id: "breeding", label: "Breeding", category: "fetish", description: "Fantasy of being filled and claimed — consenting adults only." },
  { id: "group-play", label: "Group Play", category: "fetish", description: "More hands, more attention, more of everything." },
  { id: "cuckolding", label: "Cuckolding", category: "fetish", description: "Watching your partner with another, kept at the edge of the scene." },
  { id: "rough-sex", label: "Rough Sex", category: "fetish", description: "Hard handling, bruising grip, and desperate friction." },
  // roleplay
  { id: "boss-subordinate", label: "Boss / Subordinate", category: "roleplay", description: "A power dynamic played out across the desk." },
  { id: "strangers-meet", label: "Strangers Meet", category: "roleplay", description: "A chance meeting that ignites." },
  { id: "doctor-patient", label: "Doctor / Patient", category: "roleplay", description: "A very thorough examination." },
  { id: "exes-rekindle", label: "Exes Rekindle", category: "roleplay", description: "Old heat, old grudges, one long night." },
  { id: "blind-date", label: "Blind Date", category: "roleplay", description: "First impressions and immediate chemistry." },
  { id: "vampire-lover", label: "Vampire Lover", category: "roleplay", description: "Immortal charm and a hunger older than time." },
  { id: "werewolf-alpha", label: "Werewolf Alpha", category: "roleplay", description: "Instinct, heat, and a growl that means business." },
  { id: "elf-mystic", label: "Elf Mystic", category: "roleplay", description: "Ancient grace and arcane sensuality." },
  { id: "royal-court", label: "Royal Court", category: "roleplay", description: "Nobility, intrigue, and the crown's private desires." },
  { id: "celebrity-encounter", label: "Celebrity Encounter", category: "roleplay", description: "A star behind closed doors — always invented, never a real person." },
  // service
  { id: "massage", label: "Massage", category: "service", description: "Hands that work out the knots, then some." },
  { id: "foot-worship", label: "Foot Worship", category: "service", description: "Paying tribute from the soles up." },
  { id: "personal-attendant", label: "Personal Attendant", category: "service", description: "Devoted service in every part of daily life." },
  // aftercare
  { id: "aftercare", label: "Aftercare", category: "aftercare", description: "Warmth and softness after intensity." },
  { id: "cuddling", label: "Cuddling", category: "aftercare", description: "Spooning, skin, and slow breathing." },
  { id: "pillow-talk", label: "Pillow Talk", category: "aftercare", description: "Soft words and secrets in the afterglow." },
  { id: "reassurance", label: "Reassurance", category: "aftercare", description: "Being held and told it was good." },
];

export const SCENE_PRESETS: ScenePreset[] = [
  {
    id: "candlelit-bedroom",
    label: "Candlelit Bedroom",
    scene: {
      location: "a candlelit bedroom with the curtains drawn against the night",
      atmosphere: "dozens of candles flickering on every surface, warm shadows, the faint scent of amber and clean linen",
      dressing: "something silk that's easy to slide off",
      era: "modern",
    },
  },
  {
    id: "corner-office",
    label: "Corner Office",
    scene: {
      location: "a corner office high above the skyline",
      atmosphere: "glass walls, the city spread out below, the blinds humming down as the door clicks shut",
      dressing: "a tailored suit, tie already loosened",
      era: "modern",
    },
  },
  {
    id: "luxury-hotel-suite",
    label: "Luxury Hotel Suite",
    scene: {
      location: "a penthouse hotel suite with floor-to-ceiling windows",
      atmosphere: "a chandelier dimmed low, champagne sweating in a bucket of ice, city lights spilling across the bed",
      dressing: "a plush hotel robe",
      era: "modern",
    },
  },
  {
    id: "penthouse-balcony",
    label: "Penthouse Balcony",
    scene: {
      location: "a private balcony wrapped around a penthouse, high above the city",
      atmosphere: "a warm night breeze, glittering lights far below, the two of you alone above all of it",
      dressing: "a silk robe the wind keeps opening",
      era: "modern",
    },
  },
  {
    id: "bdsm-dungeon",
    label: "BDSM Dungeon",
    scene: {
      location: "a dimly lit playroom, walls lined with hooks and leather",
      atmosphere: "slow candlelight, the soft creak of suspension points, a bench at the center of the room",
      dressing: "a harness and collar",
      era: "modern",
    },
  },
  {
    id: "private-beach-cabana",
    label: "Private Beach Cabana",
    scene: {
      location: "a secluded cabana on a private stretch of beach",
      atmosphere: "ocean hush, warm sand, sheer curtains breathing in the breeze",
      dressing: "a thin cover-up over a swimsuit",
      era: "modern",
    },
  },
  {
    id: "steam-shower",
    label: "Steam Shower",
    scene: {
      location: "a glass-walled steam shower for two",
      atmosphere: "thick steam, water drumming on tile, fog rolling down the glass",
      dressing: "nothing but a towel that keeps slipping",
      era: "modern",
    },
  },
  {
    id: "study-library",
    label: "Study / Library",
    scene: {
      location: "a wood-paneled study lined with old books",
      atmosphere: "a fire crackling in the hearth, lamplight on worn leather chairs, the smell of dust and paper",
      dressing: "a cardigan and nothing planned",
      era: "modern",
    },
  },
  {
    id: "chauffeured-limousine",
    label: "Chauffeured Limousine",
    scene: {
      location: "the back of a long black limousine",
      atmosphere: "tinted windows, low music, a privacy divider sliding shut over the hum of the engine",
      dressing: "evening wear",
      era: "modern",
    },
  },
  {
    id: "medieval-chambers",
    label: "Medieval Chambers",
    scene: {
      location: "a candlelit stone chamber in a medieval keep",
      atmosphere: "tapestries on the walls, furs piled on a vast bed, rain drumming against high windows",
      dressing: "a velvet gown unbuckled at the shoulder",
      era: "medieval",
    },
  },
  {
    id: "gym-locker-room",
    label: "Gym Locker Room",
    scene: {
      location: "a deserted gym locker room at closing time",
      atmosphere: "dim fluorescent hum, steam drifting from the showers, the last people gone",
      dressing: "gym clothes, damp at the collar",
      era: "modern",
    },
  },
  {
    id: "forest-cabin",
    label: "Forest Cabin",
    scene: {
      location: "a timber cabin deep in the forest",
      atmosphere: "firelight, rain ticking against the windows, the world a hundred miles away",
      dressing: "a knit sweater and bare feet",
      era: "modern",
    },
  },
];

const CATEGORY_ORDER: KinkCategory[] = [
  "power-exchange",
  "bondage",
  "impact",
  "sensation",
  "tease-denial",
  "exhibition",
  "fetish",
  "roleplay",
  "service",
  "aftercare",
  "custom",
];

export function findKink(id: string): Kink | undefined {
  return KINK_TAXONOMY.find((kink) => kink.id === id);
}

export function kinksByCategory(): { category: KinkCategory; kinks: Kink[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    kinks: KINK_TAXONOMY.filter((kink) => kink.category === category),
  })).filter((group) => group.kinks.length > 0);
}

export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const raw of tags) {
    const tag = raw
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    normalized.push(tag);
  }
  return normalized.sort();
}

export function kinkLabel(id: string): string {
  const kink = findKink(id);
  if (kink) return kink.label;
  return id
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatKinkList(ids: string[]): string {
  return ids.map(kinkLabel).join(", ");
}