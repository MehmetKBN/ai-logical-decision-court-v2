import type { HatId } from '../../types/court';
import type {
  AIProviderAdapter,
  ConnectionTestResult,
  StreamCompletionParams,
} from '../../types/provider';

function detectHatFromSystemPrompt(systemPrompt: string): HatId {
  const firstLine = systemPrompt.split('\n')[0]?.toUpperCase() ?? '';
  if (firstLine.includes('YOU ARE THE WHITE HAT')) return 'white';
  if (firstLine.includes('YOU ARE THE RED HAT')) return 'red';
  if (firstLine.includes('YOU ARE THE YELLOW HAT')) return 'yellow';
  if (firstLine.includes('YOU ARE THE BLACK HAT')) return 'black';
  if (firstLine.includes('YOU ARE THE GREEN HAT')) return 'green';
  return 'blue';
}

function extractCaseSubject(userContent: string): string {
  const match = userContent.match(/CASE DILEMMA:\s*\n([^\n]+)/i);
  const raw = match?.[1]?.trim() ?? 'the proposed strategic initiative';
  return raw.length > 110 ? `${raw.slice(0, 107)}...` : raw;
}

function buildMockResponseForHat(hatId: HatId, caseSubject: string): string {
  switch (hatId) {
    case 'white':
      return `**Known Facts & Baseline Parameters**
- **Case Before the Court:** Evaluation of *"${caseSubject}"*.
- **Decision Structure:** The proposal presents a directional commitment requiring resource allocation, execution bandwidth, and opportunity-cost trade-offs.
- **Verifiable Baseline:** Current operational capacity and stated constraints establish a finite runway for experimentation before full commitment.

**Implicit Assumptions in the Brief**
- Assumes target stakeholders or users will respond predictably once the transition begins.
- Assumes execution timeline can absorb integration friction without stalling parallel priorities.

**Critical Missing Data & Information Gaps**
- **Quantitative Thresholds:** Exact unit economics, break-even timeline, and maximum tolerable downside cap are not yet empirically locked.
- **Counterfactual Baseline:** We lack a 90-day baseline metric comparing the status quo drift against a small-scale pilot cohort.`;

    case 'red':
      return `**Immediate Gut Reaction**
My immediate gut reaction to *"${caseSubject}"* is a sharp tug-of-war between restless ambition and knot-in-the-stomach hesitation. There is an undeniable magnetic pull here—staying still feels stale, yet jumping blindly triggers a visceral fear of overextending.

**Unspoken Fears & Emotional Friction**
- **What nobody wants to admit out loud:** The anxiety isn't just about financial or technical failure; it is the fear of looking foolish or burning out mid-flight when initial enthusiasm collides with messy reality.
- **Decision Fatigue:** Carrying this unresolved dilemma is already draining mental energy.

**Where the Genuine Excitement Lies**
Beneath the nerves, there is genuine pride and creative spark in choosing growth over comfort. If the fear of an irreversible cliff is removed, the human energy behind this move is electric.`;

    case 'yellow':
      return `**Core Strategic Upside & Value Proposition**
- **Asymmetric Momentum:** Moving forward on *"${caseSubject}"* unlocks a step-change trajectory that incremental tweaks to the status quo cannot produce.
- **First-Mover Leverage:** Acting deliberately now captures learning velocity and positioning while others remain paralyzed by analysis.

**Compounding Second-Order Benefits**
- **Capability Flywheel:** Even the process of executing this initiative upgrades tooling, sharpens focus, and attracts higher-caliber opportunities.
- **Psychological Clarity:** Converting raw Red Hat excitement into structured execution replaces stagnant anxiety with measurable daily progress.

**Best-Case Trajectory & Conditions for Victory**
When paired with clear telemetry (addressing White Hat's data gaps), this path positions the decision-maker for high-leverage upside within the next two quarters.`;

    case 'black':
      return `**Primary Failure Modes & Structural Flaws**
- **The All-or-Nothing Cliff:** Treating *"${caseSubject}"* as a binary, irreversible leap exposes the plan to severe downside if the Yellow Hat's optimistic adoption curve lags by even 30–50%.
- **Bandwidth Cannibalization:** Execution overhead regularly exceeds initial estimates by 2x, threatening core stability while the new bet is still unproven.

**Hidden Costs & Second-Order Traps**
- **Sunk-Cost Escalation:** Without pre-committed kill criteria, early ambiguity often pressures decision-makers into throwing good resources after bad.
- **Context-Switching Tax:** Fragmented focus across legacy commitments and the new direction degrades quality on both fronts.

**Fragile Assumptions That Could Collapse the Plan**
White Hat already flagged missing baseline metrics. Proceeding at 100% scale before validating those unknown variables turns a calculated bet into an unhedged gamble.`;

    case 'green':
      return `**Reframing the Dilemma (Breaking the False Choice)**
We do not have to choose between reckless full-scale commitment and timid stagnation on *"${caseSubject}"*. Convert this binary cliff into a **Two-Stage Asymmetric Option**.

**Creative Mitigations for Black Hat's Risks**
- **Time-Boxed Canary Sandbox:** Isolate Black Hat's bandwidth and sunk-cost traps by capping Phase 1 to a strict 21-day, fixed-budget micro-pilot before touching core operations.
- **Pre-Signed Kill Switch:** Define three objective "Go / No-Go" telemetry triggers upfront so ego never overrides data.

**Unconventional Pivots & Low-Risk Experiments**
- **Concierge / Shadow Proof-of-Concept:** Validate demand and workflow friction manually with a small group first, capturing 80% of the Yellow Hat's learning upside at less than 15% of the Black Hat's exposure.`;

    case 'blue':
      return `### Executive Summary
The Court has completed its six-hat deliberation on **"${caseSubject}"**. While the strategic upside (Yellow Hat) and intrinsic motivation (Red Hat) are compelling, the evidence gaps (White Hat) and structural exposure of an all-or-nothing leap (Black Hat) require adopting Green Hat's staged, risk-capped architecture.

### Key Consensus & Tensions
- **Council Alignment:** Both emotional intuition (Red Hat) and strategic logic (Yellow Hat) agree that indefinite inaction carries a high stagnation cost.
- **Central Tension Resolved:** Black Hat rightly exposed the danger of an unhedged commitment while key metrics (White Hat) remain unverified. Green Hat resolves this deadlock by replacing a binary leap with a time-boxed canary experiment.

### Final Verdict
**Verdict: Proceed with Conditions**
**Confidence Level:** High (Contingent on enforcing strict pre-commit telemetry and a capped Phase 1 validation window before full resource lock-in).

### Actionable Next Steps
- **1. Close White Hat's Top Information Gap (Days 1–3):** Define the exact baseline metrics, maximum downside budget cap, and target unit economics in writing.
- **2. Launch Green Hat's 21-Day Canary Pilot (Days 4–24):** Execute a scoped, reversible proof-of-concept that preserves core operational stability.
- **3. Enforce Black Hat's Pre-Committed Kill/Scale Gate (Day 25):** Evaluate pilot telemetry against three objective success thresholds before authorizing full-scale rollout.`;
  }
}

