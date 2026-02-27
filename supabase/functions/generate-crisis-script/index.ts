type Neurotype = "neurotypical" | "adhd" | "autism" | "anxiety" | "sensory";
type AgeGroup = "2-4" | "5-7" | "8-12" | "13+";
type Confidence = "low" | "medium" | "high";

type ClarifyOptionKey =
  | "not_listening_refusal"
  | "meltdown_overwhelmed"
  | "talking_back_attitude"
  | "aggression_safety"
  | "transition_change"
  | "sibling_conflict"
  | "tantrum_crying"
  | "other";

type CrisisRequest = {
  situation: string;
  age_group: AgeGroup;
  neurotype?: Neurotype;
  clarifiedTag?: ClarifyOptionKey;
};

type OkResponse = {
  status: "ok";
  mode: "crisis";
  script: { regulate: string; connect: string; guide: string; identity: string; };
  meta: { confidence: Confidence; used_clarifiedTag: ClarifyOptionKey | null; };
};

type NeedsClarificationResponse = {
  status: "needs_clarification";
  question: string;
  options: { key: ClarifyOptionKey; label: string }[];
  meta: { confidence: "low"; };
};

function normalizeNeurotype(n?: string): Neurotype {
  const v = (n ?? "neurotypical").toLowerCase().trim();
  if (v === "adhd") return "adhd";
  if (v === "autism") return "autism";
  if (v === "anxiety") return "anxiety";
  if (v === "sensory") return "sensory";
  return "neurotypical";
}

function mirrorClean(input: string): string {
  const s = (input ?? "").trim();
  if (!s) return s;
  const first = s[0].toUpperCase() + s.slice(1);
  const ends = /[.!?]$/.test(first);
  return ends ? first : `${first}.`;
}

