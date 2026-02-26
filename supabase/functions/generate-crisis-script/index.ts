declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

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
  script: {
    regulate: string;
    connect: string;
    guide: string;
    identity: string;
  };
  deliveryTips: string[];
  meta: {
    confidence: Confidence;
    age_group: AgeGroup;
    neurotype: Neurotype;
    used_clarifiedTag: ClarifyOptionKey | null;
  };
};

type NeedsClarificationResponse = {
  status: "needs_clarification";
  question: string;
  options: { key: ClarifyOptionKey; label: string }[];
  meta: {
    confidence: "low";
    age_group: AgeGroup;
    neurotype: Neurotype;
  };
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

function isVague(s: string): boolean {
  const t = s.toLowerCase();
  const tooShort = t.replace(/\s+/g, " ").trim().length < 18;
  const lacksConcreteVerbs = !/(hit|kick|scream|yell|cry|throw|refuse|won't|wont|ignore|argue|run|push|bite|spit|tantrum|meltdown|defi|listen|ipad|tablet|tv|bed|homework|school|shoes|bath|brush|leave|transition)/.test(
    t,
  );
  const mostlyEmotion =
    /(i'm done|im done|i can't|cant|over it|losing it|about to yell|so mad|so angry|fed up)/.test(
      t,
    ) && tooShort;

  return (tooShort && lacksConcreteVerbs) || mostlyEmotion;
}

function pickClarifyOptions(situation: string): {
  key: ClarifyOptionKey;
  label: string;
}[] {
  const t = situation.toLowerCase();

  const pool: { key: ClarifyOptionKey; label: string; score: number }[] = [
    {
      key: "aggression_safety",
      label: "Hitting / throwing / safety",
      score: /(hit|kick|bite|push|throw|hurt|spit)/.test(t) ? 10 : 0,
    },
    {
      key: "transition_change",
      label: "Transitions (stop/leave/bedtime/screens)",
      score: /(bed|sleep|turn off|ipad|tablet|tv|screen|leave|car|go|stop)/.test(t)
        ? 8
        : 0,
    },
    {
      key: "not_listening_refusal",
      label: "Not listening / refusal",
      score: /(won't|wont|refuse|no+|ignore|not listening|doesn’t listen|doesnt listen)/
        .test(t)
        ? 7
        : 0,
    },
    {
      key: "talking_back_attitude",
      label: "Talking back / attitude",
      score: /(attitude|rude|eye roll|backtalk|talking back|disrespect)/.test(t)
        ? 6
        : 0,
    },
    {
      key: "sibling_conflict",
      label: "Sibling conflict",
      score: /(brother|sister|sibling|share|mine)/.test(t) ? 6 : 0,
    },
    {
      key: "tantrum_crying",
      label: "Crying / tantrum / overwhelm",
      score: /(tantrum|meltdown|cry|sobb|panic|overwhelm|freak)/.test(t) ? 6 : 0,
    },
    {
      key: "meltdown_overwhelmed",
      label: "Meltdown / overwhelmed",
      score: /(meltdown|overwhelm|flooded|can't stop|out of control)/.test(t)
        ? 5
        : 0,
    },
  ];

  pool.sort((a, b) => b.score - a.score);
  const chosen = pool.filter((p) => p.score > 0).slice(0, 2);
  if (chosen.length === 2) {
    return chosen.map(({ key, label }) => ({ key, label }));
  }

  const fallbacks: { key: ClarifyOptionKey; label: string }[] = [
    { key: "not_listening_refusal", label: "Not listening / refusal" },
    { key: "meltdown_overwhelmed", label: "Meltdown / overwhelmed" },
  ];

  if (chosen.length === 1) {
    const first = { key: chosen[0].key, label: chosen[0].label };
    const second = fallbacks.find((f) => f.key !== first.key) ?? fallbacks[1];
    return [first, second];
  }

  return fallbacks;
}

function generateScript(params: {
  mirrored: string;
  age_group: AgeGroup;
  neurotype: Neurotype;
  clarifiedTag?: ClarifyOptionKey;
}): OkResponse["script"] {
  const { mirrored, age_group, neurotype, clarifiedTag } = params;

  const young = age_group === "2-4";
  const mid = age_group === "5-7";
  const big = age_group === "8-12" || age_group === "13+";
  const ender = age_group === "13+" ? "Okay?" : age_group === "8-12" ? "Deal?" : "Okay?";

  const pacing =
    neurotype === "anxiety"
      ? "slow"
      : neurotype === "adhd"
        ? "short"
        : neurotype === "autism"
          ? "literal"
          : "balanced";

  const regulate = young
    ? "Hey. Big feelings. I’m here. One breath."
    : mid
      ? "Pause. I’m here. One breath with me."
      : "Pause. One breath. I’m with you.";

  const connect =
    pacing === "literal"
      ? `${mirrored} I hear you.`
      : pacing === "slow"
        ? `${mirrored} That’s hard. I’m here.`
        : pacing === "short"
          ? `${mirrored} I hear you.`
          : `${mirrored} I get it.`;

  let guideCore = "We’re going to do this calmly now.";

  switch (clarifiedTag) {
    case "aggression_safety":
      guideCore = young
        ? "I won’t let you hit. Hands safe."
        : "I won’t let you hit or throw. Body stays safe.";
      break;
    case "transition_change":
      guideCore = young
        ? "All done. Next is ___."
        : "It’s time to switch. First ___, then ___.";
      break;
    case "talking_back_attitude":
      guideCore = big
        ? "Try that again with a respectful voice."
        : "Try again with a kinder voice.";
      break;
    case "sibling_conflict":
      guideCore = young
        ? "Hands safe. We take turns."
        : "Hands safe. We’re taking turns now.";
      break;
    case "not_listening_refusal":
      guideCore = young
        ? "I’m going to help your body do it."
        : "I’m going to help you follow through.";
      break;
    case "tantrum_crying":
    case "meltdown_overwhelmed":
      guideCore = young
        ? "I’ll keep you safe. We can cry."
        : "You can be upset. I’ll keep this steady.";
      break;
    default:
      guideCore = mid ? "You can choose: A or B." : "Here’s the next step: A, then B.";
  }

  const guide = `${guideCore} ${ender}`;
  const identity = young
    ? "I stay calm. I keep us safe."
    : "I can stay steady and lead this.";

  return { regulate, connect, guide, identity };
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Partial<CrisisRequest>;
    const situation = (body.situation ?? "").trim();
    const age_group = body.age_group as AgeGroup;
    const neurotype = normalizeNeurotype(body.neurotype);

    if (!situation || !age_group) {
      return new Response(
        JSON.stringify({ error: "Missing situation or age_group" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const mirrored = mirrorClean(situation);
    const clarifiedTag = body.clarifiedTag ?? null;
    const confidence: Confidence = clarifiedTag
      ? "high"
      : isVague(situation)
        ? "low"
        : "medium";

    if (!clarifiedTag && confidence === "low") {
      const options = pickClarifyOptions(situation);
      const resp: NeedsClarificationResponse = {
        status: "needs_clarification",
        question: "Quick check so I get this right — what’s the main issue?",
        options,
        meta: { confidence: "low", age_group, neurotype },
      };

      return new Response(JSON.stringify(resp), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    const script = generateScript({
      mirrored,
      age_group,
      neurotype,
      clarifiedTag: clarifiedTag ?? undefined,
    });

    const resp: OkResponse = {
      status: "ok",
      mode: "crisis",
      script,
      deliveryTips: [
        "Lower your voice instead of raising it.",
        "Relax your jaw and slow your pace.",
      ],
      meta: { confidence, age_group, neurotype, used_clarifiedTag: clarifiedTag },
    };

    return new Response(JSON.stringify(resp), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (_err) {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
