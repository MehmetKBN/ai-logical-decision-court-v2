import { BlueHatVerdictPanel } from '../court/BlueHatVerdictPanel';
import { HatCard } from '../court/HatCard';

/**
 * Responsive 5 + 1 Decision Courtroom Layout:
 * - Upper Council Bench (3 columns on lg+): Turn #1 White Hat, Turn #2 Red Hat, Turn #3 Yellow Hat
 * - Lower Council Bench (2 columns on lg+): Turn #4 Black Hat, Turn #5 Green Hat
 * - Central Head Judge Chamber (Full-width focal bench): Turn #6 Blue Hat Verdict Panel
 *
 * On mobile/tablet (< lg), all 6 chambers flow naturally in strict chronological speaking order (1 -> 6).
 */
export function CourtroomGrid() {
  return (
    <div className="space-y-6">
      {/* Upper Council Tier: Turns 1, 2, 3 (Facts, Intuition, Optimism) */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <HatCard hatId="white" />
        <HatCard hatId="red" />
        <div className="md:col-span-2 lg:col-span-1">
          <HatCard hatId="yellow" />
        </div>
      </div>

      {/* Lower Council Tier: Turns 4, 5 (Critical Risks & Creative Mitigations) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <HatCard hatId="black" />
        <HatCard hatId="green" />
      </div>

      {/* Central Head Judge Bench: Turn 6 (Blue Hat Executive Synthesis & Final Verdict) */}
      <BlueHatVerdictPanel />
    </div>
  );
}