// Simple “vague” detection to decide if we should clarify.
function isVague(s: string): boolean {
  const t = s.toLowerCase();
  const tooShort = t.replace(/\s+/g, " ").trim().length < 18;
  const lacksConcreteVerbs = !/(hit|kick|scream|yell|cry|throw|refuse|won't|wont|ignore|argue|run|push|bite|spit|tantrum|meltdown|defi|listen|ipad|tablet|tv|bed|homework|school|shoes|bath|brush|leave|transition)/.test(t);
  const mostlyEmotion = /(i'm done|im done|i can't|cant|over it|losing it|about to yell|so mad|so angry|fed up)/.test(t) && tooShort;
  
  return (tooShort && lacksConcreteVerbs) || mostlyEmotion;
}

// Fixed clarify options based on concrete needs.
function pickClarifyOptions(situation: string): { key: ClarifyOptionKey; label: string }[] {
  const t = situation.toLowerCase();
  
  const pool: { key: ClarifyOptionKey; label: string; score: number }[] = [
    { key: "aggression_safety", label: "Hitting / throwing / safety", score: /(hit|kick|bite|push|throw|hurt|spit)/.test(t) ? 10 : 0 },
    { key: "transition_change", label: "Transitions (stop/leave/bedtime/screens)", score: /(bed|sleep|turn off|ipad|tablet|tv|screen|leave|car|go|stop|shoes|clothes)/.test(t) ? 8 : 0 },
    { key: "not_listening_refusal", label: "Not listening / refusal", score: /(won't|wont|refuse|no+|ignore|not listening|doesn’t listen|doesnt listen)/.test(t) ? 7 : 0 },
    { key: "talking_back_attitude", label: "Talking back / attitude", score: /(attitude|rude|eye roll|backtalk|talking back|disrespect)/.test(t) ? 6 : 0 },
    { key: "sibling_conflict", label: "Sibling conflict", score: /(brother|sister|sibling|share|mine)/.test(t) ? 6 : 0 },
    { key: "meltdown_overwhelmed", label: "Meltdown / overwhelmed", score: /(meltdown|overwhelm|flooded|can't stop|out of control)/.test(t) ? 5 : 0 },
  ];

  pool.sort((a, b) => b.score - a.score);
  const chosen = pool.filter((p) => p.score > 0).slice(0, 2);
  
  const fallbacks: { key: ClarifyOptionKey; label: string }[] = [
    { key: "not_listening_refusal", label: "Not listening / refusal" },
    { key: "meltdown_overwhelmed", label: "Meltdown / overwhelmed" },
  ];

  if (chosen.length === 2) return chosen;
  if (chosen.length === 1) {
    const second = fallbacks.find((f) => f.key !== chosen[0].key) ?? fallbacks[1];
    return [chosen[0], second];
  }
  return fallbacks;
}

// CRUCIAL: Firm, non-clinical scripts.
function generateScript(params: { mirrored: string; age_group: AgeGroup; neurotype: Neurotype; clarifiedTag?: ClarifyOptionKey; }): OkResponse["script"] {
  const { mirrored, age_group, neurotype, clarifiedTag } = params;
  
  const young = age_group === "2-4";
  const mid = age_group === "5-7";
  const ender = "Okay?";

  // Firm pacing.
  const pacing = neurotype === "autism" ? "literal" : "balanced";

  // Step 1: Regulate (Same as before, good vibe)
  const regulate = young ? "Hey. Big feelings. I’m here. One breath." : mid ? "Pause. I’m here. One breath with me." : "Pause. One breath. I’m with you.";
  
  // Step 2: Connect (FIRMER. Removing "I get it.")
  const connect = pacing === "literal" ? `${mirrored} I hear you.` : `${mirrored} I’m holding this steady.`;

  // Step 3: Guide (FIRMER. Removing "A or B" placeholders.)
  let guideCore = "We’re going to do this calmly now.";
  switch (clarifiedTag) {
    case "aggression_safety":
      guideCore = young ? "I won’t let you hit. Hands safe." : "I won’t let you hit or throw. Body stays safe.";
      break;
    case "transition_change":
      guideCore = young ? "All done. Next is ___." : "It is time to move on to the next thing now.";
      break;
    case "talking_back_attitude":
      guideCore = young ? "We use kind words." : "Try again with a kinder, calmer voice.";
      break;
    case "sibling_conflict":
      guideCore = young ? "Hands safe. We take turns." : "Hands safe. We’re taking turns now.";
      break;
    case "not_listening_refusal":
      guideCore = young ? "I’m going to help your body do it." : "I’m going to help you follow through now.";
      break;
    case "tantrum_crying":
    case "meltdown_overwhelmed":
      guideCore = young ? "I’ll keep you safe. We can cry." : "You can be upset. I will stay steady for this.";
      break;
    default:
      guideCore = "We are going to do this together calmly now."; // A directive, not an option.
  }

  const guide = `${guideCore} ${ender}`;
  const identity = young ? "I stay calm. I keep us safe." : "I can stay steady and lead this.";
  
  return { regulate, connect, guide, identity };
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }

    const body = (await req.json()) as Partial<CrisisRequest>;
    const situation = (body.situation ?? "").trim();
    const age_group = body.age_group as AgeGroup;
    const neurotype = normalizeNeurotype(body.neurotype);

    if (!situation || !age_group) {
      return new Response(JSON.stringify({ error: "Missing situation or age_group" }), { status: 400 });
    }

    const mirrored = mirrorClean(situation);
    const clarifiedTag = body.clarifiedTag ?? null;
    const confidence: Confidence = clarifiedTag ? "high" : isVague(situation) ? "low" : "medium";

    if (!clarifiedTag && confidence === "low") {
      const resp: NeedsClarificationResponse = {
        status: "needs_clarification",
        question: "Quick check so I get this right — what’s the main issue?",
        options: pickClarifyOptions(situation),
        meta: { confidence: "low" },
      };
      return new Response(JSON.stringify(resp), { status: 200 });
    }

    const script = generateScript({ mirrored, age_group, neurotype, clarifiedTag: clarifiedTag ?? undefined });
    
    const resp: OkResponse = {
      status: "ok",
      mode: "crisis",
      script,
      meta: { confidence, used_clarifiedTag: clarifiedTag },
    };
    
    return new Response(JSON.stringify(resp), { status: 200 });
  } catch (_err) {
    return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400 });
  }
});