function waitWithSignal(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export const mockAdapter: AIProviderAdapter = {
  id: 'gemini',

  async streamCompletion(params: StreamCompletionParams): Promise<void> {
    const { systemPrompt, messages, callbacks, signal } = params;
    const hatId = detectHatFromSystemPrompt(systemPrompt);
    const latestUserMessage =
      [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
    const caseSubject = extractCaseSubject(latestUserMessage);
    const fullResponse = buildMockResponseForHat(hatId, caseSubject);

    // Split into small token-like chunks preserving whitespace and newlines
    const tokens = fullResponse.match(/\S+\s*|\n+/g) ?? [fullResponse];
    let accumulated = '';

    try {
      // Brief initial deliberation pause for dramatic court pacing
      await waitWithSignal(260, signal);

      for (const token of tokens) {
        if (signal?.aborted) {
          return;
        }
        accumulated += token;
        callbacks.onToken(token);
        await waitWithSignal(28, signal);
      }

      callbacks.onComplete(accumulated);
    } catch (error: unknown) {
      if (
        signal?.aborted ||
        (error instanceof DOMException && error.name === 'AbortError')
      ) {
        return;
      }
      callbacks.onError(
        error instanceof Error
          ? error
          : new Error('Mock simulation interrupted.'),
      );
    }
  },

  async testConnection(): Promise<ConnectionTestResult> {
    return {
      ok: true,
      message:
        'Demo Mode is active. The 5+1 Decision Court will run using the built-in interactive simulator (no API key required).',
      latencyMs: 12,
    };
  },
};
